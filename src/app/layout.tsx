import type { Metadata, Viewport } from "next";
import { leagueGothic, dseg } from "./fonts";
import "./globals.css";
import { LAUNCH_IMAGES } from "@/components/shell/launch-images";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "WillWar", template: "%s · WillWar" },
  description: "A 30-day streak tracker for adults. An urge is a round. Last three minutes.",
  applicationName: "WillWar",
  appleWebApp: { capable: true, title: "WillWar", statusBarStyle: "black-translucent", startupImage: LAUNCH_IMAGES },
  icons: {
    icon: [{ url: "/icons/favicon.svg", type: "image/svg+xml" }, { url: "/icons/favicon-32.png", sizes: "32x32" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E0E0E",
  colorScheme: "dark light",
};

// Applies the saved appearance before first paint (no flash). Values: system | dark | light.
const themeScript = `try{var t=localStorage.getItem('ww.theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${leagueGothic.variable} ${dseg.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
