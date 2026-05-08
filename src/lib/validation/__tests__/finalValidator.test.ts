import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProjectFindUnique, mockProjectUpdate, mockValidationCreate } = vi.hoisted(() => ({
  mockProjectFindUnique: vi.fn(),
  mockProjectUpdate: vi.fn(),
  mockValidationCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: { findUnique: mockProjectFindUnique, update: mockProjectUpdate },
    validationReport: { create: mockValidationCreate },
  },
}));

import { validateFinalProject } from "@/lib/validation/finalValidator";

describe("finalValidator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuse un projet avec Tasks non DONE", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "project-1",
      finalOutput: { markdown: "# Rapport" },
      agentInstances: [{ tasks: [{ id: "task-1", status: "RUNNING" }] }],
    });
    mockValidationCreate.mockResolvedValueOnce({ id: "report-1" });
    mockProjectUpdate.mockResolvedValueOnce({});

    const result = await validateFinalProject("project-1");

    expect(result.ok).toBe(false);
    expect(result.status).toBe("NEEDS_FIX");
    expect(mockProjectUpdate).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: { status: "WAITING_HUMAN" },
    });
  });

  it("accepte un projet complet avec finalOutput", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "project-1",
      finalOutput: { markdown: "# Rapport" },
      agentInstances: [{ tasks: [{ id: "task-1", status: "DONE" }] }],
    });
    mockValidationCreate.mockResolvedValueOnce({ id: "report-2" });

    const result = await validateFinalProject("project-1");

    expect(result.ok).toBe(true);
    expect(result.status).toBe("APPROVED");
    expect(mockValidationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ scope: "FINAL", status: "APPROVED", approved: true }),
      })
    );
    expect(mockProjectUpdate).not.toHaveBeenCalled();
  });
});
