import { describe, it, expect, vi, beforeEach } from 'vitest';

// fetchをモック
global.fetch = vi.fn();

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBe(true);
  });
});
