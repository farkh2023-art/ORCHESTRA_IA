import type { z } from "zod";

export type ToolName =
  | "webSearch"
  | "webFetch"
  | "codeExec"
  | "fileRead"
  | "fileWrite"
  | "vectorSearch"
  | "humanAsk";

export type ToolContext = {
  organizationId: string;
  projectId?: string;
  taskId?: string;
  agentInstanceId?: string;
  userId?: string;
};

export type ToolCallInput = {
  name: ToolName;
  input: unknown;
  context: ToolContext;
};

export type ToolCallResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
};

export type ToolHandler<TInput = unknown> = {
  name: ToolName;
  description: string;
  inputSchema: z.ZodTypeAny;
  execute(input: TInput, context: ToolContext): Promise<ToolCallResult>;
};

export type ToolRegistry = Map<ToolName, ToolHandler>;
