import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@prisma/client';

export const SESSION_COOKIE = 'fikir_session';

export type SessionPayload = {
  sub: string;
  username: string;
  role: UserRole;
};

function getSecretKeyOrNull() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

function getSecretKeyForSigning() {
  const key = getSecretKeyOrNull();
  if (!key) {
    throw new Error('AUTH_SECRET must be set (min 16 characters)');
  }
  return key;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKeyForSigning());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const key = getSecretKeyOrNull();
    if (!key) return null;
    const { payload } = await jwtVerify(token, key);
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    const username = typeof payload.username === 'string' ? payload.username : '';
    const role = payload.role as UserRole;
    if (!sub || !username || !role) return null;
    return { sub, username, role };
  } catch {
    return null;
  }
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}
