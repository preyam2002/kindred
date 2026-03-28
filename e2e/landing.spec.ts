import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section with headline and subtext", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("text=what you love")).toBeVisible();
    await expect(page.locator("text=Aggregate your tracked activity")).toBeVisible();
  });

  test("renders nav bar with logo and auth links", async ({ page }) => {
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("text=kindred").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("shows all four platform cards (Goodreads, MAL, Letterboxd, Spotify)", async ({ page }) => {
    for (const platform of ["Goodreads", "MyAnimeList", "Letterboxd", "Spotify"]) {
      await expect(page.locator(".font-mono", { hasText: platform })).toBeVisible();
    }
  });

  test("shows three value propositions", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator("text=Taste DNA")).toBeVisible();
    await expect(page.locator("text=MashScore Matching")).toBeVisible();
    await expect(page.locator("text=Year Wrapped")).toBeVisible();
  });

  test("login link navigates to /auth/login", async ({ page }) => {
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("signup link navigates to /auth/signup", async ({ page }) => {
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  test("waitlist button navigates to /waitlist", async ({ page }) => {
    await page.getByRole("link", { name: "Join Waitlist" }).click();
    await expect(page).toHaveURL(/\/waitlist/);
  });

  test("has correct meta title containing 'kindred'", async ({ page }) => {
    await expect(page).toHaveTitle(/kindred/);
  });

  test("has meta description", async ({ page }) => {
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(20);
  });

  test("has lang='en' on html element", async ({ page }) => {
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("page does not throw JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
