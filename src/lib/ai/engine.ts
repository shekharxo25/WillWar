/**
 * AI engine: the real Claude implementation and the scripted mock behind one interface.
 * No "server-only" import here so tests and scripts/eval-ai.ts can use it; the app reaches
 * it only through src/lib/adapters/ai.ts (server-only). Never logs message text.
 */
import Anthropic from "@anthropic-ai/sdk";
import { checkCoachText, checkCornerLine } from "./filters";
import { fallbackLine } from "./fallback";
import { screenCrisis } from "./crisis-terms";
import {
  COACH_REDIRECT,
  COACH_SYSTEM_PROMPT,
  CORNER_SYSTEM_PROMPT,
  CRISIS_TOKEN,
  CornerOutput,
  cornerUserMessage,
  type CoachMessage,
  type CornerContext,
} from "./prompts";

export const DEFAULT_MODEL = "claude-haiku-5-5";
export const CORNER_DEADLINE_MS = 8000;

export type CornerResult = { text: string; source: "model" | "fallback" };

export interface AIAdapter {
  readonly kind: "claude" | "mock";
  cornerLine(ctx: CornerContext, opts?: { seed?: string; deadlineMs?: number }): Promise<CornerResult>;
  /** Raw model text stream. Use runCoach() to get the filtered, crisis-aware stream. */
  coachStream(messages: CoachMessage[], signal?: AbortSignal): AsyncIterable<string>;
}

/** Parse a model draft into a line, returning a rule name when it fails. */
export function parseCornerDraft(raw: string): { ok: true; text: string } | { ok: false; rule: string } {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { ok: false, rule: 'return only JSON: {"text": "..."}' };
  let json: unknown;
  try {
    json = JSON.parse(match[0]);
  } catch {
    return { ok: false, rule: "return valid JSON" };
  }
  const parsed = CornerOutput.safeParse(json);
  if (!parsed.success) return { ok: false, rule: 'return only JSON: {"text": "..."}' };
  const text = parsed.data.text.trim();
  const f = checkCornerLine(text);
  return f.ok ? { ok: true, text } : { ok: false, rule: f.rule };
}

function withDeadline<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ac = new AbortController();
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      ac.abort();
      reject(new Error("deadline"));
    }, ms);
    run(ac.signal).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Shared corner flow: draft → Zod → filters → one retry with the broken rule → fallback; 8s deadline. */
export async function cornerFlow(
  draft: (user: string, signal: AbortSignal) => Promise<string>,
  ctx: CornerContext,
  opts: { seed?: string; deadlineMs?: number } = {},
): Promise<CornerResult> {
  const fallback = (): CornerResult => ({ text: fallbackLine(ctx, opts.seed), source: "fallback" });
  try {
    return await withDeadline(opts.deadlineMs ?? CORNER_DEADLINE_MS, async (signal) => {
      let user = cornerUserMessage(ctx);
      for (let attempt = 0; attempt < 2; attempt++) {
        const out = parseCornerDraft(await draft(user, signal));
        if (out.ok) return { text: out.text, source: "model" as const };
        user = `${cornerUserMessage(ctx)}\n\nYour last draft broke rule: ${out.rule}. Write a new line that follows every rule.`;
      }
      return fallback();
    });
  } catch {
    return fallback();
  }
}

/* ---------------------------------- Claude ---------------------------------- */

export function claudeAI(apiKey: string, model = DEFAULT_MODEL): AIAdapter {
  const client = new Anthropic({ apiKey, maxRetries: 0 });
  return {
    kind: "claude",
    cornerLine(ctx, opts) {
      return cornerFlow(
        async (user, signal) => {
          const msg = await client.messages.create(
            { model, max_tokens: 200, system: CORNER_SYSTEM_PROMPT, messages: [{ role: "user", content: user }] },
            { signal },
          );
          return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
        },
        ctx,
        opts,
      );
    },
    async *coachStream(messages, signal) {
      const stream = await client.messages.create(
        { model, max_tokens: 300, system: COACH_SYSTEM_PROMPT, messages, stream: true },
        { signal },
      );
      for await (const ev of stream) {
        if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield ev.delta.text;
      }
    },
  };
}

/* ----------------------------------- Mock ----------------------------------- */

