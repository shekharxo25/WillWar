/**
 * Email adapter notes. WillWar sends no email itself:
 *  - Sign-in codes (6 digits) are sent by Supabase Auth.
 *    Local: the Supabase CLI mail catcher (Inbucket) at http://localhost:54324.
 *    Production: Supabase Auth custom SMTP via Resend (smtp.resend.com, port 465, user "resend",
 *    password = Resend API key). Configure in Supabase dashboard > Auth > SMTP.
 *  - Templates must use the plain subjects below. Discreet by default: no mention of the
 *    challenge's subject in any subject line or body (non-negotiable 10).
 *  - Device mode (no Supabase env) has no email at all.
 */
export const EMAIL_SUBJECTS = {
  signInCode: "Your WillWar code",
  confirmSignup: "Your WillWar code",
  emailChange: "Confirm your new email for WillWar",
  accountDeleted: "Your WillWar account is deleted",
} as const;

/** Template body for the Supabase "Magic link / OTP" email: the code only, no link to open in a browser. */
export const OTP_TEMPLATE_HTML = `<p>Your WillWar code is <strong>{{ .Token }}</strong>.</p>
<p>It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>`;

export function emailMode(): "supabase_local" | "supabase_smtp" | "none" {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url) return "none";
  return /localhost|127\.0\.0\.1/.test(url) ? "supabase_local" : "supabase_smtp";
}
