import { AnalysisReportSchema, type AnalysisReport } from "@/types/agents";
import { runAgentTask } from "./base";

export async function runAnalyst(taskId: string): Promise<AnalysisReport> {
  return runAgentTask({ taskId, schema: AnalysisReportSchema });
}
