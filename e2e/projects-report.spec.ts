import { expect, test } from "@playwright/test";

// Rapport d'un projet inexistant : loadReport renvoie null → "Rapport indisponible."
const FAKE_ID = "00000000-0000-0000-0000-000000000000";

test.describe("Page Rapport Projet — ID inexistant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/projects/${FAKE_ID}/report`);
  });

  test("affiche Rapport indisponible", async ({ page }) => {
    await expect(page.getByText("Rapport indisponible.")).toBeVisible();
  });

  test("pas d'erreur 500 affichée", async ({ page }) => {
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});
