import { expect, test } from "@playwright/test";

test.describe("Page Registry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/registry");
  });

  test("heading principal visible", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Catalogue des agents noyau");
  });

  test("label Agent registry visible", async ({ page }) => {
    await expect(page.getByText("Agent registry", { exact: false })).toBeVisible();
  });

  test("description de la page présente", async ({ page }) => {
    await expect(page.getByText(/AgentTemplate/).first()).toBeVisible();
  });

  test("lien Tous présent pour réinitialiser le filtre", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Tous" })).toBeVisible();
  });

  test("la page se rend sans Internal Server Error", async ({ page }) => {
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
    await expect(page.getByText("500")).not.toBeVisible();
  });

  test("état vide ou liste agents affiché de façon cohérente", async ({ page }) => {
    const emptyState = page.getByText(/Aucun AgentTemplate/);
    const agentNames = page.locator('[class*="font-display"]');
    await expect(emptyState.or(agentNames).first()).toBeVisible();
  });
});
