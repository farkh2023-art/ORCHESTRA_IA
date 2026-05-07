import { db } from "@/lib/db";
import { agentQueue } from "@/lib/queue";

type TaskReady = {
  id: string;
  agentSlug: string;
  dependsOn: string[];
  agentInstance: { projectId: string; project: { organizationId: string | null } };
};

async function allDepsAreDone(deps: string[]): Promise<boolean> {
  if (deps.length === 0) return true;
  const notDone = await db.task.count({
    where: { id: { in: deps }, status: { not: "DONE" } },
  });
  return notDone === 0;
}

async function enqueueTask(task: TaskReady): Promise<void> {
  await db.task.update({ where: { id: task.id }, data: { status: "QUEUED" } });
  await agentQueue.add(task.agentSlug, {
    taskId: task.id,
    projectId: task.agentInstance.projectId,
    organizationId: task.agentInstance.project.organizationId ?? "",
  });
}

const TASK_SELECT = {
  id: true,
  agentSlug: true,
  dependsOn: true,
  agentInstance: {
    select: { projectId: true, project: { select: { organizationId: true } } },
  },
} as const;

export async function dispatchReady(projectId: string): Promise<string[]> {
  const pending = await db.task.findMany({
    where: { agentInstance: { projectId }, status: "PENDING" },
    select: TASK_SELECT,
  });

  const dispatched: string[] = [];
  for (const task of pending) {
    if (await allDepsAreDone(task.dependsOn)) {
      await enqueueTask(task);
      dispatched.push(task.id);
    }
  }
  return dispatched;
}

export async function unlockDependents(completedTaskId: string): Promise<string[]> {
  const candidates = await db.task.findMany({
    where: { dependsOn: { has: completedTaskId }, status: "PENDING" },
    select: TASK_SELECT,
  });

  const dispatched: string[] = [];
  for (const task of candidates) {
    if (await allDepsAreDone(task.dependsOn)) {
      await enqueueTask(task);
      dispatched.push(task.id);
    }
  }
  return dispatched;
}
