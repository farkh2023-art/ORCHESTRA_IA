import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRunAgentTask, mockUnlockDependents } = vi.hoisted(() => ({
  mockRunAgentTask: vi.fn(),
  mockUnlockDependents: vi.fn(),
}));

vi.mock("@/lib/agents/runtime", () => ({ runAgentTask: mockRunAgentTask }));
vi.mock("@/lib/dispatcher", () => ({ unlockDependents: mockUnlockDependents }));
vi.mock("@/lib/redis", () => ({ redis: {} }));

import type { Job } from "bullmq";
import type { AgentJob } from "@/lib/queue";
import { processAgentJob } from "./agent.worker";

const JOB = {
  data: { taskId: "task-1", projectId: "project-abc", organizationId: "org-123" },
} as Job<AgentJob>;

describe("processAgentJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnlockDependents.mockResolvedValue([]);
  });

  it("appelle runAgentTask avec taskId", async () => {
    mockRunAgentTask.mockResolvedValueOnce({ swot: {} });

    await processAgentJob(JOB);

    expect(mockRunAgentTask).toHaveBeenCalledOnce();
    expect(mockRunAgentTask).toHaveBeenCalledWith("task-1");
  });

  it("appelle unlockDependents avec taskId après succès", async () => {
    mockRunAgentTask.mockResolvedValueOnce({ swot: {} });

    await processAgentJob(JOB);

    expect(mockUnlockDependents).toHaveBeenCalledOnce();
    expect(mockUnlockDependents).toHaveBeenCalledWith("task-1");
  });

  it("n'appelle pas unlockDependents si runAgentTask échoue", async () => {
    mockRunAgentTask.mockRejectedValueOnce(new Error("agent fail"));

    await expect(processAgentJob(JOB)).rejects.toThrow("agent fail");

    expect(mockUnlockDependents).not.toHaveBeenCalled();
  });
});
