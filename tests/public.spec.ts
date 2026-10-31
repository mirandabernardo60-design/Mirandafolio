import { expect, test } from "@playwright/test";

test("home renders shell with Miranda branding", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Miranda/);
  await expect(page.locator(".logo-word").first()).toHaveText(/Miranda/i);
  await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
});

test("unauthenticated admin access redirects to login", async ({ page }) => {
  await page.goto("/admin/references");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("invalid login is rejected", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("public search API responds", async ({ request }) => {
  const res = await request.get("/api/search?q=test");
  expect(res.ok()).toBeTruthy();
});
