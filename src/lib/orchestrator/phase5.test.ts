import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentRole } from "@prisma/client";

const {
  mockAgentTemplateFindMany,
  mockAgentInstanceFindMany,
  mockAgentInstanceCreateMany,
  mockTaskFindMany,
  mockTaskCreate,
  mockTaskCount,
  mockTaskUpdate,
  mockProjectCreate,
  mockProjectSpecCreate,
  mockQueueAdd,
} = vi.hoisted(() => ({
  mockAgentTemplateFindMany: vi.fn(),
  mockAgentInstanceFindMany: vi.fn(),
  mockAgentInstanceCreateMany: vi.fn(),
  mockTaskFindMany: vi.fn(),
  mockTaskCreate: vi.fn(),
  mockTaskCount: vi.fn(),
  mockTaskUpdate: vi.fn(),
  mockProjectCreate: vi.fn(),
  mockProjectSpecCreate: vi.fn(),
  mockQueueAdd: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    agentTemplate: { findMany: mockAgentTemplateFindMany },
    agentInstance: {
      findMany: mockAgentInstanceFindMany,
      createMany: mockAgentInstanceCreateMany,
    },
    task: {
      findMany: mockTaskFindMany,
      create: mockTaskCreate,
      count: mockTaskCount,
      update: mockTaskUpdate,
    },
    project: { create: mockProjectCreate },
    projectSpec: { create: mockProjectSpecCreate },
  },
}));

vi.mock("@/lib/queue", () => ({
  agentQueue: { add: mockQueueAdd },
}));

import {
  AgentOutputSchemas,
  type CoreAgentRole,
} from "@/types/agents";
import { dispatchReadyTasks } from "@/lib/dispatcher";
import { compileDoneOutputsMarkdown } from "@/lib/orchestrator/integrator";
import { createMinimalDag } from "@/lib/orchestrator/planner";
import { CORE_AGENT_ROLES, recruitCoreAgents } from "@/lib/orchestrator/recruiter";
import {
  approveExecutionPlan,
  approveProjectSpec,
  createProjectWithSpec,
} from "@/lib/orchestrator/projectOrchestrator";

const ROLES = [...CORE_AGENT_ROLES];

