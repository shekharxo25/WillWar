import type { Metadata } from "next";
import { SignIn } from "@/components/onboarding/SignIn";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <SignIn />;
}
