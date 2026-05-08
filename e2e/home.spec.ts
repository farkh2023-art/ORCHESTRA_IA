import { expect, test } from "@playwright/test";

test.describe("Page d'accueil", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("titre de la page contient ORCHESTRA_IA", async ({ page }) => {
    await expect(page).toHaveTitle(/ORCHESTRA_IA/);
  });

  test("heading principal contient Orchestrez", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Orchestrez");
  });

  test("lien Créer un projet pointe vers /projects/new", async ({ page }) => {
    const lien = page.getByRole("link", { name: /Cr.er un projet/i }).first();
    await expect(lien).toBeVisible();
    await expect(lien).toHaveAttribute("href", "/projects/new");
  });

  test("lien Voir le registry pointe vers /registry", async ({ page }) => {
    const lien = page.getByRole("link", { name: /Voir le registry/i });
    await expect(lien).toBeVisible();
    await expect(lien).toHaveAttribute("href", "/registry");
  });

  test("les 6 étapes du pipeline sont affichées", async ({ page }) => {
    for (const etape of ["Brief", "Clarification", "Agents", "DAG", "Validation", "Rapport"]) {
      await expect(page.getByText(etape, { exact: true })).toBeVisible();
    }
  });

  test("label ORCHESTRA_IA visible en haut", async ({ page }) => {
    await expect(page.getByText("ORCHESTRA_IA", { exact: true })).toBeVisible();
  });
});
