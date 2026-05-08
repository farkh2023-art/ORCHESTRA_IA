import { db } from "@/lib/db";

export function getEmailDomain(email: string): string {
  const at = email.indexOf("@");
  return at === -1 ? email : email.slice(at + 1);
}

export function slugify(domain: string): string {
  return domain.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

export async function findOrCreateOrganization(email: string) {
  const domain = getEmailDomain(email);
  const slug = slugify(domain);

  const existing = await db.organization.findFirst({ where: { slug } });
  if (existing) return existing;

  return db.organization.create({
    data: { name: domain, slug },
  });
}
