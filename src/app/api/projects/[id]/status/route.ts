import { NextResponse } from "next/server";
import { getProjectStatus, isSafeProjectId } from "@/lib/projects/status";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
