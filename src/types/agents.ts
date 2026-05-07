import { z } from "zod";
import type {
  AgentSlug,
  UserRole,
  ProjectStatus,
  AgentInstanceStatus,
  TaskStatus,
  MessageRole,
  KnowledgeSourceType,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Re-exports Prisma enums
// ---------------------------------------------------------------------------
export type {
  AgentSlug,
  UserRole,
  ProjectStatus,
  AgentInstanceStatus,
  TaskStatus,
  MessageRole,
  KnowledgeSourceType,
};

// ---------------------------------------------------------------------------
// Outputs des agents ORCHESTRA_IA — schémas Zod
// ---------------------------------------------------------------------------

export const StructuredBriefSchema = z.object({
  objectives: z.array(z.string()).min(1),
  constraints: z.array(z.string()),
  deliverables: z.array(z.string()).min(1),
  executionPlan: z.array(
    z.object({
      step: z.number().int().positive(),
      agent: z.string(),
      task: z.string(),
      dependsOn: z.array(z.number().int()).optional(),
    })
  ),
  humanCheckpoints: z
    .array(z.object({ afterStep: z.number().int(), reason: z.string() }))
    .optional(),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  gaps: z.array(z.string()),
});
export type StructuredBrief = z.infer<typeof StructuredBriefSchema>;

export const AnalysisReportSchema = z.object({
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
  risks: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      mitigation: z.string(),
    })
  ),
  opportunities: z.array(z.string()),
  kpis: z.array(
    z.object({ name: z.string(), target: z.string(), measurement: z.string() })
  ),
  assumptions: z.array(z.string()),
  gaps: z.array(z.string()),
  researchPriorities: z.array(z.string()),
});
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

export const ArchitectureReportSchema = z.object({
  components: z.array(
    z.object({ name: z.string(), responsibility: z.string(), technology: z.string() })
  ),
  interactions: z.array(
    z.object({ from: z.string(), to: z.string(), type: z.enum(["sync", "async", "event"]) })
  ),
  technicalChoices: z.array(
    z.object({ option: z.string(), rationale: z.string(), tradeoffs: z.string() })
  ),
  architecturalRisks: z.array(
    z.object({ risk: z.string(), severity: z.enum(["LOW", "MEDIUM", "HIGH"]), mitigation: z.string() })
  ),
  implementationPhases: z.array(
    z.object({ phase: z.number().int(), description: z.string(), components: z.array(z.string()) })
  ),
  assumptions: z.array(z.string()),
});
export type ArchitectureReport = z.infer<typeof ArchitectureReportSchema>;

export const ResearchReportSchema = z.object({
  findings: z.array(
    z.object({
      topic: z.string(),
      summary: z.string(),
      reliability: z.enum(["HIGH", "MEDIUM", "LOW"]),
    })
  ),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string().nullable().optional(),
      date: z.string().nullable().optional(),
      type: z.enum(["academic", "industry", "official", "other"]),
    })
  ),
  synthesis: z.string(),
  dataGaps: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type ResearchReport = z.infer<typeof ResearchReportSchema>;

export const ValidationReportPayloadSchema = z.object({
  overallScore: z.number().min(0).max(10),
  alignmentScore: z.number().min(0).max(100),
  issues: z.array(
    z.object({
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      description: z.string(),
      agent: z.string(),
      recommendation: z.string(),
    })
  ),
  strengths: z.array(z.string()),
  recommendations: z.array(z.string()),
  approved: z.boolean(),
  rejectedOutputs: z.array(z.string()).optional(),
});
export type ValidationReportPayload = z.infer<typeof ValidationReportPayloadSchema>;

export const WriterDraftSchema = z.object({
  title: z.string().min(1),
  sections: z
    .array(z.object({ heading: z.string(), content: z.string().min(1) }))
    .min(1),
  summary: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
});
export type WriterDraft = z.infer<typeof WriterDraftSchema>;

export const IntegrationPackageSchema = z.object({
  deliveryPackage: z.object({
    mainReport: z.string(),
    annexes: z.array(z.object({ id: z.string(), title: z.string(), content: z.string() })),
    metadata: z.object({
      instanceId: z.string(),
      duration: z.string(),
      agentsInvolved: z.array(z.string()),
      totalTokens: z.number().int(),
      estimatedCostUsd: z.number(),
    }),
  }),
  integrationLog: z.array(
    z.object({
      source: z.string(),
      section: z.string(),
      status: z.enum(["integrated", "skipped", "replaced"]),
    })
  ),
  conflicts: z.array(z.object({ description: z.string(), resolution: z.string() })),
  coverageCheck: z.object({
    total: z.number().int(),
    covered: z.number().int(),
    missing: z.array(z.string()),
  }),
});
export type IntegrationPackage = z.infer<typeof IntegrationPackageSchema>;

export const CoreAgentRoleSchema = z.enum([
  "COORDINATOR",
  "ANALYST",
  "ARCHITECT",
  "RESEARCHER",
  "WRITER",
  "CRITIC",
  "INTEGRATOR",
] as const);
export type CoreAgentRole = z.infer<typeof CoreAgentRoleSchema>;

export const AgentOutputSchemas = {
  COORDINATOR: StructuredBriefSchema,
  ANALYST: AnalysisReportSchema,
  ARCHITECT: ArchitectureReportSchema,
  RESEARCHER: ResearchReportSchema,
  WRITER: WriterDraftSchema,
  CRITIC: ValidationReportPayloadSchema,
  INTEGRATOR: IntegrationPackageSchema,
} as const satisfies Record<CoreAgentRole, z.ZodType<unknown>>;

// ---------------------------------------------------------------------------
// Entrées API
// ---------------------------------------------------------------------------

export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(200),
  brief: z.string().min(20).max(10_000),
  organizationId: z.string().cuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// ---------------------------------------------------------------------------
// Trace LLM — payload d'enregistrement
// ---------------------------------------------------------------------------

export const TraceLLMSchema = z.object({
  organizationId: z.string().cuid(),
  projectId: z.string().cuid().optional(),
  agentSlug: z
    .enum(["COORDINATOR", "ANALYST", "ARCHITECT", "RESEARCHER", "WRITER", "CRITIC", "INTEGRATOR"])
    .optional(),
  taskId: z.string().cuid().optional(),
  provider: z.string(),
  model: z.string(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  inputHash: z.string(),
  outputHash: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type TraceLLM = z.infer<typeof TraceLLMSchema>;

// ---------------------------------------------------------------------------
// Payload de job BullMQ
// ---------------------------------------------------------------------------

export const AgentJobSchema = z.object({
  taskId: z.string().cuid(),
  projectId: z.string().cuid(),
  organizationId: z.string().cuid(),
  attempt: z.number().int().positive().optional(),
});
export type AgentJob = z.infer<typeof AgentJobSchema>;
