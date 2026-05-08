import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks déclarés avant tout import du module testé ─────────────────────────

const mockMessagesCreate = vi.fn();

vi.mock("@/lib/llm", () => ({
  anthropic: { messages: { create: mockMessagesCreate } },
  estimateCostUsd: vi.fn().mockReturnValue(0.001),
}));

const mockTaskFindUniqueOrThrow = vi.fn();
const mockTaskUpdate = vi.fn();
const mockMessageCreate = vi.fn();
const mockTraceCreate = vi.fn();
const mockTraceAggregate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      findUniqueOrThrow: mockTaskFindUniqueOrThrow,
      update: mockTaskUpdate,
    },
    message: { create: mockMessageCreate },
    trace: { create: mockTraceCreate, aggregate: mockTraceAggregate },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ───────────────────────────────────────────────────────────[...]

const VALID_REPORT = {
  swot: {
    strengths: ["Équipe expérimentée"],
    weaknesses: ["Budget limité"],
    opportunities: ["Marché en croissance"],
    threats: ["Concurrence accrue"],
  },
  risks: [
    { description: "Risque de délai", severity: "MEDIUM" as const, mitigation: "Buffer 20%" },
  ],
  opportunities: ["Expansion internationale"],
  kpis: [{ name: "NPS", target: "> 50", measurement: "Enquête trimestrielle" }],
  assumptions: ["Le marché cible est francophone"],
  gaps: [],
  researchPriorities: ["Analyse concurrentielle", "Taille du marché"],
};

const MOCK_TASK = {
  id: "task-abc",
  agentSlug: "ANALYST" as const,
  input: {
    objectives: ["Lancer un produit SaaS"],
    constraints: ["Budget 50k€"],
    deliverables: ["Rapport d'analyse"],
    executionPlan: [],
    complexity: "MEDIUM",
    gaps: [],
  },
  agentInstance: {
    id: "instance-xyz",
    role: "ANALYST" as const,
    agentTemplate: {
      slug: "ANALYST",
      role: "ANALYST",
      model: "claude-sonnet-4-6",
      systemPrompt: "Tu es l'agent Analyste.",
    },
    projectId: "project-123",
    project: { id: "project-123", organizationId: "org-456" },
  },
};

function apiResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }],
    usage: { input_tokens: 100, output_tokens: 200 },
  };
}

// ── Suite de tests ─────────────────────────────────────────────────────────[...]

