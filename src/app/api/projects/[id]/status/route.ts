import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectStatus, isSafeProjectId } from "@/lib/projects/status";
import { projectBelongsToOrganization } from "@/lib/projects/ownership";
import { ensureUserOrganization } from "@/lib/auth/tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  if (!isSafeProjectId(id)) {
    return NextResponse.json({ error: "projectId invalide" }, { status: 400 });
  }

  // Résoudre l'orgId — provisionner si absent, refuser si impossible
  let orgId = session.user.organizationId;
  if (!orgId) {
    if (!session.user.email) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    try {
      orgId = await ensureUserOrganization(session.user.id, session.user.email);
    } catch {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const belongs = await projectBelongsToOrganization(id, orgId);
  if (!belongs) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const status = await getProjectStatus(id);
  if (!status) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
