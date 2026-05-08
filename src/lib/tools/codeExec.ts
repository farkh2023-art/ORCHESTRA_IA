import { z } from "zod";
import type { ToolHandler } from "@/lib/tools/types";

export const codeExecInputSchema = z.object({
  language: z.enum(["javascript", "typescript"]).default("javascript"),
  code: z.string().min(1).max(10_000),
  timeoutMs: z.number().int().min(100).max(5_000).default(1_000),
});

export const codeExecTool: ToolHandler<z.infer<typeof codeExecInputSchema>> = {
  name: "codeExec",
  description: "Interface d'execution de code securisee, desactivee par defaut.",
  inputSchema: codeExecInputSchema,
  async execute() {
    if (process.env.ENABLE_CODE_EXEC !== "true") {
      return {
        ok: false,
        error: "codeExec est desactive. Definissez ENABLE_CODE_EXEC=true dans un environnement sandbox dedie.",
      };
    }

    return {
      ok: false,
      error: "codeExec n'execute pas encore de code libre pour des raisons de securite.",
    };
  },
};
