import { z } from "zod";
import type { ToolHandler } from "@/lib/tools/types";

export const webSearchInputSchema = z.object({
  query: z.string().min(2).max(500),
  limit: z.number().int().min(1).max(10).default(5),
});

export const webSearchTool: ToolHandler<z.infer<typeof webSearchInputSchema>> = {
  name: "webSearch",
  description: "Recherche web via provider configure.",
  inputSchema: webSearchInputSchema,
  async execute(input) {
    if (!process.env.WEB_SEARCH_PROVIDER) {
      return {
        ok: false,
        error: "Aucun provider web n'est configure pour webSearch.",
        metadata: { queryLength: input.query.length, limit: input.limit },
      };
    }

    return {
      ok: false,
      error: "Le provider webSearch n'est pas encore implemente.",
      metadata: { provider: process.env.WEB_SEARCH_PROVIDER },
    };
  },
};
