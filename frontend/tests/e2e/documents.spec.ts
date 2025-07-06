import { test, expect } from '@playwright/test';
import { mockApiResponses } from './helpers';

test.describe('Document Management', () => {
  test('認証済みユーザーは文書編集画面にアクセスできる', async ({ page }) => {
    // Mock authenticated state with documents
    await mockApiResponses(page);
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ページが読み込まれることを確認
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // メインアプリが表示されることを確認
    await expect(page.locator('#root')).toBeVisible({ timeout: 15000 });
    
    // 初期状態では文書選択画面が表示される
    await expect(page.getByText('Select a document to start editing')).toBeVisible();
    
    // ログアウトボタンが表示されることを確認
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('アプリケーションの基本レイアウトが正しく表示される', async ({ page }) => {
    await mockApiResponses(page);
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ページが正しく読み込まれることを確認
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // Reactアプリのルート要素が表示される
    await expect(page.locator('#root')).toBeVisible({ timeout: 15000 });
    
    // メインレイアウトの要素が表示される
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});
