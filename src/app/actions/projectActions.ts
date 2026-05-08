"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { approveExecutionPlan, approveProjectSpec, createProjectWithSpec } from "@/lib/orchestrator/projectOrchestrator";
import { compileDoneOutputsMarkdown } from "@/lib/orchestrator/integrator";
import { dispatchReadyTasks } from "@/lib/dispatcher";
import { validateFinalProject } from "@/lib/validation/finalValidator";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session;
}

export async function createProjectAction(formData: FormData) {
  const session = await requireAuth();
  const title = String(formData.get("title") ?? "");
  const brief = String(formData.get("brief") ?? "");
  const { project } = await createProjectWithSpec({
    title,
    brief,
    organizationId: session.user.organizationId ?? undefined,
  });
  redirect(`/projects/${project.id}`);
}

export async function approveSpecAction(formData: FormData) {
  await requireAuth();
  const projectId = String(formData.get("projectId") ?? "");
  await approveProjectSpec(projectId);
  revalidatePath(`/projects/${projectId}`);
}

export async function approvePlanAction(formData: FormData) {
  await requireAuth();
  const projectId = String(formData.get("projectId") ?? "");
  await approveExecutionPlan(projectId);
  revalidatePath(`/projects/${projectId}`);
}

export async function launchProjectAction(formData: FormData) {
  await requireAuth();
  const projectId = String(formData.get("projectId") ?? "");
  await db.project.update({ where: { id: projectId }, data: { status: "RUNNING" } });
  await dispatchReadyTasks(projectId);
  revalidatePath(`/projects/${projectId}`);
}

export async function completeProjectIfReadyAction(formData: FormData) {
  await requireAuth();
  const projectId = String(formData.get("projectId") ?? "");
  const markdown = await compileDoneOutputsMarkdown(projectId);
  if (markdown) {
    await db.project.update({
      where: { id: projectId },
      data: { finalOutput: { markdown }, status: "DONE" },
    });
    await validateFinalProject(projectId);
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/report`);
}

export async function respondHumanCheckpointAction(formData: FormData) {
  await requireAuth();
  const taskId = String(formData.get("taskId") ?? "");
  const response = String(formData.get("response") ?? "");
  const task = await db.task.findUniqueOrThrow({
    where: { id: taskId },
    select: { agentInstanceId: true, agentInstance: { select: { projectId: true } } },
  });
  await db.message.create({
    data: {
      agentInstanceId: task.agentInstanceId,
      taskId,
      role: "USER",
      content: response || "Validation humaine recue.",
      metadata: { type: "HITL_RESPONSE" },
    },
  });
  await db.task.update({ where: { id: taskId }, data: { status: "PENDING" } });
  await dispatchReadyTasks(task.agentInstance.projectId);
  revalidatePath(`/projects/${task.agentInstance.projectId}`);
}
