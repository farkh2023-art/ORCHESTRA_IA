import path from "node:path";
import { lstat } from "node:fs/promises";

export const MAX_FILE_WRITE_BYTES = 200_000;
export const MAX_FILE_READ_BYTES = 200_000;

export function getSandboxRoot(): string | null {
  const configured = process.env.TOOL_SANDBOX_DIR;
  if (!configured) return null;
  return path.resolve(configured);
}

export function resolveSandboxPath(relativePath: string): { ok: true; root: string; absolutePath: string } | { ok: false; error: string } {
  const root = getSandboxRoot();
  if (!root) return { ok: false, error: "TOOL_SANDBOX_DIR n'est pas configure." };
  if (path.isAbsolute(relativePath)) {
    return { ok: false, error: "Chemin refuse : les chemins absolus sont interdits." };
  }
  if (relativePath.includes("\0")) {
    return { ok: false, error: "Chemin refuse : caractere nul interdit." };
  }

  const absolutePath = path.resolve(root, relativePath);
  const inside = absolutePath === root || absolutePath.startsWith(root + path.sep);
  if (!inside) return { ok: false, error: "Chemin refuse : sortie du sandbox interdite." };

  return { ok: true, root, absolutePath };
}

export async function rejectSymlinkIfExists(absolutePath: string): Promise<string | null> {
  try {
    const stat = await lstat(absolutePath);
    return stat.isSymbolicLink() ? "Chemin refuse : lien symbolique interdit." : null;
  } catch {
    return null;
  }
}
