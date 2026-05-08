/**
 * Seed local-mock — dev only.
 * Creates a deterministic org + user + session so Playwright can bypass OAuth.
 * Token: "mock-dev-session-token-savoir-ia-local-only"
 * Run: pnpm db:seed:mock
 */

// Node.js 20.12+ built-in — loads .env.local without additional dependencies.
// Safe to call before any other import; no-ops if the file is missing.
try {
  (process as unknown as { loadEnvFile: (p: string) => void }).loadEnvFile(".env.local");
} catch { /* vars already injected via shell or file absent */ }

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MOCK_ORG_SLUG = "mock-local-dev";
const MOCK_USER_EMAIL = "dev@mock-local.dev";
const MOCK_SESSION_TOKEN = "mock-dev-session-token-savoir-ia-local-only";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function main() {
  console.log("Seed local-mock — démarrage...");

  // 1. Organisation
  const org = await prisma.organization.upsert({
    where: { slug: MOCK_ORG_SLUG },
    update: { name: "Mock Local Dev" },
    create: { name: "Mock Local Dev", slug: MOCK_ORG_SLUG },
  });
  console.log(`  ✓ Organization: ${org.slug} (${org.id})`);

  // 2. Utilisateur
  const user = await prisma.user.upsert({
    where: { email: MOCK_USER_EMAIL },
    update: { organizationId: org.id, role: "ADMIN", name: "Dev Local" },
    create: {
      email: MOCK_USER_EMAIL,
      name: "Dev Local",
      role: "ADMIN",
      organizationId: org.id,
    },
  });
  console.log(`  ✓ User: ${user.email} (${user.id}) role=${user.role}`);

  // 3. Session — delete + create pour garantir le token et l'expiry
  await prisma.session.deleteMany({ where: { sessionToken: MOCK_SESSION_TOKEN } });
  const session = await prisma.session.create({
    data: {
      sessionToken: MOCK_SESSION_TOKEN,
      userId: user.id,
      expires: new Date(Date.now() + ONE_YEAR_MS),
    },
  });
  console.log(`  ✓ Session: token=${MOCK_SESSION_TOKEN} expires=${session.expires.toISOString()}`);

  console.log("\nSeed local-mock terminé.");
  console.log("Cookie à injecter : authjs.session-token=" + MOCK_SESSION_TOKEN);
}

main()
  .catch((e) => {
    console.error("Erreur seed-local-mock :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
