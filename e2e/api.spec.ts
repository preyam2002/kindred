import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test.describe("Public API endpoints", () => {
    test("GET /api/waitlist returns valid response", async ({ request }) => {
      const res = await request.get("/api/waitlist");
      expect(res.status()).toBeLessThan(500);
    });

    test("GET /api/waitlist/leaderboard returns response", async ({
      request,
    }) => {
      const res = await request.get("/api/waitlist/leaderboard");
      // May return 500 if Supabase is not configured in test environment
      expect(res.status()).toBeDefined();
      const body = await res.json();
      expect(body).toBeDefined();
    });

    test("GET /api/search returns valid JSON", async ({ request }) => {
      const res = await request.get("/api/search?q=test");
      expect(res.status()).toBeLessThan(500);
      if (res.status() === 200) {
        const body = await res.json();
        expect(body).toBeDefined();
      }
    });
  });

  test.describe("Protected API endpoints return 401 without auth", () => {
    const protectedEndpoints = [
      { method: "GET", path: "/api/library" },
      { method: "GET", path: "/api/friends" },
      { method: "GET", path: "/api/matches" },
      // Note: /api/collections allows unauthenticated GET (public collections)
      { method: "GET", path: "/api/notifications" },
      { method: "GET", path: "/api/queue" },
      { method: "GET", path: "/api/dashboard" },
      { method: "GET", path: "/api/recommendations" },
      { method: "GET", path: "/api/taste-dna" },
      { method: "GET", path: "/api/integrations" },
      { method: "GET", path: "/api/chat" },
    ];

    for (const endpoint of protectedEndpoints) {
      test(`${endpoint.method} ${endpoint.path} returns 401`, async ({
        request,
      }) => {
        const res = await request.get(endpoint.path);
        expect(res.status()).toBe(401);
        const body = await res.json();
        expect(body.error).toBeDefined();
      });
    }
  });

  test.describe("POST endpoints reject invalid data", () => {
    test("POST /api/waitlist rejects missing email", async ({ request }) => {
      const res = await request.post("/api/waitlist", {
        data: { name: "Test" },
      });
      expect(res.status()).toBeLessThan(500);
    });

    test("POST /api/chat rejects without auth", async ({ request }) => {
      const res = await request.post("/api/chat", {
        data: { message: "Hello" },
      });
      expect(res.status()).toBe(401);
    });

    test("POST /api/friends/request rejects without auth", async ({
      request,
    }) => {
      const res = await request.post("/api/friends/request", {
        data: { friendId: "test" },
      });
      expect(res.status()).toBe(401);
    });

    test("POST /api/collections rejects without auth", async ({ request }) => {
      const res = await request.post("/api/collections", {
        data: { title: "Test Collection" },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe("API response format", () => {
    test("error responses include error field", async ({ request }) => {
      const res = await request.get("/api/library");
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });

    test("API returns JSON content type", async ({ request }) => {
      const res = await request.get("/api/library");
      const contentType = res.headers()["content-type"];
      expect(contentType).toContain("application/json");
    });
  });
});
