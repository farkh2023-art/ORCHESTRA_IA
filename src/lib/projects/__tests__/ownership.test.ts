import { describe, expect, it, vi } from "vitest";

const { mockProjectFindUnique } = vi.hoisted(() => ({
  mockProjectFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: mockProjectFindUnique,
    },
  },
}));

import { projectBelongsToOrganization } from "@/lib/projects/ownership";

describe("projectBelongsToOrganization", () => {
  it("retourne true si l'organizationId correspond", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({ organizationId: "org-1" });

    const result = await projectBelongsToOrganization("project-1", "org-1");

    expect(result).toBe(true);
    expect(mockProjectFindUnique).toHaveBeenCalledWith({
      where: { id: "project-1" },
      select: { organizationId: true },
    });
  });

  it("retourne false si l'organizationId ne correspond pas", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({ organizationId: "org-2" });

    const result = await projectBelongsToOrganization("project-1", "org-1");

    expect(result).toBe(false);
  });

  it("retourne false si le projet n'existe pas", async () => {
    mockProjectFindUnique.mockResolvedValueOnce(null);

    const result = await projectBelongsToOrganization("project-1", "org-1");

    expect(result).toBe(false);
  });

  it("retourne false si organizationId est null sur le projet", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({ organizationId: null });

    const result = await projectBelongsToOrganization("project-1", "org-1");

    expect(result).toBe(false);
  });

  it("retourne false en cas d'erreur DB sans propager l'exception", async () => {
    mockProjectFindUnique.mockRejectedValueOnce(new Error("connexion refusée"));

    const result = await projectBelongsToOrganization("project-1", "org-1");

    expect(result).toBe(false);
  });
});
