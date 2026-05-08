import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { z } from "zod";
import type { ToolHandler } from "@/lib/tools/types";
import { MAX_FILE_READ_BYTES, rejectSymlinkIfExists, resolveSandboxPath } from "@/lib/tools/fileSandbox";

export const fileReadInputSchema = z.object({
  path: z.string().min(1).max(500),
});

export const fileReadTool: ToolHandler<z.infer<typeof fileReadInputSchema>> = {
  name: "fileRead",
  description: "Lit un fichier dans le sandbox d'outils.",
  inputSchema: fileReadInputSchema,
  async execute(input) {
    const resolved = resolveSandboxPath(input.path);
    if (!resolved.ok) return { ok: false, error: resolved.error };

    const symlinkError = await rejectSymlinkIfExists(resolved.absolutePath);
    if (symlinkError) return { ok: false, error: symlinkError };

    try {
      const info = await stat(resolved.absolutePath);
      if (!info.isFile()) return { ok: false, error: "Lecture refusee : le chemin n'est pas un fichier." };
      if (info.size > MAX_FILE_READ_BYTES) {
        return { ok: false, error: "Lecture refusee : fichier trop volumineux." };
      }
      const content = await readFile(resolved.absolutePath, "utf8");
      return {
        ok: true,
        data: { path: path.relative(resolved.root, resolved.absolutePath), content },
        metadata: { bytes: info.size },
      };
    } catch {
      return { ok: false, error: "Lecture impossible dans le sandbox." };
    }
  },
};
