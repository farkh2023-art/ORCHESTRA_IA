import { type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type TaskValidationResult = {
  ok: boolean;
  status: "APPROVED" | "REJECTED" | "NEEDS_FIX";
  score: number;
  report: unknown;
};

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function validateTaskOutput(taskId: string): Promise<TaskValidationResult> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      agentInstance: {
        include: {
          project: { include: { specs: { orderBy: { version: "desc" }, take: 1 } } },
        },
      },
    },
  });

  if (!task) throw new Error("Task introuvable pour validation.");

  const issues: Array<{ severity: string; description: string }> = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];

  if (task.status !== "DONE") {
    issues.push({ severity: "HIGH", description: "La task n'est pas DONE." });
  } else {
    strengths.push("Task terminee.");
  }

  if (task.output == null) {
    issues.push({ severity: "HIGH", description: "La task ne contient pas d'output." });
  } else if (!isJsonObject(task.output)) {
    issues.push({ severity: "MEDIUM", description: "L'output n'est pas un objet JSON minimal." });
  } else if (Object.keys(task.output).length === 0) {
    issues.push({ severity: "MEDIUM", description: "L'output JSON est vide." });
  } else {
    strengths.push("Output JSON exploitable.");
  }

  const latestSpec = task.agentInstance.project.specs[0];
  if (!latestSpec) {
    recommendations.push("Ajouter une ProjectSpec pour renforcer la validation.");
  } else {
    strengths.push("ProjectSpec disponible pour le contexte.");
  }

  const score = Math.max(0, 100 - issues.reduce((sum, issue) => {
    if (issue.severity === "HIGH") return sum + 50;
    if (issue.severity === "MEDIUM") return sum + 20;
    return sum + 5;
  }, 0));
  const status = score >= 80 ? "APPROVED" : score >= 50 ? "NEEDS_FIX" : "REJECTED";

  const report = await db.validationReport.create({
    data: {
      agentInstanceId: task.agentInstanceId,
      taskId: task.id,
      scope: "TASK",
      status,
      overallScore: score,
      alignmentScore: latestSpec ? Math.min(100, score + 5) : score,
      issues: issues as Prisma.InputJsonValue,
      strengths: strengths as Prisma.InputJsonValue,
      recommendations: recommendations as Prisma.InputJsonValue,
      approved: status === "APPROVED",
      rejectedOutputs: status === "APPROVED" ? undefined : ([task.output ?? null] as Prisma.InputJsonValue),
    },
  });

  return { ok: status === "APPROVED", status, score, report };
}
