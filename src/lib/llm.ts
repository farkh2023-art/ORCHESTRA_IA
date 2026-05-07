import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;

// Coûts par million de tokens (USD) pour les modèles Claude utilisés
const MODEL_RATES: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6":         { in: 3 / 1_000_000, out: 15 / 1_000_000 },
  "claude-opus-4-7":           { in: 15 / 1_000_000, out: 75 / 1_000_000 },
  "claude-haiku-4-5":          { in: 0.8 / 1_000_000, out: 4.0 / 1_000_000 },
  "claude-haiku-4-5-20251001": { in: 0.8 / 1_000_000, out: 4.0 / 1_000_000 },
};

export function estimateCostUsd(
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  const rate = MODEL_RATES[model] ?? MODEL_RATES["claude-sonnet-4-6"];
  return tokensIn * rate.in + tokensOut * rate.out;
}
