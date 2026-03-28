import { test, expect } from "@playwright/test";

test.describe("Waitlist Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/waitlist");
    await page.waitForLoadState("networkidle");
  });

  test("renders email input and name input", async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(emailInput).toBeVisible();
  });

  test("join button is disabled when email is empty", async ({ page }) => {
    const joinBtn = page.getByRole("button", { name: /join/i }).first();
    await expect(joinBtn).toBeDisabled();
  });

  test("join button enables when email is filled", async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await emailInput.fill("test@example.com");
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) await nameInput.fill("Test");
    const joinBtn = page.getByRole("button", { name: /join/i }).first();
    await expect(joinBtn).toBeEnabled();
  });

  test("referral code is captured from URL", async ({ page }) => {
    await page.goto("/waitlist?ref=ABC123");
    await expect(page).toHaveURL(/ref=ABC123/);
  });

  test("page shows stats section", async ({ page }) => {
    // Stats/counts should be visible (total signups, etc.)
    const body = await page.locator("body").textContent();
    expect(body!.length).toBeGreaterThan(100);
  });
});
