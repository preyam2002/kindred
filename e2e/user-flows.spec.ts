import { test, expect } from "@playwright/test";

test.describe("New User Journey", () => {
  test("home → signup → back → login → back", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await page.getByText("Back to home").click();
    await expect(page).toHaveURL("/");
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await page.getByText("Back to home").click();
    await expect(page).toHaveURL("/");
  });

  test("signup ↔ login round-trip", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("waitlist flow — fill form and verify button enables", async ({ page }) => {
    await page.goto("/waitlist");
    await page.waitForLoadState("networkidle");
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    const joinBtn = page.getByRole("button", { name: /join/i }).first();

    await expect(joinBtn).toBeDisabled();
    if (await nameInput.isVisible()) await nameInput.fill("Test User");
    await emailInput.fill("testuser@example.com");
    await expect(joinBtn).toBeEnabled();
  });
});

test.describe("Cross-Page Consistency", () => {
  test("all public pages share the antialiased body class", async ({ page }) => {
    for (const route of ["/", "/auth/login", "/auth/signup", "/waitlist"]) {
      await page.goto(route);
      const cls = await page.locator("body").getAttribute("class");
      expect(cls).toContain("antialiased");
    }
  });

  test("every public page has a non-empty title", async ({ page }) => {
    for (const route of ["/", "/auth/login", "/auth/signup"]) {
      await page.goto(route);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Error Handling Flows", () => {
  test("404 for unknown page", async ({ page }) => {
    const res = await page.goto("/xyz-nonexistent-page");
    expect(res!.status()).toBe(404);
  });

  test("API error returns structured JSON", async ({ request }) => {
    const res = await request.get("/api/library");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
  });
});
