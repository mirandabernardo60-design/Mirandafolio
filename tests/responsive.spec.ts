import { expect, test } from "@playwright/test";

for (const width of [1920, 1440, 1280, 1024, 768, 390, 375]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: false });
  });
}
