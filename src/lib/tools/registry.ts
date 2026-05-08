import { ZodError } from "zod";
import { codeExecTool } from "@/lib/tools/codeExec";
import { fileReadTool } from "@/lib/tools/fileRead";
import { fileWriteTool } from "@/lib/tools/fileWrite";
import { humanAskTool } from "@/lib/tools/humanAsk";
import type { ToolCallResult, ToolContext, ToolHandler, ToolName, ToolRegistry } from "@/lib/tools/types";
import { vectorSearchTool } from "@/lib/tools/vectorSearch";
import { webFetchTool } from "@/lib/tools/webFetch";
import { webSearchTool } from "@/lib/tools/webSearch";

const registry: ToolRegistry = new Map();

export function registerTool<TInput>(tool: ToolHandler<TInput>): void {
  registry.set(tool.name, tool as ToolHandler);
}

export function getTool(name: ToolName): ToolHandler | undefined {
  return registry.get(name);
}

export function listTools(): Array<{ name: ToolName; description: string }> {
  return [...registry.values()].map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));
}

export async function executeTool(
  name: ToolName | string,
  input: unknown,
  context: ToolContext
): Promise<ToolCallResult> {
  const tool = registry.get(name as ToolName) as ToolHandler<unknown> | undefined;
  if (!tool) return { ok: false, error: `Outil inconnu : ${name}.` };

  const parsed = tool.inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Input d'outil invalide.",
      metadata: { issues: formatZodIssues(parsed.error) },
    };
  }

  try {
    return await tool.execute(parsed.data, context);
  } catch {
    return { ok: false, error: `Erreur inattendue pendant l'execution de l'outil ${name}.` };
  }
}

function formatZodIssues(error: ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`);
}

[
  webSearchTool,
  webFetchTool,
  codeExecTool,
  fileReadTool,
  fileWriteTool,
  vectorSearchTool,
  humanAskTool,
].forEach((tool) => registerTool(tool as ToolHandler));