describe("runAnalyst", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockTaskFindUniqueOrThrow.mockResolvedValue(MOCK_TASK);
    mockTaskUpdate.mockResolvedValue({});
    mockMessageCreate.mockResolvedValue({});
    mockTraceCreate.mockResolvedValue({});
    mockTraceAggregate.mockResolvedValue({ _sum: { costUsd: 0 } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  // ── 1. Chemin nominal ──────────────────────────────────────────────────────

  it("runAgentTask passe une Task Analyst à DONE", async () => {
    mockMessagesCreate.mockResolvedValueOnce(
      apiResponse(JSON.stringify(VALID_REPORT))
    );

    const { runAnalyst } = await import("./analyst");
    const result = await runAnalyst("task-abc");

    expect(result.swot.strengths).toEqual(["Équipe expérimentée"]);
    expect(result.researchPriorities).toHaveLength(2);

    expect(mockTaskUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: expect.objectContaining({ status: "RUNNING" }) })
    );
    expect(mockTaskUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: expect.objectContaining({ status: "DONE" }) })
    );
  });

  // ── 2. Message persisté ────────────────────────────────────────────────────

  it("persiste un Message ASSISTANT après la réponse LLM", async () => {
    mockMessagesCreate.mockResolvedValueOnce(
      apiResponse(JSON.stringify(VALID_REPORT))
    );

    const { runAnalyst } = await import("./analyst");
    await runAnalyst("task-abc");

    expect(mockMessageCreate).toHaveBeenCalledOnce();
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "ASSISTANT",
          agentInstanceId: "instance-xyz",
          taskId: "task-abc",
        }),
      })
    );
  });

  // ── 3. Trace LLM persistée ─────────────────────────────────────────────────

  it("persiste une Trace LLM avec provider=anthropic", async () => {
    mockMessagesCreate.mockResolvedValueOnce(
      apiResponse(JSON.stringify(VALID_REPORT))
    );

    const { runAnalyst } = await import("./analyst");
    await runAnalyst("task-abc");

    expect(mockTraceCreate).toHaveBeenCalledOnce();
    expect(mockTraceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: "anthropic",
          model: "claude-sonnet-4-6",
          tokensIn: 100,
          tokensOut: 200,
          organizationId: "org-456",
        }),
      })
    );
  });

  // ── 4. Retry sur JSON invalide ─────────────────────────────────────────────

  it("retente sur JSON invalide puis réussit", async () => {
    mockMessagesCreate
      .mockResolvedValueOnce(apiResponse("ce n'est pas du JSON"))
      .mockResolvedValueOnce(apiResponse(JSON.stringify(VALID_REPORT)));

    const { runAnalyst } = await import("./analyst");
    const promise = runAnalyst("task-abc");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({ swot: VALID_REPORT.swot });
    expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
  });

  // ── 5. Retry sur erreur réseau ────────────────────────────────────────────

  it("retente sur erreur réseau puis réussit", async () => {
    mockMessagesCreate
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(apiResponse(JSON.stringify(VALID_REPORT)));

    const { runAnalyst } = await import("./analyst");
    const promise = runAnalyst("task-abc");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.kpis[0].name).toBe("NPS");
    expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
  });

  // ── 6. FAILED après épuisement des retries réseau ────────────────────────

  it("marque la Task FAILED après épuisement de toutes les tentatives", async () => {
    mockMessagesCreate.mockRejectedValue(new Error("API indisponible"));

    const { runAnalyst } = await import("./analyst");
    const promise = runAnalyst("task-abc");
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow("API indisponible");

    const lastCallArgs = mockTaskUpdate.mock.calls.at(-1)![0] as { data: { status: string; error: string } };
    expect(lastCallArgs.data.status).toBe("FAILED");
    expect(lastCallArgs.data.error).toContain("API indisponible");
  });

  // ── 7. FAILED après 3 retries JSON invalides ──────────────────────────────

  it("runAgentTask passe une Task à FAILED après 3 retries JSON invalides", async () => {
    mockMessagesCreate.mockResolvedValue(apiResponse("{ ceci n'est pas du json !!"));

    const { runAnalyst } = await import("./analyst");
    const promise = runAnalyst("task-abc");
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow();

    expect(mockMessagesCreate).toHaveBeenCalledTimes(4); // 1 initial + 3 retries

    const lastCallArgs = mockTaskUpdate.mock.calls.at(-1)![0] as { data: { status: string } };
    expect(lastCallArgs.data.status).toBe("FAILED");
  });

  // ── 8. FAILED si organizationId absent ───────────────────────────────────

  it("runAgentTask échoue si organizationId absent", async () => {
    mockTaskFindUniqueOrThrow.mockResolvedValueOnce({
      ...MOCK_TASK,
      agentInstance: {
        ...MOCK_TASK.agentInstance,
        project: { id: "project-123", organizationId: null },
      },
    });

    const { runAnalyst } = await import("./analyst");
    await expect(runAnalyst("task-abc")).rejects.toThrow("organizationId manquant");

    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  // ── 9. costGuard bloque si MAX_PROJECT_USD dépassé ───────────────────────

  it("costGuard bloque si MAX_PROJECT_USD dépassé", async () => {
    vi.stubEnv("MAX_PROJECT_USD", "10");
    mockTraceAggregate.mockResolvedValueOnce({ _sum: { costUsd: 10.5 } });

    const { runAnalyst } = await import("./analyst");
    const promise = runAnalyst("task-abc");
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow(
      "Budget MAX_PROJECT_USD dépassé"
    );

    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  // ── 10. Fallback Sonnet → Haiku sur erreur 529 ────────────────────────────

  it("fallback Sonnet → Haiku sur erreur 529", async () => {
    const overloadErr = Object.assign(new Error("Service overloaded"), { status: 529 });
    mockMessagesCreate
      .mockRejectedValueOnce(overloadErr)
      .mockResolvedValueOnce(apiResponse(JSON.stringify(VALID_REPORT)));

    const { runAnalyst } = await import("./analyst");
    const promise = runAnalyst("task-abc");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({ swot: VALID_REPORT.swot });
    expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
    expect(mockMessagesCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: "claude-haiku-4-5-20251001" })
    );
  });
});
