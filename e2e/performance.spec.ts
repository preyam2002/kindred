import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("landing page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("login page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("API responds within 3 seconds", async ({ request }) => {
    const start = Date.now();
    await request.get("/api/library");
    const responseTime = Date.now() - start;
    expect(responseTime).toBeLessThan(3000);
  });

  test("no console errors on landing page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Filter out expected errors (e.g., favicon, analytics)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("analytics") &&
        !e.includes("Failed to load resource")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("no uncaught JS exceptions on public pages", async ({ page }) => {
    const exceptions: string[] = [];
    page.on("pageerror", (error) => {
      exceptions.push(error.message);
    });

    const publicPages = ["/", "/auth/login", "/auth/signup", "/waitlist"];

    for (const route of publicPages) {
      await page.goto(route);
      await page.waitForTimeout(500);
    }

    expect(exceptions).toHaveLength(0);
  });
});
