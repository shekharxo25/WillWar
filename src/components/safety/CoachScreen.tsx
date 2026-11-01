"use client";

import { ArrowLeft, PaperPlaneRight, Waves } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Gate } from "@/components/app/Gate";
import { ButtonLink } from "@/components/ui/Button";
import { cloudEnabled } from "@/env";
import type { CrisisResource } from "@/lib/config/crisis-resources";
import type { Snapshot } from "@/lib/domain/types";
import { useWillWar } from "@/lib/store/provider";
import { CrisisCard } from "./CrisisCard";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const CRISIS_MARKER = "[[CRISIS]]";

/**
 * "Talk it through" (Pro). The conversation exists only in this component's memory:
 * leaving the screen discards it, and the server stores none of it.
 */
export function CoachScreen() {
  return <Gate>{(s) => <Coach snapshot={s} />}</Gate>;
}

function Coach({ snapshot }: { snapshot: Snapshot }) {
  const { isPro, store } = useWillWar();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<{ resources: CrisisResource[]; warChestRelease: boolean; under18: boolean } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-dvh flex-col px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <Link href="/app/today" className="pressable -ml-1 inline-flex min-h-11 w-fit items-center gap-1 text-body text-tide">
        <ArrowLeft size={18} aria-hidden /> Today
      </Link>
      <h1 className="mt-1 text-large-title font-bold">Talk it through</h1>
      {children}
    </main>
  );

  if (!cloudEnabled || snapshot.mode === "device") {
    return shell(
      <p className="mt-3 text-body text-label-2">The coach needs an online account, which this build doesn&apos;t have. Ride it out is always here.</p>,
    );
  }
  if (!isPro) {
    return shell(
      <>
        <p className="mt-3 text-body text-label-2">A private coach for hard evenings is part of Pro. Nothing you say is saved.</p>
        <ButtonLink href="/app/pro" full className="mt-6">
          See Pro
        </ButtonLink>
      </>,
    );
  }

  const send = async () => {
    const text = draft.trim();
    if (!text || busy || crisis) return;
    const history: Turn[] = [...turns, { role: "user", content: text }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = (await res.json()) as {
          crisis?: boolean;
          resources?: CrisisResource[];
          warChestRelease?: boolean;
          under18?: boolean;
          error?: { message: string };
        };
        if (data.crisis && data.resources) {
          setCrisis({ resources: data.resources, warChestRelease: Boolean(data.warChestRelease), under18: Boolean(data.under18) });
          setTurns(history);
          void store.logEvent("crisis_card_shown");
        } else {
          setNotice(data.error?.message ?? "The coach couldn't answer. Try again.");
          setTurns(history.slice(0, -1));
          setDraft(text);
        }
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        if (reply.startsWith(CRISIS_MARKER)) break;
        setTurns([...history, { role: "assistant", content: reply }]);
        endRef.current?.scrollIntoView({ block: "end" });
      }
      if (reply.startsWith(CRISIS_MARKER)) {
        const { countryFromTimezone, crisisResourcesFor } = await import("@/lib/config/crisis-resources");
        setCrisis({ resources: crisisResourcesFor(countryFromTimezone(snapshot.profile.timezone)), warChestRelease: false, under18: false });
        setTurns(history);
      }
    } catch {
      setNotice("You're offline or the coach is unavailable. Ride it out works offline.");
      setTurns(history.slice(0, -1));
      setDraft(text);
    } finally {
      setBusy(false);
    }
  };

  return shell(
    <>
      <p className="mt-1 text-footnote text-label-2">An AI coach, not a person. Nothing you say is saved.</p>
      <div className="mt-4 flex-1 space-y-3" aria-live="polite">
        {turns.length === 0 && !crisis && (
          <p className="rounded-card bg-surface p-4 text-body text-label-2">What&apos;s going on right now? A sentence is enough.</p>
        )}
        {turns.map((t, i) => (
          <p
            key={i}
            className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-body ${t.role === "user" ? "ml-auto bg-tide text-on-tide" : "bg-surface"}`}
          >
            {t.content || <span className="text-label-3">…</span>}
          </p>
        ))}
        {crisis && <CrisisCard {...crisis} />}
        {notice && <p className="rounded-cell bg-tertiary p-3 text-subhead">{notice}</p>}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-0 mt-4 space-y-2 bg-grouped pt-2">
        {!crisis && (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="flex-1">
              <span className="sr-only">Message</span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={1}
                maxLength={2000}
                placeholder="Message"
                className="max-h-32 min-h-11 w-full resize-none rounded-[22px] bg-surface px-4 py-2.5 text-body ring-[0.5px] ring-separator focus:ring-2 focus:ring-tide focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label="Send"
              className="pressable flex size-11 shrink-0 items-center justify-center rounded-full bg-tide text-on-tide disabled:bg-tertiary disabled:text-label-3"
            >
              <PaperPlaneRight size={20} weight="fill" aria-hidden />
            </button>
          </form>
        )}
        <Link href="/app/urge" className="pressable flex min-h-11 items-center justify-center gap-2 text-headline text-tide">
          <Waves size={18} weight="bold" aria-hidden /> Ride it out instead
        </Link>
        <p className="text-center text-footnote text-label-2">Not medical advice. If you&apos;re in danger, call your local emergency number.</p>
      </div>
    </>,
  );
}
