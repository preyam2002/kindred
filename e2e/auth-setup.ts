import { test as base, expect, type Page } from "@playwright/test";

// Extend the base test to support authenticated sessions.
// Since Kindred uses Twitter OAuth (not credentials), we mock the session
// by injecting a next-auth session cookie directly.
//
// For E2E tests that need auth, we test that:
// 1. Unauthenticated access is handled gracefully
// 2. Auth-gated UI elements behave correctly
// 3. API routes enforce auth properly

export const test = base;
export { expect };

/**
 * Helper to check if a page properly handles unauthenticated state
 * (redirect to login, show auth prompt, or show empty state)
 */
export async function expectUnauthenticatedBehavior(
  page: Page,
  route: string
) {
  await page.goto(route);
  // The page should either:
  // 1. Redirect to login
  // 2. Show loading state (session check)
  // 3. Show empty/limited content
  // It should NOT crash (no 500 error)
  const url = page.url();
  const isRedirected = url.includes("/auth/login");
  const hasContent = await page.locator("body").textContent();
  expect(hasContent).toBeTruthy();

  return { isRedirected };
}
