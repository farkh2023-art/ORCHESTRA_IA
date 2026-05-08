import { db } from "@/lib/db";

export async function projectBelongsToOrganization(
  projectId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });
    return project?.organizationId === organizationId;
  } catch {
    return false;
  }
}
