import { describe, expect, it, vi } from "vitest";

const { mockGetProjectStatus, mockIsSafeProjectId } = vi.hoisted(() => ({
  mockGetProjectStatus: vi.fn(),
  mockIsSafeProjectId: vi.fn(),
}));

vi.mock("@/lib/projects/status", () => ({
  getProjectStatus: mockGetProjectStatus,
  isSafeProjectId: mockIsSafeProjectId,
}));

import { GET } from "@/app/api/projects/[id]/status/route";

describe("GET /api/projects/[id]/status", () => {
  it("rejette un projectId invalide", async () => {
    mockIsSafeProjectId.mockReturnValueOnce(false);

    const response = await GET(new Request("http://localhost/api/projects/bad/status"), {
      params: Promise.resolve({ id: "bad" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "projectId invalide" });
  });

  it("retourne 404 si le projet est introuvable", async () => {
    mockIsSafeProjectId.mockReturnValueOnce(true);
    mockGetProjectStatus.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Projet introuvable" });
  });

  it("retourne le payload status sans cache", async () => {
    mockIsSafeProjectId.mockReturnValueOnce(true);
    mockGetProjectStatus.mockResolvedValueOnce({ project: { id: "project123" }, tasks: [] });

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ project: { id: "project123" }, tasks: [] });
  });
});
