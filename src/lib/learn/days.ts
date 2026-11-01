import { MILESTONES } from "@/lib/time";

/** One practical tip per day. Routines and environment only: no physiological claims. */
export const DAY_TIPS: string[] = [
  "Pick your reason and tell one friend. Then decide where your phone sleeps tonight.",
  "Write down the hour that usually gets loud. That's where your plan goes.",
  "Boredom shows up early. Have a three-minute plan ready: a round, a walk, or a call.",
  "Make one if-then plan: if I'm in bed with my phone after ten, then it goes on the hall charger.",
  "Get outside for ten minutes before dinner. A change of room is half the job.",
  "Set a lights-out time and a reminder 30 minutes before it.",
  "First plate on the wall. Look back at the week and keep the one habit that helped most.",
  "Notice your triggers without judging them. Late night, bored, alone, scrolling: which one is yours?",
  "Cook something tonight. Busy hands and a full evening leave less room for autopilot.",
  "Double digits. Check in early, then put the phone away for the night.",
  "If an urge builds, stand up first. Decisions are easier on your feet.",
  "Plan your weekend evenings now, before they plan themselves.",
  "Send someone in your camp a nudge. Backing others up keeps you in the habit too.",
  "Halfway. Your log shows what sets you off. Move one of those things out of the way tonight.",
  "Take a walk without your phone. Twenty minutes is enough.",
  "Swap one evening scroll for something with an ending: a chapter, an episode, a workout.",
  "Write three if-then plans for your riskiest moments and keep them somewhere you'll see.",
  "If tonight feels long, go a round before you decide anything.",
  "Tidy the room you spend your evenings in. Fewer cues, fewer arguments with yourself.",
  "Look at your before-and-after round numbers. That's your own evidence the drop is real.",
  "Three weeks. The routine does more of the work now. Don't loosen the bedtime.",
  "Pick one habit from this month you want to keep in December.",
  "Message a friend you haven't spoken to in a while. Connection is a good use of an evening.",
  "If you've reset this month, you're still here. Pick one thing to change tonight and carry on.",
  "Keep your hardest hour busy. Book something into it today, even a phone call.",
  "Check in early tonight and leave the phone in another room.",
  "Plan the last weekend now: where you'll be, and what you'll do at your usual hard hour.",
  "Write down what has worked this month, in a sentence each.",
  "One more day after this. Same routine, same check-in, same time.",
  "You went the distance. The record stays on the wall. Decide calmly whether to go again.",
];

export function nextMilestone(day: number): number | null {
  return (MILESTONES as readonly number[]).find((m) => m > day) ?? null;
}
