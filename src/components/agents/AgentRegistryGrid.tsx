import { AgentRoleBadge } from "@/components/agents/AgentRoleBadge";
import { SavoirCard } from "@/components/savoir/SavoirCard";

export type AgentTemplateView = {
  id: string;
  name: string;
  role: string;
  model: string;
  description: string;
  pipelineOrder?: number;
  metadata?: unknown;
};

function metadataArray(metadata: unknown, key: string): string[] {
  if (metadata && typeof metadata === "object" && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    return Array.isArray(value) ? value.map(String) : [];
  }
  return [];
}

export function AgentRegistryGrid({ agents }: { agents: AgentTemplateView[] }) {
  if (agents.length === 0) {
    return <p className="text-sm text-white/55">Aucun AgentTemplate disponible. Lancez le seed noyau.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {agents.map((agent) => {
        const tools = metadataArray(agent.metadata, "allowedTools");
        const tags = metadataArray(agent.metadata, "tags");
        return (
          <SavoirCard key={agent.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold">{agent.name}</p>
                <p className="mt-1 font-mono text-xs text-white/45">v1 · {agent.model}</p>
              </div>
              <AgentRoleBadge role={agent.role} />
            </div>
            <p className="mt-4 line-clamp-4 text-sm leading-6 text-white/65">{agent.description}</p>
            <div className="mt-5 space-y-3 text-xs text-white/55">
              <p>
                <span className="text-white/80">allowedTools:</span>{" "}
                {tools.length > 0 ? tools.join(", ") : "registre global"}
              </p>
              <p>
                <span className="text-white/80">tags:</span> {tags.length > 0 ? tags.join(", ") : "core"}
              </p>
            </div>
          </SavoirCard>
        );
      })}
    </div>
  );
}
