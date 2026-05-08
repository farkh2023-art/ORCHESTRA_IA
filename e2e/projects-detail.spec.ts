import { expect, test } from "@playwright/test";

// /projects/:id est protégé par le middleware Auth.js — redirige vers /sign-in si non authentifié
const FAKE_ID = "00000000-0000-0000-0000-000000000000";

test.describe("Page Détail Projet — non authentifié", () => {
  test("redirige vers /sign-in", async ({ page }) => {
    await page.goto(`/projects/${FAKE_ID}`);
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("pas d'erreur 500 affichée sur /sign-in", async ({ page }) => {
    await page.goto(`/projects/${FAKE_ID}`);
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});
