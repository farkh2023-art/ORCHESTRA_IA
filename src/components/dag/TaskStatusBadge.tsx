import { SavoirBadge } from "@/components/savoir/SavoirBadge";

const toneByStatus: Record<string, "turquoise" | "violet" | "gold" | "neutral" | "danger"> = {
  PENDING: "neutral",
  QUEUED: "violet",
  RUNNING: "violet",
  DONE: "turquoise",
  FAILED: "danger",
  SKIPPED: "neutral",
  WAITING_HUMAN: "gold",
  CANCELLED: "neutral",
};

export function TaskStatusBadge({ status }: { status: string }) {
  return <SavoirBadge tone={toneByStatus[String(status)] ?? "neutral"}>{status}</SavoirBadge>;
}
