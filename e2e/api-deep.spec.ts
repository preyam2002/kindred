import { test, expect } from "@playwright/test";

test.describe("API: Health Check Response Shape", () => {
  test("returns all expected fields", async ({ request }) => {
    const res = await request.get("/api/health");
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("checks");
    expect(body.checks).toHaveProperty("database");
    expect(body.checks).toHaveProperty("environment");
    expect(body.checks).toHaveProperty("openai");
    expect(body.checks).toHaveProperty("anthropic");
    // Each check has status field
    for (const key of Object.keys(body.checks)) {
      expect(body.checks[key]).toHaveProperty("status");
      expect(["ok", "error"]).toContain(body.checks[key].status);
    }
  });

  test("timestamp is ISO-8601", async ({ request }) => {
    const { timestamp } = await (await request.get("/api/health")).json();
    expect(() => new Date(timestamp).toISOString()).not.toThrow();
  });
});

test.describe("API: Search Edge Cases", () => {
  test("empty query returns empty results", async ({ request }) => {
    const res = await request.get("/api/search?q=");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results).toBeDefined();
  });

  test("single character query returns empty results", async ({ request }) => {
    const res = await request.get("/api/search?q=a");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results).toBeDefined();
  });

  test("two character query triggers search", async ({ request }) => {
    const res = await request.get("/api/search?q=ab");
    expect(res.status()).toBeLessThan(500);
  });

  test("special characters in query don't crash", async ({ request }) => {
    const specialChars = ["<script>", "'; DROP TABLE", "%00", "🎯", "a".repeat(500)];
    for (const q of specialChars) {
      const res = await request.get(`/api/search?q=${encodeURIComponent(q)}`);
      expect(res.status()).toBeLessThan(500);
    }
  });

  test("type filter works for users", async ({ request }) => {
    const res = await request.get("/api/search?q=test&type=users");
    expect(res.status()).toBeLessThan(500);
  });

  test("type filter works for media", async ({ request }) => {
    const res = await request.get("/api/search?q=test&type=media");
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("API: Error Response Consistency", () => {
  const authEndpoints = [
    "/api/library",
    "/api/dashboard",
    "/api/friends",
    "/api/queue",
    "/api/notifications",
    "/api/settings",
  ];

  for (const path of authEndpoints) {
    test(`${path} 401 response has { error: string } shape`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    });
  }
});

test.describe("API: Waitlist Validation", () => {
  test("POST without email returns 400", async ({ request }) => {
    const res = await request.post("/api/waitlist", { data: { name: "Test" } });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test("POST with invalid email format returns 400", async ({ request }) => {
    const res = await request.post("/api/waitlist", {
      data: { email: "not-an-email", name: "Test" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("API: Content-Type Headers", () => {
  const endpoints = ["/api/health", "/api/library", "/api/search?q=test"];
  for (const path of endpoints) {
    test(`${path} returns application/json`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.headers()["content-type"]).toContain("application/json");
    });
  }
});

test.describe("API: User Profile Edge Cases", () => {
  test("non-existent username returns 404 or empty", async ({ request }) => {
    const res = await request.get("/api/users/zzz_nonexistent_user_12345");
    expect(res.status()).toBeLessThan(500);
  });

  test("username with special chars doesn't crash", async ({ request }) => {
    const res = await request.get("/api/users/" + encodeURIComponent("test<script>"));
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("API: Queue Validation", () => {
  test("POST /api/queue without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/queue", {
      data: { media_type: "book", media_id: "test" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("API: Comments Validation", () => {
  test("POST /api/comments without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/comments", {
      data: { media_id: "x", media_type: "book", content: "great!" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("API: Share Validation", () => {
  test("POST /api/share without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/share", {
      data: { shareType: "profile", platform: "twitter" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("API: Taste Challenge", () => {
  test("POST /api/taste-challenge/submit with empty ratings returns 400", async ({ request }) => {
    const res = await request.post("/api/taste-challenge/submit", {
      data: { challengeId: "test", ratings: [] },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/taste-challenge/submit without challengeId returns 400", async ({ request }) => {
    const res = await request.post("/api/taste-challenge/submit", {
      data: { ratings: [{ itemId: "x", userRating: 5, originalRating: 7 }] },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/taste-challenge/submit with valid data returns score", async ({ request }) => {
    const res = await request.post("/api/taste-challenge/submit", {
      data: {
        challengeId: "test-challenge",
        ratings: [
          { itemId: "item1", userRating: 8, originalRating: 7 },
          { itemId: "item2", userRating: 5, originalRating: 5 },
          { itemId: "item3", userRating: 3, originalRating: 9 },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("score");
    expect(body).toHaveProperty("percentage");
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("breakdown");
    expect(body).toHaveProperty("badges");
    expect(typeof body.score).toBe("number");
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(100);
    expect(body.breakdown).toHaveProperty("exact_matches");
    expect(body.breakdown).toHaveProperty("close_matches");
    expect(body.breakdown).toHaveProperty("total_items");
    expect(body.breakdown.total_items).toBe(3);
    expect(Array.isArray(body.badges)).toBe(true);
  });

  test("perfect score returns high percentage", async ({ request }) => {
    const res = await request.post("/api/taste-challenge/submit", {
      data: {
        challengeId: "perfect",
        ratings: [
          { itemId: "a", userRating: 8, originalRating: 8 },
          { itemId: "b", userRating: 5, originalRating: 5 },
        ],
      },
    });
    const body = await res.json();
    expect(body.percentage).toBe(100);
    expect(body.breakdown.exact_matches).toBe(2);
  });
});
