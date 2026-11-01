// Generates PWA icons and iOS launch images from the WillWar mark (a "W" drawn as two
// wave crests on the water gradient). Run with `npm run icons`; outputs are committed.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = new URL("../public/icons/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const TIDE = "#0B6E7F";
const TIDE_DEEP = "#0A3F55";
const CREST = "M4 8.5C6 8.5 7.5 23.5 10 23.5S13.5 12.5 16 12.5 19.5 23.5 22 23.5 26 8.5 28 8.5";

function tile({ size, markScale = 0.78, radius = 0, monochrome = false, background = true }) {
  const inset = (32 * (1 - markScale)) / 2;
  const bg = background
    ? `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TIDE}" stop-opacity="0.9"/><stop offset="1" stop-color="${TIDE_DEEP}"/></linearGradient></defs>
       <rect width="32" height="32" rx="${radius}" fill="${TIDE_DEEP}"/><rect width="32" height="32" rx="${radius}" fill="url(#g)"/>`
    : "";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${bg}
    <g transform="translate(${inset} ${inset}) scale(${markScale})">
      <path d="${CREST}" fill="none" stroke="${monochrome ? "#FFFFFF" : "#FFFFFF"}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </g></svg>`);
}

const jobs = [
  ["icon-192.png", tile({ size: 192 })],
  ["icon-512.png", tile({ size: 512 })],
  // Maskable: full-bleed background, mark inside the 80% safe zone.
  ["icon-maskable-512.png", tile({ size: 512, markScale: 0.6 })],
  ["icon-monochrome-512.png", tile({ size: 512, markScale: 0.7, background: false, monochrome: true })],
  ["icon-monochrome-96.png", tile({ size: 96, markScale: 0.8, background: false, monochrome: true })],
  // iOS: 180×180, no transparency.
  ["apple-touch-icon.png", tile({ size: 180 })],
];

for (const [name, svg] of jobs) {
  await sharp(svg).png().toFile(new URL(name, OUT).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
}

// iOS launch images (portrait) for current iPhone sizes: dark water with the mark.
const LAUNCH = [
  [1290, 2796],
  [1179, 2556],
  [1170, 2532],
  [750, 1334],
];
for (const [w, h] of LAUNCH) {
  const mark = 160 * (w / 1179);
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000000"/><stop offset="1" stop-color="${TIDE_DEEP}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <g transform="translate(${(w - mark) / 2} ${(h - mark) / 2}) scale(${mark / 32})">
      <path d="${CREST}" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </g></svg>`);
  await sharp(svg).png().toFile(new URL(`launch-${w}x${h}.png`, OUT).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
}

console.log("icons written to public/icons/");
