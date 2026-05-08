import { expect, test } from "@playwright/test";

test.describe("Page Nouveau Projet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects/new");
  });

  test("heading principal contient Nouveau projet ORCHESTRA_IA", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Nouveau projet ORCHESTRA_IA");
  });

  test("label Intake visible", async ({ page }) => {
    await expect(page.getByText("Intake", { exact: true })).toBeVisible();
  });

  test("champ titre présent, requis et borné", async ({ page }) => {
    const input = page.locator('input[name="title"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("required");
    await expect(input).toHaveAttribute("minlength", "3");
    await expect(input).toHaveAttribute("maxlength", "200");
  });

  test("champ brief présent, requis et borné", async ({ page }) => {
    const textarea = page.locator('textarea[name="brief"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute("required");
    await expect(textarea).toHaveAttribute("minlength", "20");
    await expect(textarea).toHaveAttribute("maxlength", "10000");
  });

  test("bouton Créer ProjectSpec présent", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Cr.er ProjectSpec/i })).toBeVisible();
  });

  test("zone de clarification HITL affichée", async ({ page }) => {
    await expect(page.getByText(/clarification/i)).toBeVisible();
  });

  test("le formulaire ne se soumet pas avec champs vides (validation HTML5)", async ({ page }) => {
    await page.getByRole("button", { name: /Cr.er ProjectSpec/i }).click();
    // HTML5 validation empêche la soumission — on reste sur la même page
    await expect(page).toHaveURL(/\/projects\/new/);
  });
});
