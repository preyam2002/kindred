import { test, expect } from "@playwright/test";

test.describe("SEO & Meta", () => {
  test("title contains 'kindred'", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/kindred/);
  });

  test("meta description is present and meaningful", async ({ page }) => {
    await page.goto("/");
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(30);
  });

  test("viewport meta exists", async ({ page }) => {
    await page.goto("/");
    const vp = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(vp).toContain("width=device-width");
  });

  test("charset meta exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("meta[charset]")).toHaveCount(1);
  });

  test("links on landing page have non-empty href", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const links = page.locator("a[href]");
    const count = await links.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 10); i++) {
        const href = await links.nth(i).getAttribute("href");
        expect(href).not.toBe("");
      }
    }
  });
});
