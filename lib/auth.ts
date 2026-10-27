import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/prisma';

export const auth = betterAuth({
  appName: 'BrandRadar',
  database: prismaAdapter(prisma, {
    provider: 'mongodb',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  plugins: [
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

export const DEMO_USER = {
  id: '000000000000000000000001',
  name: 'Community User',
  email: 'community@brandradar.dev',
};

export async function getEffectiveUser(): Promise<{ id: string; name: string; email: string }> {
  try {
    const session = await auth.api.getSession({ headers: await (await import('next/headers')).headers() });
    if (session?.user) {
      return session.user;
    }
  } catch {
    // fallback to demo guest user
  }

  // Ensure default guest record exists in DB using valid 24-character hex ObjectId
  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { id: DEMO_USER.id },
          { email: DEMO_USER.email },
        ],
      },
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        email: existing.email,
      };
    }

    const created = await prisma.user.create({
      data: {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
    };
  } catch {
    // fallback to existing user or in-memory demo ID
    try {
      const anyUser = await prisma.user.findFirst();
      if (anyUser) {
        return {
          id: anyUser.id,
          name: anyUser.name,
          email: anyUser.email,
        };
      }
    } catch {
      // offline fallback
    }
  }

  return DEMO_USER;
}
