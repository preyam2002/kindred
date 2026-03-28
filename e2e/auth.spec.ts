import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test.describe("Login Page", () => {
    test("renders login form", async ({ page }) => {
      await page.goto("/auth/login");
      await expect(page.locator("text=Welcome back")).toBeVisible();
      await expect(
        page.locator("text=Sign in to your kindred account")
      ).toBeVisible();
    });

    test("shows Continue with X button", async ({ page }) => {
      await page.goto("/auth/login");
      await expect(page.locator("text=Continue with X")).toBeVisible();
    });

    test("has link to signup page", async ({ page }) => {
      await page.goto("/auth/login");
      const signupLink = page.locator('a[href="/auth/signup"]');
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toContainText("Sign up");
    });

    test("has back to home button", async ({ page }) => {
      await page.goto("/auth/login");
      await expect(page.locator("text=Back to home")).toBeVisible();
    });

    test("navigates to signup from login", async ({ page }) => {
      await page.goto("/auth/login");
      await page.click('a[href="/auth/signup"]');
      await expect(page).toHaveURL(/\/auth\/signup/);
    });
  });

  test.describe("Signup Page", () => {
    test("renders signup form", async ({ page }) => {
      await page.goto("/auth/signup");
      await expect(page.locator("text=Create account")).toBeVisible();
      await expect(
        page.locator("text=Join kindred and connect through what you love")
      ).toBeVisible();
    });

    test("shows Continue with X button", async ({ page }) => {
      await page.goto("/auth/signup");
      await expect(page.locator("text=Continue with X")).toBeVisible();
    });

    test("has link to login page", async ({ page }) => {
      await page.goto("/auth/signup");
      const loginLink = page.locator('a[href="/auth/login"]');
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toContainText("Log in");
    });

    test("has back to home button", async ({ page }) => {
      await page.goto("/auth/signup");
      await expect(page.locator("text=Back to home")).toBeVisible();
    });

    test("navigates to login from signup", async ({ page }) => {
      await page.goto("/auth/signup");
      await page.click('a[href="/auth/login"]');
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });
});
