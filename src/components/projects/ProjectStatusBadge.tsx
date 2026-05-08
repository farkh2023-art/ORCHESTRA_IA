import type { ProjectStatus } from "@prisma/client";
import { SavoirBadge } from "@/components/savoir/SavoirBadge";

const toneByStatus: Record<ProjectStatus, "turquoise" | "violet" | "gold" | "neutral" | "danger"> = {
  PENDING: "neutral",
  RUNNING: "violet",
  DONE: "turquoise",
  FAILED: "danger",
  WAITING_HUMAN: "gold",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus | string }) {
  const tone = toneByStatus[status as ProjectStatus] ?? "neutral";
  return <SavoirBadge tone={tone}>{status}</SavoirBadge>;
}