function template(role: AgentRole, pipelineOrder: number) {
  return {
    id: `tpl-${role}`,
    slug: role,
    role,
    name: role,
    description: `${role} template`,
    model: "claude-sonnet-4-6",
    systemPrompt: `System ${role}`,
    pipelineOrder,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function instance(role: AgentRole) {
  return {
    id: `inst-${role}`,
    projectId: "project-1",
    role,
    status: "PENDING",
    metadata: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const VALID_OUTPUTS: Record<CoreAgentRole, unknown> = {
  COORDINATOR: {
    objectives: ["Objectif"],
    constraints: [],
    deliverables: ["Rapport"],
    executionPlan: [{ step: 1, agent: "ANALYST", task: "Analyser" }],
    complexity: "LOW",
    gaps: [],
  },
  ANALYST: {
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    risks: [],
    opportunities: [],
    kpis: [],
    assumptions: [],
    gaps: [],
    researchPriorities: [],
  },
  ARCHITECT: {
    components: [],
    interactions: [],
    technicalChoices: [],
    architecturalRisks: [],
    implementationPhases: [],
    assumptions: [],
  },
  RESEARCHER: {
    findings: [],
    sources: [],
    synthesis: "Synthese",
    dataGaps: [],
    recommendations: [],
  },
  WRITER: {
    title: "Rapport",
    sections: [{ heading: "Intro", content: "Contenu" }],
    summary: "Resume",
    wordCount: 10,
  },
  CRITIC: {
    overallScore: 8,
    alignmentScore: 90,
    issues: [],
    strengths: [],
    recommendations: [],
    approved: true,
  },
  INTEGRATOR: {
    deliveryPackage: {
      mainReport: "# Rapport",
      annexes: [],
      metadata: {
        instanceId: "project-1",
        duration: "1m",
        agentsInvolved: ["ANALYST"],
        totalTokens: 0,
        estimatedCostUsd: 0,
      },
    },
    integrationLog: [],
    conflicts: [],
    coverageCheck: { total: 1, covered: 1, missing: [] },
  },
};

describe("Phase 5 orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAgentInstanceCreateMany.mockResolvedValue({ count: 7 });
    mockTaskUpdate.mockResolvedValue({});
    mockQueueAdd.mockResolvedValue({});
  });

  it("recruiter cree les 7 AgentInstance sans doublons", async () => {
    mockAgentTemplateFindMany.mockResolvedValueOnce(
      ROLES.map((role, index) => template(role, index + 1))
    );
    mockAgentInstanceFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(ROLES.map(instance));

    const recruited = await recruitCoreAgents("project-1");

    expect(mockAgentInstanceCreateMany).toHaveBeenCalledWith({
      data: ROLES.map((role) => ({
        projectId: "project-1",
        role,
        status: "PENDING",
      })),
    });
    expect(recruited).toHaveLength(7);
  });

  it("planner cree le DAG minimal avec Task.dependsOn[]", async () => {
    mockTaskFindMany.mockResolvedValueOnce([]);
    mockAgentInstanceFindMany.mockResolvedValueOnce(ROLES.map(instance));
    mockTaskCreate.mockImplementation(async ({ data }) => ({
      id: `task-${data.agentSlug}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const tasks = await createMinimalDag("project-1");

    expect(tasks).toHaveLength(7);
    expect(mockTaskCreate).toHaveBeenCalledTimes(7);
    expect(mockTaskCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: expect.objectContaining({ dependsOn: [] }) })
    );
    expect(mockTaskCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: expect.objectContaining({ dependsOn: ["task-COORDINATOR"] }) })
    );
  });

  it("integrator compile les outputs DONE en Markdown", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      {
        id: "task-1",
        output: { summary: "Analyse" },
        agentInstance: { role: "ANALYST" },
      },
      {
        id: "task-2",
        output: "# Rapport",
        agentInstance: { role: "WRITER" },
      },
    ]);

    const markdown = await compileDoneOutputsMarkdown("project-1");

    expect(markdown).toContain("## ANALYST");
    expect(markdown).toContain('"summary": "Analyse"');
    expect(markdown).toContain("## WRITER");
    expect(markdown).toContain("# Rapport");
  });

  it("projectOrchestrator cree Project + ProjectSpec", async () => {
    mockProjectCreate.mockResolvedValueOnce({
      id: "project-1",
      title: "Projet test",
      brief: "Brief projet suffisamment long pour etre valide.",
    });
    mockProjectSpecCreate.mockResolvedValueOnce({ id: "spec-1", projectId: "project-1" });

    const result = await createProjectWithSpec({
      title: "Projet test",
      brief: "Brief projet suffisamment long pour etre valide.",
      organizationId: "ck00000000000000000000000",
    });

    expect(result.project.id).toBe("project-1");
    expect(result.spec.id).toBe("spec-1");
    expect(mockProjectCreate).toHaveBeenCalledOnce();
    expect(mockProjectSpecCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ projectId: "project-1" }) })
    );
  });

  it("approveProjectSpec cree AgentInstance + DAG", async () => {
    mockAgentTemplateFindMany.mockResolvedValueOnce(
      ROLES.map((role, index) => template(role, index + 1))
    );
    mockAgentInstanceFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(ROLES.map(instance))
      .mockResolvedValueOnce(ROLES.map(instance));
    mockTaskFindMany.mockResolvedValueOnce([]);
    mockTaskCreate.mockImplementation(async ({ data }) => ({
      id: `task-${data.agentSlug}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await approveProjectSpec("project-1");

    expect(result.agents).toHaveLength(7);
    expect(result.tasks).toHaveLength(7);
  });

  it("approveExecutionPlan dispatche uniquement les taches racines", async () => {
    mockTaskFindMany.mockResolvedValueOnce([
      {
        id: "root",
        dependsOn: [],
        agentInstance: { projectId: "project-1", project: { organizationId: "ck00000000000000000000000" } },
      },
      {
        id: "child",
        dependsOn: ["root"],
        agentInstance: { projectId: "project-1", project: { organizationId: "ck00000000000000000000000" } },
      },
    ]);
    mockTaskCount.mockResolvedValueOnce(1);

    const dispatched = await approveExecutionPlan("project-1");

    expect(dispatched).toEqual(["root"]);
    expect(mockQueueAdd).toHaveBeenCalledTimes(1);
    expect(mockQueueAdd).toHaveBeenCalledWith("agent-task", {
      taskId: "root",
      projectId: "project-1",
      organizationId: "ck00000000000000000000000",
    });
  });

  it("dispatchReadyTasks expose le dispatcher DAG", async () => {
    mockTaskFindMany.mockResolvedValueOnce([]);

    await expect(dispatchReadyTasks("project-1")).resolves.toEqual([]);
  });
});

describe("Phase 5 Zod schemas", () => {
  it("les 7 schemas acceptent des sorties valides", () => {
    for (const role of ROLES) {
      expect(() => AgentOutputSchemas[role].parse(VALID_OUTPUTS[role])).not.toThrow();
    }
  });

  it("les schemas rejettent des sorties invalides", () => {
    for (const role of ROLES) {
      expect(() => AgentOutputSchemas[role].parse({ invalid: true })).toThrow();
    }
  });
});
