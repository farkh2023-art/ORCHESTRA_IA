import { describe, expect, it, vi } from "vitest";

const { mockTaskFindUnique, mockValidationCreate } = vi.hoisted(() => ({
  mockTaskFindUnique: vi.fn(),
  mockValidationCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    task: { findUnique: mockTaskFindUnique },
    validationReport: { create: mockValidationCreate },
  },
}));

import { validateTaskOutput } from "@/lib/validation/agentValidator";

function taskFixture(output: unknown) {
  return {
    id: "task-1",
    agentInstanceId: "agent-1",
    status: "DONE",
    output,
    agentInstance: {
      project: {
        specs: [{ id: "spec-1", version: 1, content: { deliverables: ["Rapport"] } }],
      },
    },
  };
}

describe("agentValidator", () => {
  it("cree un ValidationReport pour une Task DONE", async () => {
    mockTaskFindUnique.mockResolvedValueOnce(taskFixture({ summary: "ok" }));
    mockValidationCreate.mockResolvedValueOnce({ id: "report-1" });

    const result = await validateTaskOutput("task-1");

    expect(result.ok).toBe(true);
    expect(result.status).toBe("APPROVED");
    expect(mockValidationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: "task-1",
          scope: "TASK",
          status: "APPROVED",
          approved: true,
        }),
      })
    );
  });

  it("rejette une Task sans outputs", async () => {
    mockTaskFindUnique.mockResolvedValueOnce(taskFixture(null));
    mockValidationCreate.mockResolvedValueOnce({ id: "report-2" });

    const result = await validateTaskOutput("task-1");

    expect(result.ok).toBe(false);
    expect(result.status).toBe("NEEDS_FIX");
    expect(mockValidationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approved: false }),
      })
    );
  });
});
