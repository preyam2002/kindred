import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
  test("sets security headers on page responses", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response!.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });

  test("does not expose X-Powered-By header", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response!.headers();
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("sets security headers on API responses", async ({ request }) => {
    const response = await request.get("/api/library");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
  });
});

test.describe("CSRF & Auth Protection", () => {
  test("API mutation endpoints require authentication", async ({
    request,
  }) => {
    const mutations = [
      { method: "POST", path: "/api/chat" },
      { method: "POST", path: "/api/friends/request" },
      { method: "POST", path: "/api/collections" },
      { method: "POST", path: "/api/queue" },
      { method: "POST", path: "/api/taste-challenge/create" },
    ];

    for (const mutation of mutations) {
      const res = await request.post(mutation.path, {
        data: {},
      });
      expect(res.status()).toBe(401);
    }
  });
});

test.describe("Input Validation", () => {
  test("API rejects oversized payloads gracefully", async ({ request }) => {
    const largePayload = "x".repeat(100_000);
    const res = await request.post("/api/chat", {
      data: { message: largePayload },
    });
    // Should not crash - either 401 (no auth) or 400 (payload too large)
    expect(res.status()).toBeLessThan(500);
  });

  test("API handles malformed JSON gracefully", async ({ request }) => {
    const res = await request.post("/api/chat", {
      headers: { "Content-Type": "application/json" },
      data: "not valid json{{{",
    });
    expect(res.status()).toBeLessThan(500);
  });
});
