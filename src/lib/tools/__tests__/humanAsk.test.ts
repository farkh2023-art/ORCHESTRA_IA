import { describe, expect, it, vi } from "vitest";

const { mockTaskUpdate, mockMessageCreate } = vi.hoisted(() => ({
  mockTaskUpdate: vi.fn(),
  mockMessageCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    task: { update: mockTaskUpdate },
    message: { create: mockMessageCreate },
  },
}));

import { executeTool } from "@/lib/tools/registry";

describe("humanAsk", () => {
  it("passe une Task en WAITING_HUMAN", async () => {
    mockTaskUpdate.mockResolvedValueOnce({});
    mockMessageCreate.mockResolvedValueOnce({});

    const result = await executeTool(
      "humanAsk",
      { question: "Valider ce livrable ?", priority: "HIGH" },
      {
        organizationId: "org-1",
        taskId: "task-1",
        agentInstanceId: "agent-1",
        userId: "user-1",
      }
    );

    expect(result.ok).toBe(true);
    expect(mockTaskUpdate).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "WAITING_HUMAN" },
    });
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "TOOL", content: "Valider ce livrable ?" }),
      })
    );
  });
});
