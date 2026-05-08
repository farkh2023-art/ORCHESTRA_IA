import { expect, test } from "@playwright/test";

// UUID inexistant : la page doit afficher l'état "Projet introuvable"
// sans dépendre d'une base remplie (getProjectStatus renvoie null si DB vide ou indisponible)
const FAKE_ID = "00000000-0000-0000-0000-000000000000";

test.describe("Page Détail Projet — ID inexistant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/projects/${FAKE_ID}`);
  });

  test("affiche Projet introuvable", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Projet introuvable");
  });

  test("message d'explication présent", async ({ page }) => {
    await expect(page.getByText(/n.existe pas ou la base est indisponible/i)).toBeVisible();
  });

  test("lien Créer un projet pointe vers /projects/new", async ({ page }) => {
    const lien = page.getByRole("link", { name: /Cr.er un projet/i });
    await expect(lien).toBeVisible();
    await expect(lien).toHaveAttribute("href", "/projects/new");
  });

  test("pas d'erreur 500 affichée", async ({ page }) => {
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});
