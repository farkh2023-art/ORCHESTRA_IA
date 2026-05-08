import { afterEach, describe, expect, it, vi } from "vitest";
import { executeTool } from "@/lib/tools/registry";

describe("codeExec", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("retourne une erreur si ENABLE_CODE_EXEC est false", async () => {
    vi.stubEnv("ENABLE_CODE_EXEC", "false");

    const result = await executeTool(
      "codeExec",
      { language: "javascript", code: "1 + 1" },
      { organizationId: "org-1" }
    );

    expect(result).toMatchObject({ ok: false });
    expect(result.error).toContain("codeExec est desactive");
  });
});
