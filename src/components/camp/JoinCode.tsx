"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ButtonLink } from "@/components/ui/Button";
import type { StoreError } from "@/lib/store/types";
import { CAMP_ERRORS } from "./board";

export const JOIN_CODE_KEY = "ww.joinCode";

/**
 * Invite links work before sign-in: without a record, stash the code and start onboarding
 * (onboarding joins after it finishes). With a record, join and open the camp.
 */
export function JoinCode() {
  const { code } = useParams<{ code: string }>();
  const { store, snap, loading, toast } = useApp();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (loading || ran.current) return;
    ran.current = true;
    const clean = String(code ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    if (!snap) {
      try {
        localStorage.setItem(JOIN_CODE_KEY, clean);
      } catch {}
      router.replace("/app/start");
      return;
    }
    store
      .joinCamp(clean)
      .then((id) => {
        toast("You're in the camp.");
        router.replace(`/app/camp/${id}`);
      })
      .catch((e: StoreError) => setError(CAMP_ERRORS[e.code] ?? "That invite didn't work. Ask for a new one."));
  }, [loading, snap, code, store, router, toast]);

  return (
    <main className="pt-safe px-4 pt-16">
      <h1 className="display text-[40px] leading-[40px]">JOIN A CAMP</h1>
      {error ? (
        <>
          <p className="mt-4 text-[17px] leading-[22px]">{error}</p>
          <ButtonLink href="/app/camp" variant="secondary" className="mt-6">Go to Camp</ButtonLink>
        </>
      ) : (
        <p className="mt-4 text-[17px] leading-[22px] text-text-2">Opening the camp.</p>
      )}
    </main>
  );
}
