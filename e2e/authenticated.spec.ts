import { expect, test } from "@playwright/test";
import { injectMockSession } from "./fixtures/mock-local-auth";

// Parcours utilisateur authentifié via session mock locale.
// Prérequis : pnpm db:seed:mock (crée org + user + session en base).
// Exécution : pnpm test:e2e:auth

test.describe("Parcours utilisateur authentifié (mock local)", () => {
  test.beforeEach(async ({ context }) => {
    await injectMockSession(context);
  });

  test("registry accessible — liste des agents visible", async ({ page }) => {
    await page.goto("/registry");
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("projects/new accessible — formulaire de création visible", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("account affiche l'email du mock user", async ({ page }) => {
    await page.goto("/account");
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page.getByText("dev@mock-local.dev")).toBeVisible();
  });

  test("projects/new — champ titre présent et soumettable", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page).not.toHaveURL(/\/sign-in/);
    const titleInput = page.getByRole("textbox").first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Projet test mock local");
    await expect(titleInput).toHaveValue("Projet test mock local");
  });
});
