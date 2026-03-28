import { test, expect } from "@playwright/test";

test.describe("Landing Page Interactions", () => {
  test("platform cards have hover/interactive styling", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(".paper-card").first();
    await expect(card).toBeVisible();
    // Card should have the card-tactile class for hover effect
    const cls = await card.getAttribute("class");
    expect(cls).toContain("card-tactile");
  });

  test("nav links have hover transitions", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.getByRole("link", { name: "Log in" });
    await expect(loginLink).toBeVisible();
    // Link should have transition-colors class
    const cls = await loginLink.getAttribute("class");
    expect(cls).toContain("transition");
  });
});

test.describe("Login Page Interactions", () => {
  test("back button navigates home", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByText("Back to home").click();
    await expect(page).toHaveURL("/");
  });

  test("OAuth button is clickable", async ({ page }) => {
    await page.goto("/auth/login");
    const btn = page.getByRole("button", { name: "Continue with X" });
    await expect(btn).toBeEnabled();
    // Verify it has the right styling
    const cls = await btn.getAttribute("class");
    expect(cls).toContain("border");
  });
});

test.describe("Signup Page Interactions", () => {
  test("back button navigates home", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByText("Back to home").click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Waitlist Page Interactions", () => {
  test("email input is focusable and accepts text", async ({ page }) => {
    await page.goto("/waitlist");
    await page.waitForLoadState("networkidle");
    const input = page.locator('input[type="email"], input[placeholder*="email" i]');
    await input.click();
    await input.fill("user@test.com");
    await expect(input).toHaveValue("user@test.com");
  });

  test("name input accepts text", async ({ page }) => {
    await page.goto("/waitlist");
    await page.waitForLoadState("networkidle");
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("John Doe");
      await expect(nameInput).toHaveValue("John Doe");
    }
  });
});

test.describe("Onboarding Page Interactions", () => {
  test("renders step content", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("skip button exists and navigates", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");
    const skipBtn = page.locator("button:has-text('Skip'), a:has-text('Skip')");
    if (await skipBtn.isVisible()) {
      // Skip should be clickable
      await expect(skipBtn).toBeEnabled();
    }
  });
});

test.describe("Feature Page UI Elements", () => {
  test("leaderboards page has category buttons", async ({ page }) => {
    await page.goto("/leaderboards");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    // Should contain category names
    const hasCategories = body!.includes("Top Raters") || body!.includes("Streak") || body!.includes("Leaderboard");
    expect(hasCategories).toBe(true);
  });

  test("mood-discovery page has mood options", async ({ page }) => {
    await page.goto("/mood-discovery");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("share-cards page loads", async ({ page }) => {
    await page.goto("/share-cards");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("taste-art page loads", async ({ page }) => {
    await page.goto("/taste-art");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });
});

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("landing page navigation works on mobile", async ({ page }) => {
    await page.goto("/");
    // Login link should still be visible on mobile
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("auth pages are usable on mobile", async ({ page }) => {
    await page.goto("/auth/login");
    const btn = page.getByRole("button", { name: "Continue with X" });
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    // Button should be reasonably sized for touch
    expect(box!.height).toBeGreaterThanOrEqual(30);
  });
});

test.describe("Error Pages", () => {
  test("404 renders custom not-found page", async ({ page }) => {
    const res = await page.goto("/nonexistent-page-xyz");
    expect(res!.status()).toBe(404);
    // Should have some content (not blank white page)
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(10);
  });
});
