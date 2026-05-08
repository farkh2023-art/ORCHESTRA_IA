import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectStatus, isSafeProjectId } from "@/lib/projects/status";

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

  const status = await getProjectStatus(id);
  if (!status) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
