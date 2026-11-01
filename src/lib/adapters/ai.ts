import "server-only";
import { createAI, type AIAdapter } from "@/lib/ai/engine";

export type { AIAdapter };

let cached: AIAdapter | null = null;

/** Real Claude adapter when ANTHROPIC_API_KEY is set, otherwise the scripted mock. */
export function aiAdapter(): AIAdapter {
  cached ??= createAI({ apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL });
  return cached;
}
