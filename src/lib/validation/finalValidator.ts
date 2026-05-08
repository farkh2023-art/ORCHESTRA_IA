import { type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type FinalValidationResult = {
  ok: boolean;
  status: "APPROVED" | "REJECTED" | "NEEDS_FIX";
  score: number;
  report: unknown;
};

export async function validateFinalProject(projectId: string): Promise<FinalValidationResult> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      agentInstances: { include: { tasks: true } },
    },
  });
  if (!project) throw new Error("Projet introuvable pour validation finale.");

  const tasks = project.agentInstances.flatMap((instance) => instance.tasks);
  const incomplete = tasks.filter((task) => task.status !== "DONE");
  const issues: Array<{ severity: string; description: string }> = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];

  if (tasks.length === 0) {
    issues.push({ severity: "HIGH", description: "Aucune task projet a valider." });
  }
  if (incomplete.length > 0) {
    issues.push({ severity: "HIGH", description: "Toutes les tasks du projet ne sont pas DONE." });
  } else if (tasks.length > 0) {
    strengths.push("Toutes les tasks sont DONE.");
  }

  if (project.finalOutput == null) {
    issues.push({ severity: "HIGH", description: "Project.finalOutput est absent." });
  } else {
    strengths.push("Livrable final present.");
  }

  const score = Math.max(0, 100 - issues.length * 50);
  const status = score >= 80 ? "APPROVED" : score >= 50 ? "NEEDS_FIX" : "REJECTED";

  const report = await db.validationReport.create({
    data: {
      scope: "FINAL",
      status,
      overallScore: score,
      alignmentScore: score,
      issues: issues as Prisma.InputJsonValue,
      strengths: strengths as Prisma.InputJsonValue,
      recommendations: recommendations as Prisma.InputJsonValue,
      approved: status === "APPROVED",
      rejectedOutputs: status === "APPROVED" ? undefined : ([project.finalOutput ?? null] as Prisma.InputJsonValue),
    },
  });

  if (status !== "APPROVED") {
    await db.project.update({
      where: { id: projectId },
      data: { status: "WAITING_HUMAN" },
    });
  }

  return { ok: status === "APPROVED", status, score, report };
}
