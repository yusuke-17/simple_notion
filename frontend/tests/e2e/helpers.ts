import { Page } from '@playwright/test';

export async function mockApiResponses(page: Page) {
  // Mock auth endpoints
  await page.route('/api/auth/me', async (route) => {
    console.log('Mock: /api/auth/me called');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User'
        },
        token: 'mock-token'
      })
    });
  });

  await page.route('/api/auth/login', async (route) => {
    console.log('Mock: /api/auth/login called');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User'
        },
        token: 'mock-token'
      })
    });
  });

  await page.route('/api/auth/logout', async (route) => {
    console.log('Mock: /api/auth/logout called');
    await route.fulfill({ status: 200 });
  });

  // Mock documents endpoints
  await page.route('/api/documents', async (route) => {
    console.log('Mock: /api/documents called');
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Test Document',
            content: 'Test content',
            parentId: null,
            userId: 1,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ])
      });
    }
  });

  await page.route('/api/documents/*', async (route) => {
    const url = route.request().url();
    const documentId = url.split('/').pop();
    console.log(`Mock: /api/documents/${documentId} called`);
    
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: parseInt(documentId!),
          title: 'Test Document',
          content: 'Test content',
          parentId: null,
          userId: 1,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        })
      });
    }
  });
}

export async function mockUnauthenticatedUser(page: Page) {
  await page.route('/api/auth/me', async (route) => {
    console.log('Mock: /api/auth/me called (unauthenticated)');
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' })
    });
  });
}
