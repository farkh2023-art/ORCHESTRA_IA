import { FinalReportViewer } from "@/components/projects/FinalReportViewer";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirShell } from "@/components/savoir/SavoirShell";
import { db } from "@/lib/db";

async function loadReport(id: string) {
  try {
    return await db.project.findUnique({
      where: { id },
      include: {
        agentInstances: {
          include: {
            tasks: {
              include: { validationReports: { orderBy: { createdAt: "desc" } } },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function ProjectReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await loadReport(id);

  if (!project) {
    return (
      <SavoirShell>
        <SavoirCard className="p-6">Rapport indisponible.</SavoirCard>
      </SavoirShell>
    );
  }

  const tasks = project.agentInstances.flatMap((instance) =>
    instance.tasks.map((task) => ({ ...task, role: instance.role ?? "UNKNOWN" }))
  );
  const reports = tasks.flatMap((task) => task.validationReports.map((report) => ({ ...report, role: task.role })));

  return (
    <SavoirShell>
      <div className="space-y-6">
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#00E5D1]">Final output</p>
          <h1 className="font-display text-4xl font-bold">{project.title}</h1>
        </section>
        <FinalReportViewer finalOutput={project.finalOutput} />
        <SavoirCard className="p-5">
          <h2 className="font-display text-xl font-semibold">Validation reports</h2>
          <div className="mt-4 space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-white/55">Aucun rapport de validation disponible.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{report.role}</p>
                    <p className="font-mono text-sm text-[#F4C77B]">
                      {report.status} · {report.overallScore}/100
                    </p>
                  </div>
                  <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/25 p-3 font-mono text-xs text-white/60">
                    {JSON.stringify({ issues: report.issues, recommendations: report.recommendations }, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </SavoirCard>
        <SavoirCard className="p-5">
          <h2 className="font-display text-xl font-semibold">Outputs agents</h2>
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <details key={task.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <summary className="cursor-pointer font-semibold">{task.role} · {task.status}</summary>
                <pre className="mt-3 max-h-72 overflow-auto font-mono text-xs text-white/60">
                  {JSON.stringify(task.output ?? {}, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </SavoirCard>
      </div>
    </SavoirShell>
  );
}
