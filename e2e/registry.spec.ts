import { expect, test } from "@playwright/test";

// /registry est protégé par le middleware Auth.js — redirige vers /sign-in si non authentifié
test.describe("Page Registry — non authentifié", () => {
  test("redirige vers /sign-in", async ({ page }) => {
    await page.goto("/registry");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("pas d'erreur 500 affichée sur /sign-in", async ({ page }) => {
    await page.goto("/registry");
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
    await expect(page.getByText("500")).not.toBeVisible();
  });
});
