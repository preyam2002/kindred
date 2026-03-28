import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("landing page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("login page has proper heading", async ({ page }) => {
    await page.goto("/auth/login");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Welcome back");
  });

  test("signup page has proper heading", async ({ page }) => {
    await page.goto("/auth/signup");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Create account");
  });

  test("page has lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("interactive elements exist for keyboard navigation", async ({ page }) => {
    await page.goto("/");
    // Verify there are focusable elements on the page
    const focusableElements = page.locator("a, button, input, [tabindex]");
    const count = await focusableElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test("buttons have accessible text", async ({ page }) => {
    await page.goto("/auth/login");
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      const ariaLabel = await buttons.nth(i).getAttribute("aria-label");
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test("color contrast - text is visible", async ({ page }) => {
    await page.goto("/");
    // Verify key text elements are visible (basic check)
    await expect(page.locator("text=Connect through")).toBeVisible();
    await expect(page.locator("text=what you love")).toBeVisible();
  });
});
