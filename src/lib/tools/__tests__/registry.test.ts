import { describe, expect, it } from "vitest";
import { executeTool, listTools } from "@/lib/tools/registry";

const context = { organizationId: "org-1" };

describe("tool registry", () => {
  it("liste les outils disponibles", () => {
    expect(listTools().map((tool) => tool.name).sort()).toEqual([
      "codeExec",
      "fileRead",
      "fileWrite",
      "humanAsk",
      "vectorSearch",
      "webFetch",
      "webSearch",
    ]);
  });

  it("executeTool rejette un outil inconnu", async () => {
    await expect(executeTool("unknown", {}, context)).resolves.toMatchObject({
      ok: false,
      error: "Outil inconnu : unknown.",
    });
  });

  it("executeTool valide les inputs", async () => {
    const result = await executeTool("webSearch", { query: "" }, context);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Input d'outil invalide.");
  });
});
