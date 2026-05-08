import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

function shouldUseSecureCookie(request: NextRequest): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override === 'true') return true;
  if (override === 'false') return false;

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return request.nextUrl.protocol === 'https:' || forwardedProto === 'https';
}

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const secureCookie = shouldUseSecureCookie(request);
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
