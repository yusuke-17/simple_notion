import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('アプリケーションが正しく起動する', async ({ page }) => {
    await page.goto('/');
    
    // ページが読み込まれることを確認
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // 何らかのコンテンツが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });
});
