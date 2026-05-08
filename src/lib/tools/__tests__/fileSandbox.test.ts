import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeTool } from "@/lib/tools/registry";

const sandbox = path.join(process.cwd(), ".tmp-tool-tests");

describe("file sandbox tools", () => {
  beforeEach(async () => {
    vi.stubEnv("TOOL_SANDBOX_DIR", sandbox);
    await rm(sandbox, { recursive: true, force: true });
    await mkdir(sandbox, { recursive: true });
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(sandbox, { recursive: true, force: true });
  });

  it("fileRead bloque path traversal", async () => {
    const result = await executeTool("fileRead", { path: "../secret.txt" }, { organizationId: "org-1" });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("sandbox");
  });

  it("fileWrite bloque path traversal", async () => {
    const result = await executeTool(
      "fileWrite",
      { path: "../secret.txt", content: "secret" },
      { organizationId: "org-1" }
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("sandbox");
  });

  it("fileRead lit un fichier autorise dans sandbox", async () => {
    await writeFile(path.join(sandbox, "notes.txt"), "hello", "utf8");

    const result = await executeTool("fileRead", { path: "notes.txt" }, { organizationId: "org-1" });

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ path: "notes.txt", content: "hello" });
  });

  it("fileWrite ecrit un fichier autorise dans sandbox", async () => {
    const result = await executeTool(
      "fileWrite",
      { path: "nested/out.txt", content: "hello" },
      { organizationId: "org-1" }
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ path: path.join("nested", "out.txt") });
    await expect(readFile(path.join(sandbox, "nested", "out.txt"), "utf8")).resolves.toBe("hello");
  });
});
