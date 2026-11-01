// Morning line generation: model → schema → filters → one retry → curated fallback.
// The client is injected so the route and the eval suite share exactly this logic.
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { pickFallbackLine } from "./fallback";
import { checkMorningLine } from "./filters";
import { MORNING_LINE_SYSTEM, morningUserMessage, type MorningContext } from "./prompts";

const LineSchema = z.object({ text: z.string().min(1).max(400) });

export interface MorningResult {
  text: string;
  source: "model" | "fallback";
  /** Why the model output wasn't used (no text from the line itself). */
  rejected?: string;
  usage?: { input: number; output: number };
}

export async function generateMorningLine(
  client: Anthropic,
  model: string,
  ctx: MorningContext,
  seed: string,
  deadlineMs = 8000,
): Promise<MorningResult> {
  const fallback = (rejected: string): MorningResult => ({
    text: pickFallbackLine({ tone: ctx.tone, day: ctx.day, seed }),
    source: "fallback",
    rejected,
  });
  const deadline = Date.now() + deadlineMs;
  let note = "";
  const usage = { input: 0, output: 0 };

  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 500) return fallback("timeout");
    try {
      const response = await client.messages.parse(
        {
          model,
          max_tokens: 400,
          // Short, tool-free output where latency matters: no thinking, low effort.
          thinking: { type: "disabled" },
          output_config: { effort: "low", format: zodOutputFormat(LineSchema) },
          system: MORNING_LINE_SYSTEM,
          messages: [{ role: "user", content: morningUserMessage(ctx) + note }],
        },
        { timeout: remaining, maxRetries: 0 },
      );
      usage.input += response.usage.input_tokens;
      usage.output += response.usage.output_tokens;
      if (response.stop_reason === "refusal") return fallback("refusal");
      const text = response.parsed_output?.text?.trim();
      if (!text) {
        note = "\n\nYour last draft broke a rule: return only the JSON object.";
        continue;
      }
      const check = checkMorningLine(text);
      if (check.ok) return { text, source: "model", usage };
      note = `\n\nYour last draft broke a rule: ${check.rule}. Write a new line that follows every rule.`;
    } catch (e) {
      const name = e instanceof Error ? e.name : "error";
      return { ...fallback(name), usage };
    }
  }
  return { ...fallback("filters"), usage };
}
