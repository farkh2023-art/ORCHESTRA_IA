import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProjectFindUnique, mockTraceAggregate, mockValidationFindMany } = vi.hoisted(() => ({
  mockProjectFindUnique: vi.fn(),
  mockTraceAggregate: vi.fn(),
  mockValidationFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: { findUnique: mockProjectFindUnique },
    trace: { aggregate: mockTraceAggregate },
    validationReport: { findMany: mockValidationFindMany },
  },
}));

import { getProjectStatus, isSafeProjectId } from "@/lib/projects/status";

const now = new Date("2026-05-08T10:00:00.000Z");

describe("project status aggregation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejette les projectId non valides", async () => {
    expect(isSafeProjectId("../secret")).toBe(false);
    expect(await getProjectStatus("../secret")).toBeNull();
    expect(mockProjectFindUnique).not.toHaveBeenCalled();
  });

  it("retourne un état projet filtré avec coûts, tokens et tâches HITL", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "project_123456",
      title: "Projet test",
      brief: "Brief",
      status: "RUNNING",
      finalOutput: null,
      createdAt: now,
      updatedAt: now,
      specs: [{ id: "spec-1", version: 1, content: { goal: "ok" }, createdAt: now }],
      agentInstances: [
        {
          role: "ANALYST",
          messages: [{ id: "msg-1", role: "ASSISTANT", content: "Statut", taskId: "task-1", createdAt: now }],
          tasks: [
            {
              id: "task-1",
              status: "WAITING_HUMAN",
              dependsOn: [],
              input: { brief: "x" },
              output: null,
              error: null,
              tokensUsed: 12,
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
      ],
    });
    mockTraceAggregate.mockResolvedValueOnce({ _sum: { costUsd: 1.25, tokensIn: 10, tokensOut: 15 } });
    mockValidationFindMany.mockResolvedValueOnce([
      {
        id: "report-1",
        taskId: "task-1",
        agentInstanceId: "agent-1",
        scope: "TASK",
        status: "APPROVED",
        overallScore: 90,
        alignmentScore: 88,
        approved: true,
        createdAt: now,
      },
    ]);

    const status = await getProjectStatus("project_123456");

    expect(status?.traces).toEqual({ costUsd: 1.25, tokensIn: 10, tokensOut: 15, totalTokens: 25 });
    expect(status?.waitingHumanTasks).toHaveLength(1);
    expect(status?.validationReports[0].status).toBe("APPROVED");
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain("ANTHROPIC_API_KEY");
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("systemPrompt");
  });
});
