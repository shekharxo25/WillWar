import type { MetadataRoute } from "next";

// Discreet by default: the manifest never mentions the challenge's subject.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app/",
    name: "WillWar",
    short_name: "WillWar",
    description: "A 30-day streak tracker.",
    scope: "/app/",
    start_url: "/app/today?source=pwa",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#0E0E0E",
    background_color: "#0E0E0E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/monochrome-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
    shortcuts: [
      {
        name: "Go a round",
        short_name: "Go a round",
        url: "/app/round",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
