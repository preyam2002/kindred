import { test, expect } from "@playwright/test";

test.describe("Navigation & Routing", () => {
  test("unauthenticated user sees landing page at /", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Connect through")).toBeVisible();
  });

  test("unauthenticated routes redirect or show auth prompt", async ({
    page,
  }) => {
    // These pages require auth - they should either redirect to login
    // or show loading/auth required message
    const protectedRoutes = [
      "/dashboard",
      "/library",
      "/discover",
      "/matches",
      "/friends",
      "/collections",
      "/recommendations",
      "/settings",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Page should load without crashing (200 status)
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
    }
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("all public feature pages load without errors", async ({ page }) => {
    const publicRoutes = [
      "/auth/login",
      "/auth/signup",
      "/waitlist",
    ];

    for (const route of publicRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    }
  });

  test("all feature pages load without 500 errors", async ({ page }) => {
    const featureRoutes = [
      "/taste-challenge",
      "/blind-match",
      "/roulette",
      "/taste-twins",
      "/year-wrapped",
      "/social-feed",
      "/leaderboards",
      "/challenges",
      "/mood-discovery",
      "/group-consensus",
      "/taste-art",
      "/share-cards",
      "/chat",
      "/taste-dna",
      "/taste-match",
      "/queue",
      "/watch-together",
      "/notifications",
      "/onboarding",
    ];

    for (const route of featureRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
    }
  });
});
