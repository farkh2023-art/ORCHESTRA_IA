"use client";

import { approvePlanAction, approveSpecAction, completeProjectIfReadyAction, launchProjectAction } from "@/app/actions/projectActions";
import { ProjectDagFlow } from "@/components/dag/ProjectDagFlow";
import { HitlConsole } from "@/components/hitl/HitlConsole";
import { CostPanel } from "@/components/projects/CostPanel";
import { MessageTimeline } from "@/components/projects/MessageTimeline";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { useProjectStatus } from "@/hooks/useProjectStatus";
import type { ProjectStatusPayload } from "@/types/projectStatus";

export function ProjectLiveDashboard({
  projectId,
  initialStatus,
}: {
  projectId: string;
  initialStatus: ProjectStatusPayload;
}) {
  const { data, loading, error, refresh } = useProjectStatus(projectId, initialStatus);
  const status = data ?? initialStatus;

  return (
    <div className="space-y-8">
      <ProjectHeader title={status.project.title} brief={status.project.brief} status={status.project.status} />
      <div className="flex flex-wrap items-center gap-3">
        <form action={approveSpecAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <SavoirButton type="submit" variant="secondary">Valider ProjectSpec</SavoirButton>
        </form>
        <form action={approvePlanAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <SavoirButton type="submit" variant="secondary">Valider plan</SavoirButton>
        </form>
        <form action={launchProjectAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <SavoirButton type="submit">Lancer projet</SavoirButton>
        </form>
        <form action={completeProjectIfReadyAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <SavoirButton type="submit" variant="secondary">Compiler rapport</SavoirButton>
        </form>
        <SavoirButton type="button" variant="quiet" onClick={() => void refresh()}>
          {loading ? "Actualisation..." : "Rafraichir"}
        </SavoirButton>
        <SavoirButton href={`/projects/${projectId}/report`} variant="quiet">Rapport</SavoirButton>
        {error ? <span className="text-sm text-red-200">{error}</span> : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <ProjectDagFlow tasks={status.tasks} />
        <div className="space-y-5">
          <CostPanel tokens={status.traces.totalTokens} costUsd={status.traces.costUsd} />
          <SavoirCard className="p-5">
            <h2 className="font-display text-xl font-semibold">ProjectSpec</h2>
            <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 font-mono text-xs text-white/65">
              {JSON.stringify(status.spec?.content ?? {}, null, 2)}
            </pre>
          </SavoirCard>
          <SavoirCard className="p-5">
            <h2 className="font-display text-xl font-semibold">Validation</h2>
            <p className="mt-3 font-mono text-sm text-white/65">{status.validationReports.length} reports</p>
          </SavoirCard>
        </div>
      </div>
      <HitlConsole tasks={status.waitingHumanTasks} />
      <MessageTimeline messages={status.messages} />
    </div>
  );
}
