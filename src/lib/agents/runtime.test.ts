import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindUniqueOrThrow, mockRunAgentCore } = vi.hoisted(() => ({
  mockFindUniqueOrThrow: vi.fn(),
  mockRunAgentCore: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { task: { findUniqueOrThrow: mockFindUniqueOrThrow } },
}));

vi.mock("@/agents/base", () => ({
  runAgentTask: mockRunAgentCore,
}));

import { runAgentTask } from "./runtime";

describe("runAgentTask (runtime)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("choisit le schema selon AgentInstance.role", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({
      agentSlug: "CRITIC",
      agentInstance: { role: "ANALYST", agentTemplate: { role: "WRITER", slug: "WRITER" } },
    });
    mockRunAgentCore.mockResolvedValueOnce({ swot: {} });

    await runAgentTask("task-1");

    expect(mockRunAgentCore).toHaveBeenCalledOnce();
    expect(mockRunAgentCore).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: "task-1", schema: expect.anything() })
    );
  });

  it("utilise AgentTemplate.role si AgentInstance.role est absent", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({
      agentSlug: "CRITIC",
      agentInstance: { role: null, agentTemplate: { role: "WRITER", slug: "ANALYST" } },
    });
    mockRunAgentCore.mockResolvedValueOnce({ title: "Draft" });

    await runAgentTask("task-2");

    expect(mockRunAgentCore).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: "task-2", schema: expect.anything() })
    );
  });

  it("n'utilise pas AgentTemplate.slug pour router", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({
      agentSlug: "CRITIC",
      agentInstance: { role: null, agentTemplate: { role: null, slug: "WRITER" } },
    });

    await expect(runAgentTask("task-legacy")).rejects.toThrow("Role AgentInstance manquant");

    expect(mockRunAgentCore).not.toHaveBeenCalled();
  });

  it("throw si aucun role AgentInstance ou template n'est disponible", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({
      agentSlug: "ANALYST",
      agentInstance: { role: null, agentTemplate: null },
    });

    await expect(runAgentTask("task-x")).rejects.toThrow("Role AgentInstance manquant");

    expect(mockRunAgentCore).not.toHaveBeenCalled();
  });
});
