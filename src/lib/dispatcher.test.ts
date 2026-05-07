import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTaskFindMany, mockTaskCount, mockTaskUpdate, mockQueueAdd } = vi.hoisted(() => ({
  mockTaskFindMany: vi.fn(),
  mockTaskCount: vi.fn(),
  mockTaskUpdate: vi.fn(),
  mockQueueAdd: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      findMany: mockTaskFindMany,
      count: mockTaskCount,
      update: mockTaskUpdate,
    },
  },
}));

vi.mock("@/lib/queue", () => ({
  agentQueue: { add: mockQueueAdd },
}));

import { dispatchReady, unlockDependents } from "@/lib/dispatcher";

const INSTANCE = { projectId: "project-abc", project: { organizationId: "org-123" } };

describe("dispatchReady", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueAdd.mockResolvedValue({});
    mockTaskUpdate.mockResolvedValue({});
    mockTaskCount.mockResolvedValue(0);
  });

  it("enqueue les tâches sans dépendance et passe à QUEUED", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      { id: "task-1", agentSlug: "ANALYST", dependsOn: [], agentInstance: INSTANCE },
    ]);

    const dispatched = await dispatchReady("project-abc");

    expect(dispatched).toEqual(["task-1"]);
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "QUEUED" } })
    );
    expect(mockQueueAdd).toHaveBeenCalledWith("agent-task", {
      taskId: "task-1",
      projectId: "project-abc",
      organizationId: "org-123",
    });
  });

  it("n'enqueue pas si une dépendance n'est pas DONE", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      { id: "task-2", agentSlug: "RESEARCHER", dependsOn: ["task-1"], agentInstance: INSTANCE },
    ]);
    mockTaskCount.mockResolvedValueOnce(1);

    const dispatched = await dispatchReady("project-abc");

    expect(dispatched).toEqual([]);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it("enqueue quand toutes les dépendances sont DONE", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      { id: "task-2", agentSlug: "RESEARCHER", dependsOn: ["task-1"], agentInstance: INSTANCE },
    ]);
    mockTaskCount.mockResolvedValueOnce(0);

    const dispatched = await dispatchReady("project-abc");

    expect(dispatched).toEqual(["task-2"]);
    expect(mockQueueAdd).toHaveBeenCalledWith("agent-task", {
      taskId: "task-2",
      projectId: "project-abc",
      organizationId: "org-123",
    });
  });

  it("dispatche uniquement les tâches prêtes dans un workflow mixte", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      { id: "task-1", agentSlug: "ANALYST", dependsOn: [], agentInstance: INSTANCE },
      { id: "task-2", agentSlug: "RESEARCHER", dependsOn: ["task-1"], agentInstance: INSTANCE },
    ]);
    mockTaskCount.mockResolvedValueOnce(1);

    const dispatched = await dispatchReady("project-abc");

    expect(dispatched).toEqual(["task-1"]);
    expect(mockQueueAdd).toHaveBeenCalledTimes(1);
  });
});

describe("unlockDependents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueAdd.mockResolvedValue({});
    mockTaskUpdate.mockResolvedValue({});
    mockTaskCount.mockResolvedValue(0);
  });

  it("enqueue les dépendants dont toutes les deps sont DONE", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      { id: "task-2", agentSlug: "RESEARCHER", dependsOn: ["task-1"], agentInstance: INSTANCE },
    ]);
    mockTaskCount.mockResolvedValueOnce(0);

    const dispatched = await unlockDependents("task-1");

    expect(dispatched).toEqual(["task-2"]);
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "QUEUED" } })
    );
    expect(mockQueueAdd).toHaveBeenCalledWith("agent-task", {
      taskId: "task-2",
      projectId: "project-abc",
      organizationId: "org-123",
    });
  });

  it("n'enqueue pas si d'autres dépendances restent en attente", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      { id: "task-3", agentSlug: "WRITER", dependsOn: ["task-1", "task-2"], agentInstance: INSTANCE },
    ]);
    mockTaskCount.mockResolvedValueOnce(1);

    const dispatched = await unlockDependents("task-1");

    expect(dispatched).toEqual([]);
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it("retourne [] si aucun dépendant", async () => {
    mockTaskFindMany.mockResolvedValueOnce([]);

    const dispatched = await unlockDependents("task-lone");

    expect(dispatched).toEqual([]);
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });
});
