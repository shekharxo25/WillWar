import type { Game } from "@/lib/store/types";

export type GameSummary = { label: string; value: number };

/** Every game module implements this. RoundHost owns the clock; games own their canvas. */
export interface GameInstance {
  start(): void;
  pause(): void;
  resume(): void;
  dispose(): void;
  summary(): GameSummary;
}

export type Palette = {
  bg: string;
  raised: string;
  text: string;
  text2: string;
  text3: string;
  hairline: string;
  brass: string;
  ink: string;
  /** Label colour on a --text (tape/ink) fill; flips with the theme. */
  onText: string;
  /** Resolved League Gothic family list (canvas can't read CSS variables). */
  display: string;
};

export type GameOptions = {
  reducedMotion: boolean;
  palette: Palette;
  /** Short text cue for the live region under the timer ("Breathe in", "Your turn"). */
  onCue: (text: string) => void;
};

export type GameFactory = (canvas: HTMLCanvasElement, opts: GameOptions) => GameInstance;

export const GAMES: { id: Game; name: string; line: string; pro: boolean }[] = [
  { id: "kitbag", name: "Kitbag", line: "Pack the bag.", pro: false },
  { id: "bag", name: "Bag", line: "Breathe with the bag.", pro: false },
  { id: "combos", name: "Combos", line: "Hit the pads.", pro: true },
];

export function isGame(v: string): v is Game {
  return v === "kitbag" || v === "bag" || v === "combos";
}

/** Lazy-loaded game modules (code-split; only the chosen game downloads). */
export async function loadGame(id: Game): Promise<GameFactory> {
  if (id === "kitbag") return (await import("./kitbag/game")).createKitbag;
  if (id === "bag") return (await import("./bag/game")).createBag;
  return (await import("./combos/game")).createCombos;
}
