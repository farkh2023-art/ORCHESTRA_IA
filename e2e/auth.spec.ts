import { expect, test } from "@playwright/test";

test.describe("Page Sign-in", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
  });

  test("page sign-in accessible sans authentification", async ({ page }) => {
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("heading Connexion à SAVOIR_IA visible", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Connexion à SAVOIR_IA");
  });

  test("bouton GitHub présent", async ({ page }) => {
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
  });

  test("bouton Google présent", async ({ page }) => {
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("pas d'erreur 500 affichée", async ({ page }) => {
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});

test.describe("Redirection middleware — routes protégées", () => {
  const FAKE_ID = "00000000-0000-0000-0000-000000000000";

  test("GET /registry redirige vers /sign-in", async ({ page }) => {
    await page.goto("/registry");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("GET /projects/new redirige vers /sign-in", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test(`GET /projects/${FAKE_ID} redirige vers /sign-in`, async ({ page }) => {
    await page.goto(`/projects/${FAKE_ID}`);
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test(`GET /projects/${FAKE_ID}/report redirige vers /sign-in`, async ({ page }) => {
    await page.goto(`/projects/${FAKE_ID}/report`);
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
