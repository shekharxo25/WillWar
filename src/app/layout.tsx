import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { publicEnv } from "@/env";
import "./globals.css";

// "WillWar Digits": Nunito (SIL OFL), self-hosted by next/font at build time.
// Used only behind ui-rounded for numerals (DESIGN.md section 3).
const digits = Nunito({
  variable: "--font-digits",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: { default: "WillWar — Make it to December.", template: "%s · WillWar" },
  description:
    "A streak clock that counts every second, a three-minute game for when the urge hits, and a private leaderboard with the friends you trust. Free. 18+.",
  applicationName: "WillWar",
  appleWebApp: { capable: true, title: "WillWar", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Applies the Settings appearance override before first paint (no flash).
const themeScript = `try{var t=localStorage.getItem("ww-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;var w=localStorage.getItem("ww-water");if(w)document.documentElement.dataset.water=w}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={digits.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
