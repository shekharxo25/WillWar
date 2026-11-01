import Link from "next/link";
import { Mark } from "@/components/brand/Mark";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-grouped">
      <header className="mx-auto flex max-w-[760px] items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-headline font-semibold">
          <Mark size={28} tile /> WillWar
        </Link>
        <Link href="/app/start" className="pressable rounded-full bg-tide px-4 py-2 text-subhead font-semibold text-on-tide">
          Start my 30 days
        </Link>
      </header>
      <main className="mx-auto max-w-[760px] px-4 pb-20 sm:px-6 [&_h1]:text-large-title [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-title-2 [&_h2]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_p]:text-body [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-body">
        {children}
      </main>
    </div>
  );
}
