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

  it("route ANALYST vers runAgentCore avec son schema", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({ agentSlug: "ANALYST" });
    mockRunAgentCore.mockResolvedValueOnce({ swot: {} });

    await runAgentTask("task-1");

    expect(mockRunAgentCore).toHaveBeenCalledOnce();
    expect(mockRunAgentCore).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: "task-1", schema: expect.anything() })
    );
  });

  it("throw si agentSlug non enregistré", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({ agentSlug: "UNKNOWN_AGENT" });

    await expect(runAgentTask("task-x")).rejects.toThrow("Agent non enregistré");

    expect(mockRunAgentCore).not.toHaveBeenCalled();
  });
});
