import { test, expect, devices } from "@playwright/test";

test.describe("Responsive Design", () => {
  test.describe("Mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("landing page renders correctly on mobile", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("text=Connect through")).toBeVisible();
      await expect(page.locator("text=what you love")).toBeVisible();
    });

    test("login page renders correctly on mobile", async ({ page }) => {
      await page.goto("/auth/login");
      await expect(page.locator("text=Welcome back")).toBeVisible();
      await expect(page.locator("text=Continue with X")).toBeVisible();
    });

    test("signup page renders correctly on mobile", async ({ page }) => {
      await page.goto("/auth/signup");
      await expect(page.locator("text=Create account")).toBeVisible();
      await expect(page.locator("text=Continue with X")).toBeVisible();
    });

    test("waitlist page is usable on mobile", async ({ page }) => {
      await page.goto("/waitlist");
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
      await expect(emailInput).toBeVisible();
    });
  });

  test.describe("Tablet viewport", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("landing page renders correctly on tablet", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("text=Connect through")).toBeVisible();
      // Platform cards should be visible (text is uppercase via CSS)
      await expect(
        page.locator(".font-mono", { hasText: "Goodreads" })
      ).toBeVisible();
    });
  });

  test.describe("Wide desktop viewport", () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test("landing page uses full width appropriately", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("text=Connect through")).toBeVisible();
      // All value props should be visible in a row
      await expect(page.locator("text=Endless Discovery")).toBeVisible();
      await expect(page.locator("text=AI-Powered Matches")).toBeVisible();
      await expect(page.locator("text=Import Everything")).toBeVisible();
    });
  });
});
