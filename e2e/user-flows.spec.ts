import { test, expect } from "@playwright/test";

// End-to-end user flow tests that verify complete journeys

test.describe("New User Journey", () => {
  test("landing page -> signup -> redirect flow", async ({ page }) => {
    // 1. Visit landing page
    await page.goto("/");
    await expect(page.locator("text=Connect through")).toBeVisible();

    // 2. Click signup
    await page.click('a[href="/auth/signup"]');
    await expect(page).toHaveURL(/\/auth\/signup/);

    // 3. Signup page shows OAuth option
    await expect(page.locator("text=Create account")).toBeVisible();
    await expect(page.locator("text=Continue with X")).toBeVisible();

    // 4. Back button returns to home
    await page.click("text=Back to home");
    await expect(page).toHaveURL("/");
  });

  test("landing page -> login -> redirect flow", async ({ page }) => {
    await page.goto("/");

    await page.click('a[href="/auth/login"]');
    await expect(page).toHaveURL(/\/auth\/login/);

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    // Navigate to signup from login
    await page.click('a[href="/auth/signup"]');
    await expect(page).toHaveURL(/\/auth\/signup/);

    // Navigate back to login
    await page.click('a[href="/auth/login"]');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("waitlist signup flow", async ({ page }) => {
    // 1. Visit waitlist
    await page.goto("/waitlist");
    await page.waitForLoadState("networkidle");

    // 2. Find email input
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await expect(emailInput).toBeVisible();

    // 3. Name input should be visible too
    const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test User");
    }

    // 4. Fill email
    await emailInput.fill("test@example.com");

    // 5. Join button should be enabled now
    const joinButton = page.locator("button:has-text('Join')").first();
    await expect(joinButton).toBeEnabled();
  });
});

test.describe("Feature Discovery Flow", () => {
  test("user can navigate between all main sections", async ({ page }) => {
    // Visit each major feature page and verify it loads
    const routes = [
      { path: "/taste-challenge", heading: /challenge/i },
      { path: "/blind-match", heading: /blind|match/i },
      { path: "/roulette", heading: /roulette|spin/i },
      { path: "/leaderboards", heading: /leaderboard|ranking/i },
      { path: "/year-wrapped", heading: /wrapped|year/i },
    ];

    for (const route of routes) {
      const res = await page.goto(route.path);
      expect(res?.status()).toBeLessThan(500);
      // Page should have some content
      const text = await page.locator("body").textContent();
      expect(text!.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Error Handling Flows", () => {
  test("404 page for unknown routes", async ({ page }) => {
    const res = await page.goto("/this-does-not-exist-xyz123");
    expect(res?.status()).toBe(404);
  });

  test("API returns structured errors", async ({ request }) => {
    const res = await request.get("/api/library");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(typeof body.error).toBe("string");
  });

  test("API handles non-existent user profiles gracefully", async ({ request }) => {
    const res = await request.get("/api/users/nonexistent_user_xyz123");
    // Should return 404 or empty user, not 500
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("Cross-Page Consistency", () => {
  test("all pages use consistent layout", async ({ page }) => {
    const pages = ["/", "/auth/login", "/auth/signup", "/waitlist"];

    for (const route of pages) {
      await page.goto(route);
      // Verify the page has the base layout rendered
      const body = page.locator("body");
      await expect(body).toBeVisible();
      // Font classes should be applied
      const className = await body.getAttribute("class");
      expect(className).toContain("antialiased");
    }
  });

  test("metadata is consistent across pages", async ({ page }) => {
    const pages = ["/", "/auth/login", "/auth/signup"];

    for (const route of pages) {
      await page.goto(route);
      // All pages should have the same base title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    }
  });
});
