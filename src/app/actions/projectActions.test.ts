import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCreateProjectWithSpec,
  mockDispatchReadyTasks,
  mockEnsureUserOrganization,
  mockMessageCreate,
  mockProjectBelongsToOrganization,
  mockRevalidatePath,
  mockTaskFindUniqueOrThrow,
  mockTaskUpdate,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateProjectWithSpec: vi.fn(),
  mockDispatchReadyTasks: vi.fn(),
  mockEnsureUserOrganization: vi.fn(),
  mockMessageCreate: vi.fn(),
  mockProjectBelongsToOrganization: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockTaskFindUniqueOrThrow: vi.fn(),
  mockTaskUpdate: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/tenant", () => ({ ensureUserOrganization: mockEnsureUserOrganization }));
vi.mock("@/lib/dispatcher", () => ({ dispatchReadyTasks: mockDispatchReadyTasks }));
vi.mock("@/lib/orchestrator/projectOrchestrator", () => ({
  approveExecutionPlan: vi.fn(),
  approveProjectSpec: vi.fn(),
  createProjectWithSpec: mockCreateProjectWithSpec,
}));
vi.mock("@/lib/orchestrator/integrator", () => ({ compileDoneOutputsMarkdown: vi.fn() }));
vi.mock("@/lib/validation/finalValidator", () => ({ validateFinalProject: vi.fn() }));
vi.mock("@/lib/projects/ownership", () => ({
  projectBelongsToOrganization: mockProjectBelongsToOrganization,
}));
vi.mock("@/lib/db", () => ({
  db: {
    message: { create: mockMessageCreate },
    project: { update: vi.fn() },
    task: { findUniqueOrThrow: mockTaskFindUniqueOrThrow, update: mockTaskUpdate },
  },
}));

import { createProjectAction, launchProjectAction, respondHumanCheckpointAction } from "@/app/actions/projectActions";

const SESSION_WITH_ORG = { user: { id: "user-1", email: "u@test.com", organizationId: "org-1" } };
const SESSION_NO_ORG = { user: { id: "user-1", email: "u@test.com", organizationId: null } };

// ── createProjectAction ──────────────────────────────────────────────────────

describe("createProjectAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ne crée pas le projet si organizationId reste null après ensureUserOrganization", async () => {
    mockAuth.mockResolvedValue(SESSION_NO_ORG);
    mockEnsureUserOrganization.mockRejectedValueOnce(new Error("DB indisponible"));

    const formData = new FormData();
    formData.set("title", "Mon projet");
    formData.set("brief", "Brief suffisamment long pour valider le schéma Zod.");

    await createProjectAction(formData);

    expect(mockCreateProjectWithSpec).not.toHaveBeenCalled();
  });

  it("passe organizationId et createdById à createProjectWithSpec", async () => {
    mockAuth.mockResolvedValue(SESSION_WITH_ORG);
    mockCreateProjectWithSpec.mockResolvedValueOnce({ project: { id: "proj-new" } });

    const formData = new FormData();
    formData.set("title", "Mon projet");
    formData.set("brief", "Brief suffisamment long pour valider le schéma Zod.");

    await createProjectAction(formData);

    expect(mockCreateProjectWithSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        createdById: "user-1",
      })
    );
  });
});

// ── respondHumanCheckpointAction ─────────────────────────────────────────────

describe("respondHumanCheckpointAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(SESSION_WITH_ORG);
    mockProjectBelongsToOrganization.mockResolvedValue(true);
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

  it("ne fait rien si le projet n'appartient pas à l'organisation", async () => {
    mockProjectBelongsToOrganization.mockResolvedValueOnce(false);
    mockTaskFindUniqueOrThrow.mockResolvedValueOnce({
      agentInstanceId: "agent-1",
      agentInstance: { projectId: "project-other-org" },
    });

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("response", "Approuve.");

    await respondHumanCheckpointAction(formData);

    expect(mockMessageCreate).not.toHaveBeenCalled();
    expect(mockTaskUpdate).not.toHaveBeenCalled();
    expect(mockDispatchReadyTasks).not.toHaveBeenCalled();
  });
});

// ── launchProjectAction ──────────────────────────────────────────────────────

describe("launchProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(SESSION_WITH_ORG);
  });

  it("ne lance pas le projet si l'ownership échoue", async () => {
    mockProjectBelongsToOrganization.mockResolvedValueOnce(false);

    const formData = new FormData();
    formData.set("projectId", "project-other");

    await launchProjectAction(formData);

    expect(mockDispatchReadyTasks).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("lance le projet si l'ownership est valide", async () => {
    mockProjectBelongsToOrganization.mockResolvedValueOnce(true);
    mockDispatchReadyTasks.mockResolvedValueOnce([]);

    const formData = new FormData();
    formData.set("projectId", "project-mine");

    await launchProjectAction(formData);

    expect(mockDispatchReadyTasks).toHaveBeenCalledWith("project-mine");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/projects/project-mine");
  });
});
