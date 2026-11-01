"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "@phosphor-icons/react";
import { useApp, useNow } from "@/components/AppProvider";
import { CrisisCard } from "@/components/CrisisCard";
import { Paywall } from "@/components/pro/Paywall";
import { Screen } from "@/components/ui/Screen";
import { ButtonLink } from "@/components/ui/Button";
import { isPro } from "@/lib/store/engine";
import type { CoachEvent } from "@/lib/ai/engine";

type Msg = { role: "user" | "assistant"; content: string };

const OPENER = "I'm here. What's going on right now?";

/** Pro coach. Messages live in React state only and are gone when you leave. */
export function CoachChat() {
  const { snap, loading } = useApp();
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState<null | { under18: boolean }>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const now = useNow(60_000);
  const pro = !!snap && !!now && isPro(snap.entitlement, now);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, crisis]);

  async function send() {
    const text = draft.trim();
    if (!text || busy || crisis) return;
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      if (!res.ok || !res.body) {
        const err = ((await res.json().catch(() => ({}))) as { error?: string }).error;
        setMessages(history);
        setNotice(
          err === "daily_limit"
            ? "That's today's 20 turns. Go a round, or come back tomorrow."
            : err === "pro_required"
              ? "The coach is part of Pro."
              : "The coach can't be reached right now. Go a round instead.",
        );
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as CoachEvent;
          if (ev.type === "crisis") {
            setMessages(history);
            setCrisis({ under18: ev.under18 });
            return;
          }
          reply = ev.type === "redirect" ? ev.text : reply + ev.text;
          const shown = reply;
          setMessages([...history, { role: "assistant", content: shown }]);
        }
      }
    } catch {
      setMessages(history);
      setNotice("The coach can't be reached right now. Go a round instead.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || (snap && !now)) return <Screen title="TALK IT THROUGH" back="/app/today"><div className="skeleton h-24 w-full" /></Screen>;

  if (!pro) {
    return (
      <Screen title="TALK IT THROUGH" back="/app/today">
        <p className="mb-5 text-[17px] leading-[22px] text-text-2">
          A coach for the next few minutes of an urge. Part of Pro. Go a round is always free.
        </p>
        <Paywall source="feature" onContinueFree={() => router.push("/app/round")} />
      </Screen>
    );
  }

  return (
    <Screen title="TALK IT THROUGH" back="/app/today" bottomPad={false}>
      <div className="flex min-h-[calc(100dvh-180px)] flex-col pb-[calc(env(safe-area-inset-bottom)+96px)]">
        <ol className="flex flex-1 flex-col gap-3" aria-live="polite">
          <li className="max-w-[85%] self-start rounded-card bg-raised px-4 py-3 text-[17px] leading-[22px]">{OPENER}</li>
          {messages.map((m, i) => (
            <li
              key={i}
              className={`max-w-[85%] rounded-card px-4 py-3 text-[17px] leading-[22px] ${
                m.role === "user" ? "self-end bg-primary text-on-primary" : "self-start bg-raised"
              }`}
            >
              {m.content || <span className="inline-block h-4 w-10 skeleton align-middle" aria-label="Coach is typing" />}
            </li>
          ))}
        </ol>
        {crisis && (
          <div className="mt-4">
            <CrisisCard country={snap?.profile.country} under18={crisis.under18} stakeActive={snap?.warChest?.mode === "stake" && snap.warChest.status === "active"} />
            <p className="mt-4 text-[15px] leading-5 text-text-2">This conversation has ended. Go a round and the rest of the app are still here.</p>
            <div className="mt-4">
              <ButtonLink href="/app/round" variant="secondary">Go a round</ButtonLink>
            </div>
          </div>
        )}
        {notice && <p className="mt-4 text-[15px] leading-5 text-text-2">{notice}</p>}
        <div ref={endRef} />
      </div>
      {!crisis && (
        <form
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-bg px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="flex items-center gap-2">
            <label htmlFor="coach-input" className="sr-only">Message</label>
            <input
              id="coach-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
              placeholder="What's going on?"
              autoComplete="off"
              className="h-[52px] min-w-0 flex-1 rounded-button bg-raised px-4 text-[17px] text-text placeholder:text-text-3 outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={busy || !draft.trim()}
              className="press flex h-[52px] w-[52px] items-center justify-center rounded-button bg-primary text-on-primary disabled:opacity-40"
            >
              <ArrowUp weight="bold" size={22} />
            </button>
          </div>
          <p className="mt-2 text-center text-[13px] leading-[18px] text-text-2">This conversation isn&apos;t saved.</p>
        </form>
      )}
    </Screen>
  );
}
