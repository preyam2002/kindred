import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Connect through")).toBeVisible();
    await expect(page.locator("text=what you love")).toBeVisible();
    await expect(
      page.locator("text=Aggregate your tracked activity")
    ).toBeVisible();
  });

  test("shows navigation with login and signup links", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.locator('a[href="/auth/login"]');
    const signupLink = page.locator('a[href="/auth/signup"]');
    await expect(loginLink).toBeVisible();
    await expect(signupLink).toBeVisible();
  });

  test("displays all four platform cards", async ({ page }) => {
    await page.goto("/");
    // Platform names appear in card divs with font-mono class
    for (const platform of [
      "Goodreads",
      "MyAnimeList",
      "Letterboxd",
      "Spotify",
    ]) {
      await expect(
        page.locator(".font-mono", { hasText: platform })
      ).toBeVisible();
    }
  });

  test("displays value propositions", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Endless Discovery")).toBeVisible();
    await expect(page.locator("text=AI-Powered Matches")).toBeVisible();
    await expect(page.locator("text=Import Everything")).toBeVisible();
  });

  test("login link navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/auth/login"]');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("signup link navigates to signup page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/auth/signup"]');
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("waitlist link navigates to waitlist page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Join Waitlist");
    await expect(page).toHaveURL(/\/waitlist/);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/kindred/);
  });
});
