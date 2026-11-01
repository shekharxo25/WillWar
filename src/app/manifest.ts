import type { MetadataRoute } from "next";

// Discreet on the home screen: the name never mentions the challenge's subject.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app/",
    name: "WillWar",
    short_name: "WillWar",
    description: "A 30-day streak tracker.",
    start_url: "/app/today?source=pwa",
    scope: "/app/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#0B6E7F",
    categories: ["health", "lifestyle", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-monochrome-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
    shortcuts: [
      {
        name: "Ride it out",
        short_name: "Ride it out",
        url: "/app/urge?source=shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
