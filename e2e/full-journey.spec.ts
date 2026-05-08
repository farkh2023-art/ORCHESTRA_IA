import { expect, test } from "@playwright/test";

// Parcours utilisateur non authentifié — de la landing jusqu'à la page sign-in

test.describe("Parcours complet utilisateur non authentifié", () => {
  test("landing → CTA Créer un projet → redirige vers sign-in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Cr.er un projet/i }).first().click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("landing → CTA Voir le registry → redirige vers sign-in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Voir le registry/i }).first().click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-in → heading et providers OAuth présents", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Connexion à SAVOIR_IA");
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("sign-in → message de bienvenue présent", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/Connectez-vous pour acc.der/i)).toBeVisible();
  });

  test("accès direct aux routes protégées → toujours sign-in", async ({ page }) => {
    for (const path of ["/registry", "/projects/new", "/account"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in/);
    }
  });

  test("lien nav SAVOIR_IA visible sur la page sign-in (shell présent)", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("link", { name: "SAVOIR_IA" })).toBeVisible();
  });

  test("home → pas de 500, structure pipeline présente", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
