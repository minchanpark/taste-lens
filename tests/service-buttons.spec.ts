import { test, expect } from '@playwright/test';

for (const width of [319, 390, 1280]) {
  test(`service buttons open matching stores and update cart fees at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 705 });
    await page.goto('/');
    await expect(page.locator('.delivery-restaurant-card').first()).toBeVisible();
    const delivery = page.getByRole('tab', { name: '배달', exact: true });
    const pickup = page.getByRole('tab', { name: '포장', exact: true });
    const selection = page.locator('.service-selection');
    await pickup.click();
    await expect(pickup).toHaveAttribute('aria-selected', 'true');
    await expect(delivery).toHaveAttribute('aria-selected', 'false');
    await expect(selection).toHaveText('포장할 가게 · 배달비 없음');
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await page.locator('.delivery-card-bottom button').first().click();
    await page.getByRole('button', { name: '장바구니', exact: true }).click();
    await expect(page.locator('.cart-mode button.active')).toHaveText('포장');
    await expect(page.locator('.receipt > div').filter({ hasText: '배달비' }).locator('b')).toHaveText('0원');
    await page.getByRole('button', { name: '닫기', exact: true }).click();
    await delivery.click();
    await expect(delivery).toHaveAttribute('aria-selected', 'true');
    await expect(selection).toHaveText('배달받을 가게 · 배달비 2,000원');
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await page.getByRole('button', { name: '장바구니', exact: true }).click();
    await expect(page.locator('.cart-mode button.active')).toHaveText('배달');
    await expect(page.locator('.receipt > div').filter({ hasText: '배달비' }).locator('b')).toHaveText('2,000원');
    await page.getByRole('button', { name: '닫기', exact: true }).click();
    // Both tabs share working filters and the selected ordering mode.
    await delivery.click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await pickup.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(delivery).toBeFocused();
    await expect(delivery).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: '🍕 양식', exact: true }).click();
    await page.getByRole('button', { name: '치즈버거', exact: true }).click();
    await expect(page.locator('.delivery-restaurant-card')).toHaveCount(3);
    await page.getByLabel('메뉴 정렬').selectOption('rating');
    const ratings = await page.locator('.restaurant-name-row > span').allTextContents();
    expect(ratings.map(Number)).toEqual([...ratings.map(Number)].sort((a,b)=>b-a));
    await page.getByLabel('메뉴 정렬').selectOption('price');
    const prices = await page.locator('.delivery-card-bottom > b').allTextContents();
    const amounts = prices.map(x=>Number(x.replace(/[^0-9]/g, '')));
    expect(amounts).toEqual([...amounts].sort((a,b)=>a-b));
    await page.getByRole('tab', { name: '포장', exact: true }).click();
    await expect(page.locator('.delivery-restaurant-card')).toHaveCount(3);
    await expect(page.getByLabel('메뉴 정렬')).toHaveValue('price');
    await page.screenshot({ path: `evidence/service-buttons-${width}.png` });
  });
}
