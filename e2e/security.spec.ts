import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
  test("page responses include security headers", async ({ page }) => {
    const res = await page.goto("/");
    const h = res!.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-xss-protection"]).toBe("1; mode=block");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"]).toContain("max-age=");
  });

  test("X-Powered-By header is absent", async ({ page }) => {
    const res = await page.goto("/");
    expect(res!.headers()["x-powered-by"]).toBeUndefined();
  });

  test("API responses include security headers", async ({ request }) => {
    const res = await request.get("/api/library");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
  });
});

test.describe("CSRF / Auth Protection", () => {
  const mutationPaths = [
    "/api/chat",
    "/api/friends/request",
    "/api/collections",
    "/api/queue",
    "/api/taste-challenge/create",
  ];

  for (const path of mutationPaths) {
    test(`POST ${path} rejects unauthenticated`, async ({ request }) => {
      const res = await request.post(path, { data: {} });
      expect(res.status()).toBe(401);
    });
  }
});

test.describe("Input Sanitisation", () => {
  test("search with XSS payload does not crash", async ({ request }) => {
    const res = await request.get(
      "/api/search?q=" + encodeURIComponent('<script>alert(1)</script>')
    );
    expect(res.status()).toBeLessThan(500);
  });

  test("large payload does not crash API", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { message: "x".repeat(100_000) },
    });
    expect(res.status()).toBeLessThan(500);
  });
});
