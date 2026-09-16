import { test, expect } from "@playwright/test";

for (const width of [319, 1280]) {
  test(`order history is nested under my page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("http://127.0.0.1:3000/");
    await expect(page.getByRole("heading", { name: "내 취향 프로필", exact: true })).toBeVisible();

    const nav = page.locator(
      width === 319 ? ".platform-bottom-nav" : ".desktop-platform-nav",
    );
    await expect(nav.getByRole("button")).toHaveText([
      "홈",
      "취향 렌즈",
      "마이 페이지",
    ]);
    await expect(nav.getByRole("button", { name: "주문 내역" })).toHaveCount(0);

    await nav.getByRole("button", { name: "마이 페이지", exact: true }).click();
    await expect(page.getByRole("heading", { name: "마이 페이지", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /주문 내역/ }).click();
    await expect(page.getByRole("heading", { name: "나의 주문내역", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "마이 페이지", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.getByRole("button", { name: "마이 페이지", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "마이 페이지", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  });
}
