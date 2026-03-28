import { test, expect } from "@playwright/test";

test.describe("Route Availability — every page loads without 500", () => {
  const routes = [
    // public
    "/",
    "/auth/login",
    "/auth/signup",
    "/waitlist",
    "/waitlist/leaderboard",
    // feature pages (unauthed loads shell)
    "/dashboard",
    "/library",
    "/discover",
    "/matches",
    "/friends",
    "/collections",
    "/queue",
    "/recommendations",
    "/settings",
    "/onboarding",
    "/notifications",
    // social & gamification
    "/taste-challenge",
    "/blind-match",
    "/roulette",
    "/taste-twins",
    "/taste-match",
    "/year-wrapped",
    "/social-feed",
    "/leaderboards",
    "/challenges",
    "/mood-discovery",
    "/group-consensus",
    "/watch-together",
    "/chat",
    "/taste-art",
    "/share-cards",
    "/taste-dna",
    "/activity",
    "/analytics",
  ];

  for (const route of routes) {
    test(`GET ${route} → 2xx/3xx`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res!.status()).toBeLessThan(500);
    });
  }
});

test.describe("404 handling", () => {
  test("unknown route returns 404", async ({ page }) => {
    const res = await page.goto("/some-nonexistent-route-xyz");
    expect(res!.status()).toBe(404);
  });
});
