import { ProjectLiveDashboard } from "@/components/projects/ProjectLiveDashboard";
import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirShell } from "@/components/savoir/SavoirShell";
import { getProjectStatus } from "@/lib/projects/status";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const status = await getProjectStatus(id);

  if (!status) {
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

  return (
    <SavoirShell>
      <ProjectLiveDashboard projectId={id} initialStatus={status} />
    </SavoirShell>
  );
}
