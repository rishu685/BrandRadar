import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}));

// Mock components/dashboardNavbar
vi.mock('@/components/dashboardNavbar', () => ({
  DashboardNavbar: vi.fn(() => null),
}));

import { redirect } from 'next/navigation';
import { getSessionUser, type AuthUser } from '@/lib/auth';
import DashboardLayout from '@/app/(routes)/(dashboard)/layout';

describe('Dashboard Layout Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows unauthenticated users to access dashboard directly without redirect', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const jsx = await DashboardLayout({ children: null });
    expect(redirect).not.toHaveBeenCalled();
    expect(jsx).toBeDefined();
  });

  it('allows authenticated users to access dashboard layout', async () => {
    const mockUser: AuthUser = {
      id: '507f1f77bcf86cd799439011',
      name: 'Authenticated User',
      email: 'user@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getSessionUser).mockResolvedValue(mockUser);

    const jsx = await DashboardLayout({ children: null });
    expect(redirect).not.toHaveBeenCalled();
    expect(jsx).toBeDefined();
  });
});
