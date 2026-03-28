import { test, expect } from "@playwright/test";

test.describe("SEO & Meta Tags", () => {
  test("landing page has proper meta title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("kindred");
  });

  test("landing page has meta description", async ({ page }) => {
    await page.goto("/");
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);
  });

  test("page has viewport meta tag", async ({ page }) => {
    await page.goto("/");
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewport).toContain("width=device-width");
  });

  test("page has charset meta tag", async ({ page }) => {
    await page.goto("/");
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveCount(1);
  });

  test("links have proper href attributes", async ({ page }) => {
    await page.goto("/");
    // Wait for hydration
    await page.waitForLoadState("networkidle");
    const links = page.locator("a[href]");
    const count = await links.count();
    // Page has links (may be 0 during SSR loading state)
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 10); i++) {
        const href = await links.nth(i).getAttribute("href");
        expect(href).toBeTruthy();
        expect(href).not.toBe("");
      }
    }
  });
});
