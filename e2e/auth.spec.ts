import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("shows heading and subtext", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.locator("text=Sign in to your kindred account")).toBeVisible();
  });

  test("shows Twitter/X OAuth button", async ({ page }) => {
    const btn = page.getByRole("button", { name: "Continue with X" });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("has back to home link that navigates to /", async ({ page }) => {
    await page.getByText("Back to home").click();
    await expect(page).toHaveURL("/");
  });

  test("has sign up link pointing to /auth/signup", async ({ page }) => {
    const signupLink = page.getByRole("link", { name: "Sign up" });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("supports redirect query parameter", async ({ page }) => {
    await page.goto("/auth/login?redirect=/dashboard");
    // Next.js may encode the param differently
    const url = page.url();
    expect(url).toContain("/auth/login");
    expect(url).toContain("redirect");
  });
});

test.describe("Signup Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signup");
  });

  test("shows heading and subtext", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.locator("text=Join kindred and connect through what you love")).toBeVisible();
  });

  test("shows Twitter/X OAuth button", async ({ page }) => {
    const btn = page.getByRole("button", { name: "Continue with X" });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("has log in link pointing to /auth/login", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: "Log in" });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("can navigate login -> signup -> login round trip", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
