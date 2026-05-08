import { AgentRegistryGrid, type AgentTemplateView } from "@/components/agents/AgentRegistryGrid";
import { SavoirShell } from "@/components/savoir/SavoirShell";
import { db } from "@/lib/db";

async function loadAgents(): Promise<AgentTemplateView[]> {
  try {
    return await db.agentTemplate.findMany({
      orderBy: { pipelineOrder: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        model: true,
        description: true,
        pipelineOrder: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const [agents, query] = await Promise.all([loadAgents(), searchParams]);
  const filtered = query.role ? agents.filter((agent) => agent.role === query.role) : agents;
  const roles = [...new Set(agents.map((agent) => agent.role))];

  return (
    <SavoirShell>
      <div className="space-y-8">
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#00E5D1]">Agent registry</p>
          <h1 className="font-display text-4xl font-bold">Catalogue des agents noyau</h1>
          <p className="mt-4 max-w-3xl text-white/65">
            Les AgentTemplate exposent le role officiel, le modele par defaut, les tags et les outils autorises.
          </p>
        </section>
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:text-white" href="/registry">
            Tous
          </a>
          {roles.map((role) => (
            <a
              key={role}
              className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:text-white"
              href={`/registry?role=${role}`}
            >
              {role}
            </a>
          ))}
        </div>
        <AgentRegistryGrid agents={filtered} />
      </div>
    </SavoirShell>
  );
}
