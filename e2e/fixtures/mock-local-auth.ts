import type { BrowserContext } from "@playwright/test";

const MOCK_SESSION_TOKEN = "mock-dev-session-token-savoir-ia-local-only";

/**
 * Injecte le cookie de session mock dans le contexte Playwright.
 * Nécessite d'avoir exécuté `pnpm db:seed:mock` au préalable.
 */
export async function injectMockSession(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: MOCK_SESSION_TOKEN,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
