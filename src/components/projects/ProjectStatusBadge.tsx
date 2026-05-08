import { SavoirBadge } from "@/components/savoir/SavoirBadge";

const toneByStatus: Record<string, "turquoise" | "violet" | "gold" | "neutral" | "danger"> = {
  PENDING: "neutral",
  RUNNING: "violet",
  DONE: "turquoise",
  FAILED: "danger",
  WAITING_HUMAN: "gold",
  CANCELLED: "neutral",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const tone = toneByStatus[status] ?? "neutral";
  return <SavoirBadge tone={tone}>{status}</SavoirBadge>;
}
