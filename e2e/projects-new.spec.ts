import { expect, test } from "@playwright/test";

// /projects/new est protégé par le middleware Auth.js — redirige vers /sign-in si non authentifié
test.describe("Page Nouveau Projet — non authentifié", () => {
  test("redirige vers /sign-in", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("pas d'erreur 500 affichée sur /sign-in", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});