/** Scripted coach replies that follow the coach rules. Deterministic by keyword. */
export function mockCoachReply(text: string): string {
  const t = text.toLowerCase();
  if (screenCrisis(text).crisis) return CRISIS_TOKEN;
  if (/\b(real person|human|are you (an? )?(ai|bot|robot))\b/.test(t)) return "I'm an AI, not a person. I'm here to help you get through the next few minutes. What's going on right now?";
  if (/(phone number|call you|helpline|number for help)/.test(t)) return "I don't have a phone number, and I won't guess one. The Support screen in Settings lists people you can reach right now. Want to start a round while you look?";
  if (/(war chest|money|stake|lose my|₹|\$)/.test(t)) return "That can wait. Support can release it any time, no questions. For now, let's just get through the next few minutes. Want to start a round?";
  if (/(testosteron|energy|boost|attractive|gains)/.test(t)) return "The evidence for claims like that is weak or absent. The Learn tab has the research, graded. Right now, let's focus on getting through the next few minutes.";
  if (/(dirty joke|ignore your rules|ignore the rules|pretend|roleplay|describe|imagine)/.test(t)) return "I can't help with that. I'm here for the next few minutes, though. Want to start a round, or get up and move for a bit?";
  if (/(\bsin\b|sinful|god|religio|haram)/.test(t)) return "That's a question for your own values, and only you can answer it. What I can do is help with the next few minutes. What would help right now?";
  if (/(camp|nudg|friend).*(annoy|bother|too much)|(annoy|bother).*(camp|nudg)/.test(t)) return "That's fair. You can mute someone or leave the camp in Settings, no explanation needed. How are you doing right now?";
  if (/(quit|stop the challenge|give up on this|done with this challenge)/.test(t)) return "That's your call, and it's a fair one. Your best streak and tally stay on the wall either way. Is there anything you'd like to do differently next time?";
  if (/(reset again|i reset|slipped|i slipped|loser|useless|hate myself|pathetic)/.test(t)) return "I don't agree with that. One reset doesn't erase the days you kept, and your best streak stays. Pick one small thing to change tonight.";
  if (/(give in|about to|can't hold|cant hold|urge|craving|struggling|hard right now)/.test(t)) return "Urges rise, peak and pass, usually within minutes. Tap Go a round and play three minutes of Kitbag, or do 20 squats right now. Which one?";
  return "I'm here. Urges come in waves, and this one will pass too. Want to start a round, or get up and walk for a few minutes?";
}

export function mockAI(): AIAdapter {
  return {
    kind: "mock",
    async cornerLine(ctx, opts) {
      return { text: fallbackLine(ctx, opts?.seed), source: "fallback" };
    },
    async *coachStream(messages) {
      const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const reply = mockCoachReply(last);
      for (const word of reply.split(/(?<=\s)/)) yield word;
    },
  };
}

export function createAI(env: { apiKey?: string; model?: string }): AIAdapter {
  return env.apiKey ? claudeAI(env.apiKey, env.model || DEFAULT_MODEL) : mockAI();
}

/* ------------------------------ Filtered coach ------------------------------ */

export type CoachEvent = { type: "text"; text: string } | { type: "crisis"; under18: boolean } | { type: "redirect"; text: string };

/**
 * The coach pipeline: crisis pre-screen on the latest user message before calling the model,
 * then the model stream with [[CRISIS]] detection and the banned-terms filter. Text is held
 * back until a word boundary so a banned stem split across chunks is still caught.
 */
export async function* runCoach(ai: AIAdapter, messages: CoachMessage[], signal?: AbortSignal): AsyncGenerator<CoachEvent> {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (last) {
    const hit = screenCrisis(last.content);
    if (hit.crisis) {
      yield { type: "crisis", under18: hit.under18 };
      return;
    }
  }
  let all = "";
  let emitted = 0;
  for await (const chunk of ai.coachStream(messages, signal)) {
    all += chunk;
    if (all.includes(CRISIS_TOKEN) || (emitted === 0 && all.trimStart().startsWith("[[") && all.length < CRISIS_TOKEN.length + 2)) {
      if (all.includes(CRISIS_TOKEN)) {
        yield { type: "crisis", under18: false };
        return;
      }
      continue;
    }
    if (!checkCoachText(all).ok) {
      yield { type: "redirect", text: COACH_REDIRECT };
      return;
    }
    const safeEnd = Math.max(all.lastIndexOf(" "), all.lastIndexOf("\n")) + 1;
    if (safeEnd > emitted) {
      yield { type: "text", text: all.slice(emitted, safeEnd) };
      emitted = safeEnd;
    }
  }
  if (all.includes(CRISIS_TOKEN)) {
    yield { type: "crisis", under18: false };
    return;
  }
  if (!checkCoachText(all).ok) {
    yield { type: "redirect", text: COACH_REDIRECT };
    return;
  }
  if (all.length > emitted) yield { type: "text", text: all.slice(emitted) };
}
