import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

// Mock better-auth/minimal
vi.mock('better-auth/minimal', () => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
    $Infer: {
      Session: {
        session: {
          id: 'mock_session_id',
          userId: 'mock_id',
          expiresAt: new Date(),
          token: 'mock_token',
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
        user: {
          id: 'mock_id',
          name: 'Mock User',
          email: 'mock@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  })),
}));

// Mock prisma and prisma adapter
vi.mock('@/lib/prisma', () => ({
  default: {},
}));
vi.mock('@better-auth/prisma-adapter', () => ({
  prismaAdapter: vi.fn(),
}));
vi.mock('better-auth/next-js', () => ({
  nextCookies: vi.fn(),
}));

import { headers } from 'next/headers';
import { auth, getSessionUser, type AuthUser, type Session } from '@/lib/auth';

describe('lib/auth: getSessionUser()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns authenticated user when a valid session exists', async () => {
    const mockUser: AuthUser = {
      id: '507f1f77bcf86cd799439011',
      name: 'Alice Developer',
      email: 'alice@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSessionRecord: Session['session'] = {
      id: 's1',
      userId: mockUser.id,
      expiresAt: new Date(),
      token: 'tok',
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    };

    vi.mocked(headers).mockResolvedValue(new Headers({ cookie: 'better-auth.session_token=valid' }) as unknown as Awaited<ReturnType<typeof headers>>);
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: mockSessionRecord,
      user: mockUser,
    });

    const user = await getSessionUser();
    expect(user).toEqual(mockUser);
    expect(auth.api.getSession).toHaveBeenCalledTimes(1);
  });

  it('returns null when no session exists (unauthenticated request)', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers() as unknown as Awaited<ReturnType<typeof headers>>);
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  it('returns null when session token is expired or invalid', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ cookie: 'better-auth.session_token=expired' }) as unknown as Awaited<ReturnType<typeof headers>>);
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  it('propagates error when session retrieval fails with database/infrastructure error (fails closed)', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ cookie: 'better-auth.session_token=valid' }) as unknown as Awaited<ReturnType<typeof headers>>);
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('MongoDB connection refused'));

    await expect(getSessionUser()).rejects.toThrow('MongoDB connection refused');
  });

  it('does not export DEMO_USER or getEffectiveUser', async () => {
    const authModule = await import('@/lib/auth');
    expect('DEMO_USER' in authModule).toBe(false);
    expect('getEffectiveUser' in authModule).toBe(false);
  });
});
