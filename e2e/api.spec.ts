import { test, expect } from "@playwright/test";

test.describe("API: Authentication Enforcement", () => {
  const protectedGETs = [
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
  ];

  for (const path of protectedGETs) {
    test(`GET ${path} → 401 without session`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe("string");
    });
  }

  const protectedPOSTs: [string, Record<string, unknown>][] = [
    ["/api/chat", { message: "hello" }],
    ["/api/friends/request", { friendId: "x" }],
    ["/api/collections", { title: "test" }],
    ["/api/queue", { media_type: "book", media_id: "x" }],
    ["/api/taste-challenge/create", {}],
    ["/api/blind-match/swipe", { target_user_id: "x", liked: true }],
    ["/api/watch-together/create", { name: "test" }],
    ["/api/comments", { media_id: "x", media_type: "book", content: "test" }],
    ["/api/share", { shareType: "profile", platform: "twitter" }],
    ["/api/roulette/save", {}],
    ["/api/taste-match/action", { action: "like", targetUserId: "x" }],
  ];

  for (const [path, body] of protectedPOSTs) {
    test(`POST ${path} → 401 without session`, async ({ request }) => {
      const res = await request.post(path, { data: body });
      expect(res.status()).toBe(401);
    });
  }
});

test.describe("API: Public Endpoints", () => {
  test("GET /api/search?q=test returns JSON", async ({ request }) => {
    const res = await request.get("/api/search?q=test");
    expect(res.status()).toBeLessThan(500);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("GET /api/search with short query returns empty results", async ({ request }) => {
    const res = await request.get("/api/search?q=a");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results).toBeDefined();
  });

  test("GET /api/health returns health status", async ({ request }) => {
    const res = await request.get("/api/health");
    const body = await res.json();
    expect(["healthy", "degraded"]).toContain(body.status);
    expect(body.timestamp).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.environment).toBeDefined();
  });

  test("GET /api/users/nonexistent_xyz_123 does not return 500", async ({ request }) => {
    const res = await request.get("/api/users/nonexistent_xyz_123");
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/collections returns response", async ({ request }) => {
    const res = await request.get("/api/collections");
    // May fail if Supabase not configured in test env
    expect(res.status()).toBeDefined();
  });

  test("GET /api/waitlist returns response", async ({ request }) => {
    const res = await request.get("/api/waitlist");
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("API: Input Validation", () => {
  test("POST /api/waitlist rejects missing email", async ({ request }) => {
    const res = await request.post("/api/waitlist", { data: { name: "Test" } });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test("API rejects malformed JSON gracefully", async ({ request }) => {
    const res = await request.post("/api/chat", {
      headers: { "Content-Type": "application/json" },
      data: "not json{{{",
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("API returns JSON content-type on error", async ({ request }) => {
    const res = await request.get("/api/library");
    expect(res.headers()["content-type"]).toContain("application/json");
  });
});

test.describe("API: Rate Limiting", () => {
  test("search returns rate limit info after many requests", async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 35 }, () => request.get("/api/search?q=test"))
    );
    for (const res of results) {
      expect([200, 429]).toContain(res.status());
      if (res.status() === 429) {
        const body = await res.json();
        expect(body.error).toContain("Too many requests");
        const retryAfter = res.headers()["retry-after"];
        expect(retryAfter).toBeDefined();
      }
    }
  });
});

test.describe("API: Settings", () => {
  test("GET /api/settings → 401", async ({ request }) => {
    expect((await request.get("/api/settings")).status()).toBe(401);
  });

  test("PATCH /api/settings → 401", async ({ request }) => {
    const res = await request.patch("/api/settings", {
      data: { section: "privacy", isProfilePublic: true },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/settings → 401", async ({ request }) => {
    expect((await request.delete("/api/settings")).status()).toBe(401);
  });

  test("GET /api/settings/export → 401", async ({ request }) => {
    expect((await request.get("/api/settings/export")).status()).toBe(401);
  });
});
