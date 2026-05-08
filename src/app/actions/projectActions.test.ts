import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockDispatchReadyTasks,
  mockMessageCreate,
  mockRevalidatePath,
  mockTaskFindUniqueOrThrow,
  mockTaskUpdate,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDispatchReadyTasks: vi.fn(),
  mockMessageCreate: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockTaskFindUniqueOrThrow: vi.fn(),
  mockTaskUpdate: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/dispatcher", () => ({ dispatchReadyTasks: mockDispatchReadyTasks }));
vi.mock("@/lib/orchestrator/projectOrchestrator", () => ({
  approveExecutionPlan: vi.fn(),
  approveProjectSpec: vi.fn(),
  createProjectWithSpec: vi.fn(),
}));
vi.mock("@/lib/orchestrator/integrator", () => ({ compileDoneOutputsMarkdown: vi.fn() }));
vi.mock("@/lib/validation/finalValidator", () => ({ validateFinalProject: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    message: { create: mockMessageCreate },
    project: { update: vi.fn() },
    task: { findUniqueOrThrow: mockTaskFindUniqueOrThrow, update: mockTaskUpdate },
  },
}));

import { respondHumanCheckpointAction } from "@/app/actions/projectActions";

const VALID_SESSION = { user: { id: "user-1", email: "u@test.com", organizationId: null } };

describe("respondHumanCheckpointAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(VALID_SESSION);
  });

  it("enregistre la réponse HITL, repasse la task en PENDING et redispatche le projet", async () => {
    mockTaskFindUniqueOrThrow.mockResolvedValueOnce({
      agentInstanceId: "agent-1",
      agentInstance: { projectId: "project-123456" },
    });
    mockMessageCreate.mockResolvedValueOnce({});
    mockTaskUpdate.mockResolvedValueOnce({});
    mockDispatchReadyTasks.mockResolvedValueOnce([]);

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("response", "Approuve.");

    await respondHumanCheckpointAction(formData);

    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: "Approuve.", metadata: { type: "HITL_RESPONSE" } }),
      })
    );
    expect(mockTaskUpdate).toHaveBeenCalledWith({ where: { id: "task-1" }, data: { status: "PENDING" } });
    expect(mockDispatchReadyTasks).toHaveBeenCalledWith("project-123456");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/projects/project-123456");
  });
});
