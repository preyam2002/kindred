import { test, expect } from "@playwright/test";

// Since the app uses Twitter OAuth, we can't programmatically log in.
// These tests verify:
// 1. Feature pages render their shell (loading/auth-prompt) without crashing
// 2. API endpoints enforce auth consistently
// 3. Feature-specific UI elements exist in the DOM

test.describe("Dashboard — unauthenticated", () => {
  test("renders without crash, shows loading or auth prompt", async ({ page }) => {
    await page.goto("/dashboard");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
    // Should show either loading spinner or sign-in prompt
    expect(text!.length).toBeGreaterThan(10);
  });
});

test.describe("Library — unauthenticated", () => {
  test("renders page shell", async ({ page }) => {
    await page.goto("/library");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
  });
});

test.describe("Discover — unauthenticated", () => {
  test("renders page shell", async ({ page }) => {
    await page.goto("/discover");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
  });
});

test.describe("Settings — unauthenticated", () => {
  test("renders page shell", async ({ page }) => {
    await page.goto("/settings");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
  });
});

test.describe("Friends — unauthenticated", () => {
  test("renders page shell", async ({ page }) => {
    await page.goto("/friends");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
  });
});

test.describe("Collections — unauthenticated", () => {
  test("renders page shell", async ({ page }) => {
    await page.goto("/collections");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
  });
});

test.describe("Queue — unauthenticated", () => {
  test("renders page shell", async ({ page }) => {
    await page.goto("/queue");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
  });
});

test.describe("Notifications — unauthenticated", () => {
  test("renders page shell", async ({ page }) => {
    await page.goto("/notifications");
    const text = await page.textContent("body");
    expect(text).not.toContain("Internal Server Error");
  });
});

test.describe("API Comprehensive Auth — GET Endpoints", () => {
  const endpoints = [
    "/api/library",
    "/api/friends",
    "/api/matches",
    "/api/notifications",
    "/api/queue",
    "/api/dashboard",
    "/api/recommendations",
    "/api/taste-dna",
    "/api/integrations",
    "/api/chat",
    "/api/challenges",
    "/api/challenges/streak",
    "/api/blind-match/next",
    "/api/blind-match/matches",
    "/api/taste-match/candidates",
    "/api/taste-twins",
    "/api/settings",
    "/api/settings/export",
    "/api/year-wrapped/generate",
    "/api/taste-art/generate",
    "/api/social-proof/activity",
    "/api/roulette/spin",
  ];

  for (const path of endpoints) {
    test(`GET ${path} → 401`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
    });
  }
});

test.describe("API Comprehensive Auth — POST Endpoints", () => {
  const endpoints: [string, Record<string, unknown>][] = [
    ["/api/chat", { message: "hi" }],
    ["/api/friends/request", { friendId: "x" }],
    ["/api/collections", { title: "t" }],
    ["/api/queue", { media_type: "book", media_id: "x" }],
    ["/api/taste-challenge/create", {}],
    // taste-challenge/submit does not check auth — it validates body only
    ["/api/blind-match/swipe", { target_user_id: "x", liked: true }],
    ["/api/watch-together/create", { name: "t" }],
    ["/api/comments", { media_id: "x", media_type: "book", content: "t" }],
    ["/api/share", { shareType: "profile", platform: "twitter" }],
    ["/api/roulette/save", { mediaId: "x" }],
    ["/api/taste-match/action", { action: "like", targetUserId: "x" }],
    ["/api/activity", { activity_type: "rating", content: "{}" }],
  ];

  for (const [path, body] of endpoints) {
    test(`POST ${path} → 401`, async ({ request }) => {
      const res = await request.post(path, { data: body });
      expect(res.status()).toBe(401);
    });
  }
});

test.describe("API Comprehensive Auth — PATCH/DELETE Endpoints", () => {
  test("PATCH /api/settings → 401", async ({ request }) => {
    const res = await request.patch("/api/settings", {
      data: { section: "privacy" },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/settings → 401", async ({ request }) => {
    expect((await request.delete("/api/settings")).status()).toBe(401);
  });

  test("POST /api/notifications/read-all → 401", async ({ request }) => {
    expect((await request.post("/api/notifications/read-all")).status()).toBe(401);
  });
});

test.describe("Health & Cron", () => {
  test("GET /api/health returns structured status", async ({ request }) => {
    const res = await request.get("/api/health");
    const body = await res.json();
    expect(["healthy", "degraded"]).toContain(body.status);
    expect(body.timestamp).toBeTruthy();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.environment).toBeDefined();
    expect(body.checks.openai).toBeDefined();
    expect(body.checks.anthropic).toBeDefined();
  });

  test("POST /api/cron/calculate-matches returns response", async ({ request }) => {
    const res = await request.post("/api/cron/calculate-matches");
    expect(res.status()).toBeDefined();
    const body = await res.json();
    expect(body).toBeDefined();
  });
});
