import { db } from "@/lib/db";

export class BudgetExceededError extends Error {
  constructor(projectId: string, spent: number, max: number) {
    super(
      `Budget MAX_PROJECT_USD dépassé pour le projet ${projectId} ` +
        `(${spent.toFixed(4)} USD >= ${max} USD)`
    );
    this.name = "BudgetExceededError";
  }
}

export async function costGuard(projectId: string): Promise<void> {
  const maxUsd = parseFloat(process.env.MAX_PROJECT_USD ?? "");
  if (!Number.isFinite(maxUsd) || maxUsd <= 0) return;

  const agg = await db.trace.aggregate({
    where: { projectId },
    _sum: { costUsd: true },
  });

  const spent = (agg._sum.costUsd as number | null) ?? 0;
  if (spent >= maxUsd) {
    throw new BudgetExceededError(projectId, spent, maxUsd);
  }
}
