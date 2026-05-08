import { isIP } from "node:net";
import { z } from "zod";
import type { ToolHandler } from "@/lib/tools/types";

const MAX_BYTES = 200_000;

export const webFetchInputSchema = z.object({
  url: z.string().url(),
  timeoutMs: z.number().int().min(500).max(10_000).default(5_000),
  maxBytes: z.number().int().min(1_000).max(MAX_BYTES).default(50_000),
});

function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (lower === "::1" || lower === "[::1]") return true;

  const ipVersion = isIP(lower);
  if (ipVersion === 0) return false;
  if (lower.startsWith("127.") || lower.startsWith("10.") || lower.startsWith("192.168.")) return true;
  if (lower.startsWith("169.254.")) return true;
  const parts = lower.split(".").map((part) => Number(part));
  return parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export const webFetchTool: ToolHandler<z.infer<typeof webFetchInputSchema>> = {
  name: "webFetch",
  description: "Recupere une page HTTP/HTTPS avec garde-fous SSRF.",
  inputSchema: webFetchInputSchema,
  async execute(input) {
    const url = new URL(input.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "URL refusee : seuls http et https sont autorises." };
    }
    if (isPrivateHostname(url.hostname)) {
      return { ok: false, error: "URL refusee : hote local ou adresse privee interdite." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        return { ok: false, error: `webFetch a echoue avec le statut HTTP ${response.status}.` };
      }
      const text = await response.text();
      const sliced = text.slice(0, input.maxBytes);
      return {
        ok: true,
        data: { url: url.toString(), text: cleanText(sliced), truncated: text.length > input.maxBytes },
        metadata: { status: response.status },
      };
    } catch {
      return { ok: false, error: "webFetch a echoue ou a expire." };
    } finally {
      clearTimeout(timeout);
    }
  },
};
