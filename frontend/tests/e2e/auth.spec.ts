import { test, expect } from '@playwright/test';
import { mockApiResponses, mockUnauthenticatedUser } from './helpers';

test.describe('Authentication', () => {
  test('未認証ユーザーにはログインフォームが表示される', async ({ page }) => {
    // Mock unauthenticated state
    await mockUnauthenticatedUser(page);
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ページが読み込まれることを確認
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // ログインフォームが表示されることを確認
    await expect(page.getByText('Sign in to your account')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('認証済みユーザーにはメインアプリが表示される', async ({ page }) => {
    // Mock authenticated state
    await mockApiResponses(page);
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ページが読み込まれることを確認
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
    
    // メインアプリのUIが表示されることを確認
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Select a document to start editing')).toBeVisible();
  });

  test('ログインフォームの動作', async ({ page }) => {
    // Start unauthenticated
    await mockUnauthenticatedUser(page);
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ログインフォームが表示されることを確認
    await expect(page.getByText('Sign in to your account')).toBeVisible({ timeout: 15000 });
    
    // 登録モードに切り替え
    await page.getByText("Don't have an account? Register").click();
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    
    // ログインモードに戻す
    await page.getByText('Already have an account? Sign in').click();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });
});
