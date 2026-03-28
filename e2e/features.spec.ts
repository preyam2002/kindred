import { test, expect } from "@playwright/test";

test.describe("Feature Pages - Unauthenticated Rendering", () => {
  // These tests verify that feature pages render their shell without crashing,
  // even when the user is not authenticated (they'll show loading or redirect)

  test.describe("Gamification Features", () => {
    test("taste challenge page loads", async ({ page }) => {
      const res = await page.goto("/taste-challenge");
      expect(res?.status()).toBeLessThan(500);
    });

    test("challenges page loads", async ({ page }) => {
      const res = await page.goto("/challenges");
      expect(res?.status()).toBeLessThan(500);
    });

    test("leaderboards page loads", async ({ page }) => {
      const res = await page.goto("/leaderboards");
      expect(res?.status()).toBeLessThan(500);
    });

    test("year wrapped page loads", async ({ page }) => {
      const res = await page.goto("/year-wrapped");
      expect(res?.status()).toBeLessThan(500);
    });
  });

  test.describe("Discovery Features", () => {
    test("blind match page loads", async ({ page }) => {
      const res = await page.goto("/blind-match");
      expect(res?.status()).toBeLessThan(500);
    });

    test("roulette page loads", async ({ page }) => {
      const res = await page.goto("/roulette");
      expect(res?.status()).toBeLessThan(500);
    });

    test("taste twins page loads", async ({ page }) => {
      const res = await page.goto("/taste-twins");
      expect(res?.status()).toBeLessThan(500);
    });

    test("taste match page loads", async ({ page }) => {
      const res = await page.goto("/taste-match");
      expect(res?.status()).toBeLessThan(500);
    });

    test("mood discovery page loads", async ({ page }) => {
      const res = await page.goto("/mood-discovery");
      expect(res?.status()).toBeLessThan(500);
    });

    test("recommendations page loads", async ({ page }) => {
      const res = await page.goto("/recommendations");
      expect(res?.status()).toBeLessThan(500);
    });
  });

  test.describe("Social Features", () => {
    test("social feed page loads", async ({ page }) => {
      const res = await page.goto("/social-feed");
      expect(res?.status()).toBeLessThan(500);
    });

    test("group consensus page loads", async ({ page }) => {
      const res = await page.goto("/group-consensus");
      expect(res?.status()).toBeLessThan(500);
    });

    test("watch together page loads", async ({ page }) => {
      const res = await page.goto("/watch-together");
      expect(res?.status()).toBeLessThan(500);
    });

    test("chat page loads", async ({ page }) => {
      const res = await page.goto("/chat");
      expect(res?.status()).toBeLessThan(500);
    });

    test("friends page loads", async ({ page }) => {
      const res = await page.goto("/friends");
      expect(res?.status()).toBeLessThan(500);
    });
  });

  test.describe("Creative Features", () => {
    test("taste art page loads", async ({ page }) => {
      const res = await page.goto("/taste-art");
      expect(res?.status()).toBeLessThan(500);
    });

    test("share cards page loads", async ({ page }) => {
      const res = await page.goto("/share-cards");
      expect(res?.status()).toBeLessThan(500);
    });

    test("taste DNA page loads", async ({ page }) => {
      const res = await page.goto("/taste-dna");
      expect(res?.status()).toBeLessThan(500);
    });
  });

  test.describe("Core Pages", () => {
    test("dashboard page loads", async ({ page }) => {
      const res = await page.goto("/dashboard");
      expect(res?.status()).toBeLessThan(500);
    });

    test("library page loads", async ({ page }) => {
      const res = await page.goto("/library");
      expect(res?.status()).toBeLessThan(500);
    });

    test("discover page loads", async ({ page }) => {
      const res = await page.goto("/discover");
      expect(res?.status()).toBeLessThan(500);
    });

    test("matches page loads", async ({ page }) => {
      const res = await page.goto("/matches");
      expect(res?.status()).toBeLessThan(500);
    });

    test("collections page loads", async ({ page }) => {
      const res = await page.goto("/collections");
      expect(res?.status()).toBeLessThan(500);
    });

    test("queue page loads", async ({ page }) => {
      const res = await page.goto("/queue");
      expect(res?.status()).toBeLessThan(500);
    });

    test("notifications page loads", async ({ page }) => {
      const res = await page.goto("/notifications");
      expect(res?.status()).toBeLessThan(500);
    });

    test("settings page loads", async ({ page }) => {
      const res = await page.goto("/settings");
      expect(res?.status()).toBeLessThan(500);
    });

    test("onboarding page loads", async ({ page }) => {
      const res = await page.goto("/onboarding");
      expect(res?.status()).toBeLessThan(500);
    });

    test("activity page loads", async ({ page }) => {
      const res = await page.goto("/activity");
      expect(res?.status()).toBeLessThan(500);
    });
  });
});
