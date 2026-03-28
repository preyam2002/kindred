import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("landing page DOM-ready under 5s", async ({ page }) => {
    const t0 = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(Date.now() - t0).toBeLessThan(5000);
  });

  test("login page DOM-ready under 5s", async ({ page }) => {
    const t0 = Date.now();
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    expect(Date.now() - t0).toBeLessThan(5000);
  });

  test("API /api/library responds under 3s", async ({ request }) => {
    const t0 = Date.now();
    await request.get("/api/library");
    expect(Date.now() - t0).toBeLessThan(3000);
  });

  test("no uncaught JS exceptions on public pages", async ({ page }) => {
    const exceptions: string[] = [];
    page.on("pageerror", (e) => exceptions.push(e.message));
    for (const route of ["/", "/auth/login", "/auth/signup", "/waitlist"]) {
      await page.goto(route);
      await page.waitForTimeout(500);
    }
    expect(exceptions).toHaveLength(0);
  });

  test("no console errors on landing page (excluding expected)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(1000);
    const critical = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("analytics") && !e.includes("Failed to load resource")
    );
    expect(critical).toHaveLength(0);
  });
});
