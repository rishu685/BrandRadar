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
  id: 'guest_user_brandradar',
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

  // Ensure default guest record exists in DB
  try {
    const existing = await prisma.user.findUnique({ where: { id: DEMO_USER.id } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  } catch {
    // ignore if schema exists or offline
  }

  return DEMO_USER;
}
