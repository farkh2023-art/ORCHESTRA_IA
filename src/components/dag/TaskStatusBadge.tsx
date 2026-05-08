import type { TaskStatus } from "@prisma/client";
import { SavoirBadge } from "@/components/savoir/SavoirBadge";

const toneByStatus: Record<TaskStatus, "turquoise" | "violet" | "gold" | "neutral" | "danger"> = {
  PENDING: "neutral",
  QUEUED: "violet",
  RUNNING: "violet",
  DONE: "turquoise",
  FAILED: "danger",
  SKIPPED: "neutral",
  WAITING_HUMAN: "gold",
};

export function TaskStatusBadge({ status }: { status: TaskStatus | string }) {
  return <SavoirBadge tone={toneByStatus[status as TaskStatus] ?? "neutral"}>{status}</SavoirBadge>;
}
