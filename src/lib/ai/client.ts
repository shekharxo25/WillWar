import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { requireServerEnv, serverEnv } from "@/env.server";

let client: Anthropic | null = null;

/** Server-only Claude client. Fails closed (MissingConfigError) without ANTHROPIC_API_KEY. */
export function getClaude(): { client: Anthropic; model: string } {
  client ??= new Anthropic({ apiKey: requireServerEnv("ANTHROPIC_API_KEY"), timeout: 8000, maxRetries: 0 });
  return { client, model: serverEnv().ANTHROPIC_MODEL };
}

export function claudeConfigured(): boolean {
  return Boolean(serverEnv().ANTHROPIC_API_KEY);
}

/** Aggregate token usage only: never prompt or completion text (privacy-security.md "Logging"). */
export function logUsage(feature: "morning_line" | "coach", usage: { input: number; output: number }, source?: string) {
  console.log(JSON.stringify({ event: "ai_usage", feature, input: usage.input, output: usage.output, source }));
}
