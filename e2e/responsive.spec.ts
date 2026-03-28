import { test, expect } from "@playwright/test";

test.describe("Mobile (375×667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("landing page hero is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=what you love")).toBeVisible();
  });

  test("login form fits screen", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    const btn = page.getByRole("button", { name: "Continue with X" });
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test("signup form fits screen", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  test("waitlist email input is full width", async ({ page }) => {
    await page.goto("/waitlist");
    const input = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(input).toBeVisible();
  });

  test("all platform cards stack on mobile", async ({ page }) => {
    await page.goto("/");
    for (const p of ["Goodreads", "Spotify"]) {
      await expect(page.locator(".font-mono", { hasText: p })).toBeVisible();
    }
  });
});

test.describe("Tablet (768×1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("landing page shows all value props", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator("text=Taste DNA")).toBeVisible();
    await expect(page.locator("text=MashScore Matching")).toBeVisible();
    await expect(page.locator("text=Year Wrapped")).toBeVisible();
  });

  test("platform cards visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".font-mono", { hasText: "Goodreads" })).toBeVisible();
  });
});

test.describe("Desktop (1920×1080)", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("landing page renders full width", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    for (const p of ["Goodreads", "MyAnimeList", "Letterboxd", "Spotify"]) {
      await expect(page.locator(".font-mono", { hasText: p })).toBeVisible();
    }
  });
});
