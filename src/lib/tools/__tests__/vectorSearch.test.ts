import { describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { knowledgeChunk: { findMany: mockFindMany } },
}));

import { executeTool } from "@/lib/tools/registry";

describe("vectorSearch", () => {
  it("fallback texte retourne des KnowledgeChunk", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "chunk-1",
        title: "Architecture IA",
        content: "Le projet utilise une orchestration multi agents.",
        sourceType: "MANUAL",
        sourceId: "manual-1",
        createdAt: new Date(),
      },
      {
        id: "chunk-2",
        title: "Autre",
        content: "Sans rapport.",
        sourceType: "MANUAL",
        sourceId: "manual-2",
        createdAt: new Date(),
      },
    ]);

    const result = await executeTool(
      "vectorSearch",
      { query: "orchestration agents", limit: 5 },
      { organizationId: "org-1", projectId: "project-1" }
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject([{ id: "chunk-1", score: 2 }]);
    expect(result.metadata).toMatchObject({ mode: "text-fallback" });
  });
});
