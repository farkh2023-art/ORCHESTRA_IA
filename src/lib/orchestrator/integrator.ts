import { CORE_AGENT_ROLES } from "@/lib/orchestrator/recruiter";
import { db } from "@/lib/db";

function formatOutput(output: unknown): string {
  if (typeof output === "string") return output;
  return "```json\n" + JSON.stringify(output, null, 2) + "\n```";
}

export async function compileDoneOutputsMarkdown(projectId: string): Promise<string> {
  const tasks = await db.task.findMany({
    where: { agentInstance: { projectId }, status: "DONE" },
    select: {
      id: true,
      output: true,
      agentInstance: { select: { role: true } },
    },
  });

  const sorted = [...tasks].sort((a, b) => {
    const aIndex = CORE_AGENT_ROLES.indexOf(a.agentInstance.role ?? "COORDINATOR");
    const bIndex = CORE_AGENT_ROLES.indexOf(b.agentInstance.role ?? "COORDINATOR");
    return aIndex - bIndex;
  });

  return sorted
    .map((task) => {
      const role = task.agentInstance.role ?? "UNKNOWN";
      return `## ${role}\n\n${formatOutput(task.output)}\n`;
    })
    .join("\n")
    .trim();
}
