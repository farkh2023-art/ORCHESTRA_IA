import { db } from "@/lib/db";
import type { ProjectStatusPayload } from "@/types/projectStatus";

function iso(value: Date): string {
  return value.toISOString();
}

export function isSafeProjectId(projectId: string): boolean {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(projectId);
}

export async function getProjectStatus(projectId: string): Promise<ProjectStatusPayload | null> {
  if (!isSafeProjectId(projectId)) return null;

  try {
    const [project, traceAggregate, validationReports] = await Promise.all([
      db.project.findUnique({
        where: { id: projectId },
        include: {
          specs: { orderBy: { version: "desc" }, take: 1 },
          agentInstances: {
            include: {
              messages: { orderBy: { createdAt: "desc" }, take: 20 },
              tasks: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      }),
      db.trace.aggregate({
        where: { projectId },
        _sum: { costUsd: true, tokensIn: true, tokensOut: true },
      }),
      db.validationReport.findMany({
        where: {
          OR: [
            { task: { agentInstance: { projectId } } },
            { agentInstance: { projectId } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    if (!project) return null;

    const tasks = project.agentInstances.flatMap((instance) =>
      instance.tasks.map((task) => ({
        id: task.id,
        role: instance.role ?? "UNKNOWN",
        status: task.status,
        dependsOn: task.dependsOn,
        input: task.input,
        output: task.output,
        error: task.error,
        tokensUsed: task.tokensUsed,
        createdAt: iso(task.createdAt),
        updatedAt: iso(task.updatedAt),
      }))
    );

    const messages = project.agentInstances
      .flatMap((instance) =>
        instance.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          taskId: message.taskId,
          createdAt: iso(message.createdAt),
        }))
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30);

    const tokensIn = traceAggregate._sum.tokensIn ?? 0;
    const tokensOut = traceAggregate._sum.tokensOut ?? 0;

    return {
      project: {
        id: project.id,
        title: project.title,
        brief: project.brief,
        status: project.status,
        finalOutput: project.finalOutput,
        createdAt: iso(project.createdAt),
        updatedAt: iso(project.updatedAt),
      },
      spec: project.specs[0]
        ? {
            id: project.specs[0].id,
            version: project.specs[0].version,
            content: project.specs[0].content,
            createdAt: iso(project.specs[0].createdAt),
          }
        : null,
      tasks,
      waitingHumanTasks: tasks.filter((task) => task.status === "WAITING_HUMAN"),
      messages,
      traces: {
        costUsd: traceAggregate._sum.costUsd ?? 0,
        tokensIn,
        tokensOut,
        totalTokens: tokensIn + tokensOut,
      },
      validationReports: validationReports.map((report) => ({
        id: report.id,
        taskId: report.taskId,
        agentInstanceId: report.agentInstanceId,
        scope: report.scope,
        status: report.status,
        overallScore: report.overallScore,
        alignmentScore: report.alignmentScore,
        approved: report.approved,
        createdAt: iso(report.createdAt),
      })),
    };
  } catch {
    return null;
  }
}
