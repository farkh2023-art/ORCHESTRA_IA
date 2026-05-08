import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockEnsureUserOrganization,
  mockGetProjectStatus,
  mockIsSafeProjectId,
  mockProjectBelongsToOrganization,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockEnsureUserOrganization: vi.fn(),
  mockGetProjectStatus: vi.fn(),
  mockIsSafeProjectId: vi.fn(),
  mockProjectBelongsToOrganization: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/auth/tenant", () => ({ ensureUserOrganization: mockEnsureUserOrganization }));
vi.mock("@/lib/projects/status", () => ({
  getProjectStatus: mockGetProjectStatus,
  isSafeProjectId: mockIsSafeProjectId,
}));
vi.mock("@/lib/projects/ownership", () => ({
  projectBelongsToOrganization: mockProjectBelongsToOrganization,
}));

import { GET } from "@/app/api/projects/[id]/status/route";

const VALID_SESSION = { user: { id: "user-1", email: "u@test.com", organizationId: "org-1" } };
const SESSION_NO_ORG = { user: { id: "user-2", email: "v@test.com", organizationId: null } };
const SESSION_NO_EMAIL = { user: { id: "user-3", email: null, organizationId: null } };

describe("GET /api/projects/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(VALID_SESSION);
    mockIsSafeProjectId.mockReturnValue(true);
    mockProjectBelongsToOrganization.mockResolvedValue(true);
  });

  it("retourne 401 si non authentifié", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/projects/any/status"), {
      params: Promise.resolve({ id: "any" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Non authentifié" });
  });

  it("rejette un projectId invalide", async () => {
    mockIsSafeProjectId.mockReturnValueOnce(false);

    const response = await GET(new Request("http://localhost/api/projects/bad/status"), {
      params: Promise.resolve({ id: "bad" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "projectId invalide" });
  });

  it("retourne 403 si le projet n'appartient pas à l'organisation", async () => {
    mockProjectBelongsToOrganization.mockResolvedValueOnce(false);

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Accès refusé" });
  });

  // ── orgId null : provisionnement requis ──────────────────────────────────

  it("appelle ensureUserOrganization quand orgId null, puis vérifie ownership", async () => {
    mockAuth.mockResolvedValueOnce(SESSION_NO_ORG);
    mockEnsureUserOrganization.mockResolvedValueOnce("org-provisioned");
    mockGetProjectStatus.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(mockEnsureUserOrganization).toHaveBeenCalledWith("user-2", "v@test.com");
    expect(mockProjectBelongsToOrganization).toHaveBeenCalledWith("project123", "org-provisioned");
    expect(response.status).toBe(404); // ownership OK mais projet inexistant
  });

  it("retourne 403 si ensureUserOrganization lève une erreur", async () => {
    mockAuth.mockResolvedValueOnce(SESSION_NO_ORG);
    mockEnsureUserOrganization.mockRejectedValueOnce(new Error("DB indisponible"));

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Accès refusé" });
    expect(mockProjectBelongsToOrganization).not.toHaveBeenCalled();
  });

  it("retourne 403 si pas d'email et orgId null", async () => {
    mockAuth.mockResolvedValueOnce(SESSION_NO_EMAIL);

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(response.status).toBe(403);
    expect(mockEnsureUserOrganization).not.toHaveBeenCalled();
  });

  // ── cas nominaux ─────────────────────────────────────────────────────────

  it("retourne 404 si le projet est introuvable", async () => {
    mockGetProjectStatus.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Projet introuvable" });
  });

  it("retourne le payload status sans cache", async () => {
    mockGetProjectStatus.mockResolvedValueOnce({ project: { id: "project123" }, tasks: [] });

    const response = await GET(new Request("http://localhost/api/projects/project123/status"), {
      params: Promise.resolve({ id: "project123" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ project: { id: "project123" }, tasks: [] });
  });
});
