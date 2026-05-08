import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProjectStatus } from "@/hooks/useProjectStatus";

describe("fetchProjectStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("charge la route status avec cache no-store", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ project: { id: "project 1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchProjectStatus("project 1");

    expect(fetchMock).toHaveBeenCalledWith("/api/projects/project%201/status", { cache: "no-store" });
    expect(result).toEqual({ project: { id: "project 1" } });
  });

  it("remonte une erreur explicite si la route échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "Projet introuvable" }),
      })
    );

    await expect(fetchProjectStatus("project123")).rejects.toThrow("Projet introuvable");
  });
});
