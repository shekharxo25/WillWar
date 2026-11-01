"use client";
import Script from "next/script";
import { useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"; // Cloudflare test key: always passes

/** Pledge list: one email, verified by Turnstile. The Turnstile script loads on the landing page only. */
export function PledgeList() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const token = String(form.get("cf-turnstile-response") ?? "");
    if (!email.includes("@")) {
      setError("Enter an email address, like name@example.com.");
      return;
    }
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, token, source: "landing" }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "failed");
      setState("done");
    } catch (err) {
      setState("error");
      setError(
        (err as Error).message === "rate_limited"
          ? "Too many tries. Wait a minute and send it again."
          : "That didn't go through. Check your connection and send it again.",
      );
    }
  }

  if (state === "done") {
    return <p className="l-body mt-6 font-semibold">You&apos;re on the list. One email when the next season opens.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-[480px]" noValidate>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <label htmlFor="pledge-email" className="text-[15px] leading-5 text-text-2">
        Email
      </label>
      <div className="mt-2 flex flex-col gap-3 min-[480px]:flex-row">
        <input
          id="pledge-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="name@example.com"
          aria-invalid={!!error}
          className="h-[52px] w-full flex-1 rounded-button bg-raised px-4 text-[17px] text-text outline-none placeholder:text-text-3 focus-visible:shadow-[inset_0_0_0_1px_var(--text)]"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="press h-[52px] shrink-0 rounded-button bg-primary px-5 text-[17px] leading-[22px] font-semibold text-on-primary disabled:opacity-40"
        >
          Add me
        </button>
      </div>
      <div className="cf-turnstile mt-3" data-sitekey={SITE_KEY} data-theme="auto" data-size="flexible" />
      {error && <p className="mt-2 text-[13px] leading-[18px] text-destructive">{error}</p>}
      <p className="mt-2 text-[13px] leading-[18px] text-text-2">Plain subject lines. Unsubscribe in one tap.</p>
    </form>
  );
}
