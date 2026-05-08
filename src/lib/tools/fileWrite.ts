import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import type { ToolHandler } from "@/lib/tools/types";
import { MAX_FILE_WRITE_BYTES, rejectSymlinkIfExists, resolveSandboxPath } from "@/lib/tools/fileSandbox";

export const fileWriteInputSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(MAX_FILE_WRITE_BYTES),
});

export const fileWriteTool: ToolHandler<z.infer<typeof fileWriteInputSchema>> = {
  name: "fileWrite",
  description: "Ecrit un fichier dans le sandbox d'outils.",
  inputSchema: fileWriteInputSchema,
  async execute(input) {
    const resolved = resolveSandboxPath(input.path);
    if (!resolved.ok) return { ok: false, error: resolved.error };

    const symlinkError = await rejectSymlinkIfExists(resolved.absolutePath);
    if (symlinkError) return { ok: false, error: symlinkError };

    try {
      await mkdir(path.dirname(resolved.absolutePath), { recursive: true });
      await writeFile(resolved.absolutePath, input.content, "utf8");
      return {
        ok: true,
        data: { path: path.relative(resolved.root, resolved.absolutePath) },
        metadata: { bytes: Buffer.byteLength(input.content, "utf8") },
      };
    } catch {
      return { ok: false, error: "Ecriture impossible dans le sandbox." };
    }
  },
};
