import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('ホームページが正しく読み込まれる', async ({ page }) => {
    await page.goto('/');
    
    // ページが読み込まれることを確認
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // Reactアプリが正しく動作していることを確認
    await expect(page.locator('#root')).toBeVisible();
  });
});
