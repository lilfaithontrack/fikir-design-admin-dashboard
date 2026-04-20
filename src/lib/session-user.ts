import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from '@/lib/auth';

export type CurrentUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: SessionPayload['role'];
  isActive: boolean;
};

export async function getSessionFromToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<CurrentUser | null> {
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? bearerToken;
  const session = await getSessionFromToken(token);
  if (!session) return null;

  const id = parseInt(session.sub, 10);
  if (Number.isNaN(id)) return null;

  const user = await prisma.user.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.username || user.role !== session.role) return null;
  return user as CurrentUser;
}

export async function getCurrentUserFromCookies(): Promise<CurrentUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await getSessionFromToken(token);
  if (!session) return null;

  const id = parseInt(session.sub, 10);
  if (Number.isNaN(id)) return null;

  const user = await prisma.user.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.username || user.role !== session.role) return null;
  return user as CurrentUser;
}
