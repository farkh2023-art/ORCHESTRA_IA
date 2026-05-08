import { z } from "zod";
import { db } from "@/lib/db";
import type { ToolHandler } from "@/lib/tools/types";

export const vectorSearchInputSchema = z.object({
  query: z.string().min(1).max(1_000),
  projectId: z.string().optional(),
  limit: z.number().int().min(1).max(20).default(5),
});

function scoreChunk(query: string, content: string, title: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${title} ${content}`.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

export const vectorSearchTool: ToolHandler<z.infer<typeof vectorSearchInputSchema>> = {
  name: "vectorSearch",
  description: "Recherche KnowledgeChunk avec fallback texte.",
  inputSchema: vectorSearchInputSchema,
  async execute(input, context) {
    const chunks = await db.knowledgeChunk.findMany({
      where: {
        organizationId: context.organizationId,
        projectId: input.projectId ?? context.projectId,
      },
      take: Math.max(input.limit * 4, input.limit),
      orderBy: { createdAt: "desc" },
    });

    const ranked = chunks
      .map((chunk) => ({
        chunk,
        score: scoreChunk(input.query, chunk.content, chunk.title),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit)
      .map(({ chunk, score }) => ({
        id: chunk.id,
        title: chunk.title,
        content: chunk.content,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        score,
      }));

    return {
      ok: true,
      data: ranked,
      metadata: { mode: "text-fallback", count: ranked.length },
    };
  },
};
