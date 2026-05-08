import { SavoirBadge } from "@/components/savoir/SavoirBadge";

export function AgentRoleBadge({ role }: { role: string }) {
  const tone = role === "COORDINATOR" ? "gold" : role === "INTEGRATOR" ? "turquoise" : "violet";
  return <SavoirBadge tone={tone}>{role}</SavoirBadge>;
}
