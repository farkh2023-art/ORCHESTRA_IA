import { approvePlanAction, approveSpecAction, completeProjectIfReadyAction, launchProjectAction } from "@/app/actions/projectActions";
import { ProjectDagFlow } from "@/components/dag/ProjectDagFlow";
import { HitlConsole } from "@/components/hitl/HitlConsole";
import { CostPanel } from "@/components/projects/CostPanel";
import { MessageTimeline } from "@/components/projects/MessageTimeline";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirShell } from "@/components/savoir/SavoirShell";
import { db } from "@/lib/db";

async function loadProject(id: string) {
  try {
    const [project, traces] = await Promise.all([
      db.project.findUnique({
        where: { id },
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
        where: { projectId: id },
        _sum: { tokensIn: true, tokensOut: true, costUsd: true },
      }),
    ]);
    return { project, traces };
  } catch {
    return { project: null, traces: null };
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, traces } = await loadProject(id);

  if (!project) {
    return (
      <SavoirShell>
        <SavoirCard className="p-6">
          <h1 className="font-display text-3xl font-bold">Projet introuvable</h1>
          <p className="mt-3 text-white/60">Le projet n&apos;existe pas ou la base est indisponible.</p>
          <div className="mt-5">
            <SavoirButton href="/projects/new">Creer un projet</SavoirButton>
          </div>
        </SavoirCard>
      </SavoirShell>
    );
  }

  const tasks = project.agentInstances.flatMap((instance) =>
    instance.tasks.map((task) => ({
      id: task.id,
      role: instance.role ?? "UNKNOWN",
      status: task.status,
      dependsOn: task.dependsOn,
      input: task.input,
    }))
  );
  const messages = project.agentInstances.flatMap((instance) => instance.messages);
  const hitlTasks = tasks.filter((task) => task.status === "WAITING_HUMAN");
  const totalTokens = (traces?._sum.tokensIn ?? 0) + (traces?._sum.tokensOut ?? 0);

  return (
    <SavoirShell>
      <div className="space-y-8">
        <ProjectHeader title={project.title} brief={project.brief} status={project.status} />
        <div className="flex flex-wrap gap-3">
          <form action={approveSpecAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <SavoirButton type="submit" variant="secondary">Valider ProjectSpec</SavoirButton>
          </form>
          <form action={approvePlanAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <SavoirButton type="submit" variant="secondary">Valider plan</SavoirButton>
          </form>
          <form action={launchProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <SavoirButton type="submit">Lancer projet</SavoirButton>
          </form>
          <form action={completeProjectIfReadyAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <SavoirButton type="submit" variant="secondary">Compiler rapport</SavoirButton>
          </form>
          <SavoirButton href={`/projects/${project.id}`} variant="quiet">Rafraichir</SavoirButton>
          <SavoirButton href={`/projects/${project.id}/report`} variant="quiet">Rapport</SavoirButton>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <ProjectDagFlow tasks={tasks} />
          <div className="space-y-5">
            <CostPanel tokens={totalTokens} costUsd={traces?._sum.costUsd ?? 0} />
            <SavoirCard className="p-5">
              <h2 className="font-display text-xl font-semibold">ProjectSpec</h2>
              <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 font-mono text-xs text-white/65">
                {JSON.stringify(project.specs[0]?.content ?? {}, null, 2)}
              </pre>
            </SavoirCard>
          </div>
        </div>
        <HitlConsole tasks={hitlTasks} />
        <MessageTimeline messages={messages} />
      </div>
    </SavoirShell>
  );
}
