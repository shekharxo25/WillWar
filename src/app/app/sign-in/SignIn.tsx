"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmailCode, signInWithGoogle } from "@/components/onboarding/EmailCode";

export function SignIn() {
  const { store, refresh, snap } = useApp();
  const router = useRouter();
  const after = async () => {
    await refresh();
    const s = await store.load();
    router.replace(s ? "/app/today" : "/app/start");
  };
  return (
    <main className="pt-safe flex min-h-dvh flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <h1 className="display mt-14 text-[40px] leading-[40px]">SIGN IN.</h1>
      {store.mode === "cloud" ? (
        <div className="mt-6 space-y-3">
          <EmailCode onSignedIn={after} />
          <div className="py-1 text-center text-[13px] text-text-2">or</div>
          <Button variant="secondary" onClick={() => signInWithGoogle("/app/today")}>Continue with Google</Button>
          <p className="pt-2 text-[13px] leading-[18px] text-text-2">Signing in also restores Pro.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-[17px] leading-[22px] text-text-2">
            {snap ? "Your record is saved on this phone." : "This build keeps your record on your phone, so there's nothing to sign in to yet."}
          </p>
          <ButtonLink href={snap ? "/app/today" : "/app/start"}>{snap ? "Open Today" : "Start my 30 days"}</ButtonLink>
        </div>
      )}
    </main>
  );
}
