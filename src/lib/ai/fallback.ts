// Curated morning lines. Used offline, in device mode, and whenever the model output
// fails validation or filters (docs/guardrails/ai-safety.md). Pure: safe in the browser.
// Voice: plain, steady, adult, second person. No health claims, no money, no shame.
import type { Tone } from "@/lib/domain/constants";

interface Line {
  tone: Tone;
  /** Inclusive day range the line fits. {d} is replaced by the day number. */
  from: number;
  to: number;
  text: string;
}

export const FALLBACK_LINES: Line[] = [
  // Steady
  { tone: "steady", from: 0, to: 0, text: "Your clock starts soon. Before it does, decide where your phone sleeps tonight and leave it there." },
  { tone: "steady", from: 1, to: 1, text: "Day 1. Nothing to prove yet. Just get through this one evening the plain, quiet way." },
  { tone: "steady", from: 2, to: 6, text: "Day {d}. You have already handled a few evenings like this one. Handle tonight the same way." },
  { tone: "steady", from: 2, to: 13, text: "Day {d}. Keep the evening simple: eat, walk, phone in another room, lights out at a normal hour." },
  { tone: "steady", from: 7, to: 7, text: "Day 7. A full week behind you. Keep the routine quiet and steady, exactly like the last six days." },
  { tone: "steady", from: 8, to: 13, text: "Day {d}. The novelty has worn off and the routine is what is left. That is the point." },
  { tone: "steady", from: 14, to: 14, text: "Day 14. Halfway there. Same plan as yesterday, same quiet evening, same phone in another room." },
  { tone: "steady", from: 15, to: 29, text: "Day {d}. You know your hard hours by now. Plan to be somewhere else when they arrive tonight." },
  { tone: "steady", from: 15, to: 40, text: "Day {d}. Nothing dramatic is needed today. Keep doing the small, boring things that got you this far." },
  { tone: "steady", from: 21, to: 21, text: "Day 21. Three weeks of evenings handled. Tonight only asks for one more, done the same way." },
  { tone: "steady", from: 30, to: 999, text: "Day {d}. You made it here one ordinary evening at a time. Keep tonight ordinary too." },
  { tone: "steady", from: 2, to: 999, text: "Day {d}. When the urge shows up, notice it, start a three-minute game, and let it pass." },
  // Stoic
  { tone: "stoic", from: 0, to: 1, text: "Begin where you are. The first day asks only for this one day, nothing more and nothing less." },
  { tone: "stoic", from: 2, to: 6, text: "Day {d}. The urge asks for your attention. Give it three minutes of slow breathing instead." },
  { tone: "stoic", from: 2, to: 13, text: "Day {d}. You cannot choose every thought that arrives. You can choose what you do in the next three minutes." },
  { tone: "stoic", from: 7, to: 13, text: "Day {d}. What you practise every day becomes who you are. Practise holding the line again tonight." },
  { tone: "stoic", from: 7, to: 7, text: "Day 7. A week of choosing the same thing. Choose it once more today, calmly and without fuss." },
  { tone: "stoic", from: 14, to: 20, text: "Day {d}. Urges rise and fall like weather. Watch this one pass the way you have watched the others." },
  { tone: "stoic", from: 14, to: 14, text: "Day 14. Half the distance is behind you. Walk the rest of it at the same patient pace." },
  { tone: "stoic", from: 21, to: 29, text: "Day {d}. The line is drawn and you know where it is. Keep to it today without fuss." },
  { tone: "stoic", from: 21, to: 40, text: "Day {d}. Discipline is quiet and unremarkable. Do the next small right thing and let that be enough." },
  { tone: "stoic", from: 30, to: 999, text: "Day {d}. Discipline is quiet, and yours has been. Carry the same calm into whatever comes next." },
  { tone: "stoic", from: 2, to: 999, text: "Day {d}. Discomfort is information, not an order. Notice it, breathe through it, and carry on with your evening." },
  { tone: "stoic", from: 2, to: 999, text: "Day {d}. The evening will try to bargain with you. Decline politely and go to bed on time." },
  // Coach
  { tone: "coach", from: 0, to: 1, text: "Day 1. One job tonight: put your phone out of the bedroom before you get into bed." },
  { tone: "coach", from: 2, to: 6, text: "Day {d}. Phone out of the bedroom tonight. That is the whole plan, and it is enough." },
  { tone: "coach", from: 2, to: 13, text: "Day {d}. Name your hardest hour today and put something else in it: a walk, a call, or a game." },
  { tone: "coach", from: 7, to: 13, text: "Day {d}. Check in with your pact before nine tonight, then lights out at your usual time." },
  { tone: "coach", from: 7, to: 7, text: "Day 7. One week down. Tonight, repeat exactly what worked this week and change nothing." },
  { tone: "coach", from: 14, to: 20, text: "Day {d}. If the urge hits, stand up, leave the room, drink a glass of water, then start a game." },
  { tone: "coach", from: 14, to: 14, text: "Day 14. Halfway mark. Write down the one habit that helped most and do it again tonight." },
  { tone: "coach", from: 21, to: 29, text: "Day {d}. You are in the long stretch. Ride it out early tonight, not at midnight." },
  { tone: "coach", from: 21, to: 40, text: "Day {d}. Set a bedtime alarm thirty minutes early tonight and follow it when it goes off." },
  { tone: "coach", from: 30, to: 999, text: "Day {d}. Set your next goal before tonight ends, so tomorrow already has a plan." },
  { tone: "coach", from: 2, to: 999, text: "Day {d}. Do twenty squats the moment an urge starts. Then decide what to do next, not before." },
  { tone: "coach", from: 2, to: 999, text: "Day {d}. Charge your phone in the kitchen tonight. Fewer late screens means fewer hard moments." },
  // Playful
  { tone: "playful", from: 0, to: 1, text: "Day 1. The clock is ticking and it is firmly on your side. Give it a quiet evening to count." },
  { tone: "playful", from: 2, to: 8, text: "Day {d}. Single digits for a little while longer. Make tomorrow one day closer to a double." },
  { tone: "playful", from: 9, to: 9, text: "Day 9. Single digits for one more day. Make tomorrow a double." },
  { tone: "playful", from: 2, to: 13, text: "Day {d}. Your clock is a better story than anything on a screen tonight. Let it keep running." },
  { tone: "playful", from: 7, to: 7, text: "Day 7. A whole week. Your tide just passed its first marker, so give it a calm evening to celebrate." },
  { tone: "playful", from: 10, to: 20, text: "Day {d}. Double digits look good on you. Keep the streak gloriously boring tonight." },
  { tone: "playful", from: 14, to: 14, text: "Day 14. Halfway. The second half has the same evenings and a better view." },
  { tone: "playful", from: 21, to: 29, text: "Day {d}. Three weeks in. The tide is high and still rising, so keep your feet dry tonight." },
  { tone: "playful", from: 21, to: 40, text: "Day {d}. Your future self is already taking notes on tonight. Give them something calm to write." },
  { tone: "playful", from: 30, to: 999, text: "Day {d}. Full tide. Take a bow, then take a walk, then get a good night of sleep." },
  { tone: "playful", from: 2, to: 999, text: "Day {d}. If an urge knocks tonight, send it to the waiting room and play three minutes of Drift." },
  { tone: "playful", from: 2, to: 999, text: "Day {d}. Plot twist for tonight: you go to bed on time and the evening is completely uneventful." },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic for a given tone, day and seed (so the line doesn't change on reload). */
export function pickFallbackLine({ tone, day, seed }: { tone: Tone; day: number; seed: string }): string {
  const d = Math.max(0, Math.floor(day));
  const fits = FALLBACK_LINES.filter((l) => l.tone === tone && d >= l.from && d <= l.to);
  const pool = fits.length ? fits : FALLBACK_LINES.filter((l) => l.tone === "steady" && d >= l.from && d <= l.to);
  const line = pool[hash(`${seed}:${d}`) % pool.length] ?? FALLBACK_LINES[1];
  return line.text.replaceAll("{d}", String(d));
}
