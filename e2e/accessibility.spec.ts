import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("landing page has h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("login page has h1 with correct text", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
  });

  test("signup page has h1 with correct text", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { name: "Create account", level: 1 })).toBeVisible();
  });

  test("html has lang='en'", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("all images have alt text on landing page", async ({ page }) => {
    await page.goto("/");
    const imgs = page.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute("alt");
      expect(alt, `Image ${i} missing alt`).toBeTruthy();
    }
  });

  test("buttons have accessible text on login page", async ({ page }) => {
    await page.goto("/auth/login");
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      const ariaLabel = await buttons.nth(i).getAttribute("aria-label");
      expect(text || ariaLabel, `Button ${i} missing label`).toBeTruthy();
    }
  });

  test("interactive elements exist for keyboard navigation", async ({ page }) => {
    await page.goto("/");
    const focusable = page.locator("a, button, input, [tabindex]");
    expect(await focusable.count()).toBeGreaterThan(0);
  });

  test("viewport meta tag exists", async ({ page }) => {
    await page.goto("/");
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("width=device-width");
  });

  test("charset meta tag exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("meta[charset]")).toHaveCount(1);
  });
});
