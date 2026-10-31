import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
test.skip(!email || !password, "Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to run the CMS flow");
test.describe.configure({ mode: "serial" });

const name = `E2E Site ${Date.now()}`;
const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

test("full reference lifecycle", async ({ page, context }) => {
  // 1. log in
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  // 2-3. add website + fetch metadata
  await page.goto("/admin/references/new");
  await page.locator('input[name="url"]').fill("https://example.com");
  // screenshot + metadata load automatically after pasting the link
  await expect(page.getByAltText("Website preview")).toBeVisible({ timeout: 40_000 });

  // invalid submission: empty name
  await page.locator('input[name="name"]').fill("");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expect(page.getByText("Name is required")).toBeVisible();


  // 5. tags + name
  await page.locator('input[name="name"]').fill(name);
  await page.getByPlaceholder("Pick a tag or type a new one, then Enter").fill("e2e");
  await page.keyboard.press("Enter");

  // 6. save as draft
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expect(page).toHaveURL(/\/admin\/references\/[0-9a-f-]{36}/);

  const anon = await context.browser()!.newContext();
  const pub = await anon.newPage();
  let res = await pub.goto(`/references/${slug}`);
  expect(res?.status()).toBe(404); // drafts are private

  // 7-10. publish, appears, search, detail
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("status")).toHaveText("Published");
  res = await pub.goto(`/references/${slug}`);
  expect(res?.status()).toBe(200);
  await expect(pub.getByRole("heading", { name })).toBeVisible();
  await pub.goto(`/all?q=${encodeURIComponent(name)}`);
  await expect(pub.locator(".card", { hasText: name })).toBeVisible();

  // 11-12. edit
  await page.locator('input[name="short_description"]').fill("Edited by e2e");
  await page.getByRole("button", { name: /Save & keep published/ }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await pub.goto(`/references/${slug}`);
  await expect(pub.getByText("Edited by e2e").first()).toBeVisible();

  // 13-14. unpublish
  await page.getByRole("button", { name: /Unpublish/ }).click();
  await expect(page.getByRole("status")).toBeVisible();
  res = await pub.goto(`/references/${slug}`);
  expect(res?.status()).toBe(404);

  // 15-16. delete (persisted in Postgres, survives restarts)
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete reference" }).click();
  await expect(page).toHaveURL(/\/admin\/references$/);
  await expect(page.getByText(name)).toHaveCount(0);
  await anon.close();
});
