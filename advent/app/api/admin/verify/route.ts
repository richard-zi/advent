import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAuth } from '@/lib/middleware/auth';
import { env } from '@/lib/config/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const csrfToken =
    request.cookies.get('admin_csrf')?.value ||
    crypto.randomBytes(32).toString('hex');

  const response = NextResponse.json({
    valid: true,
    csrfToken,
  });

  response.cookies.set('admin_csrf', csrfToken, {
    httpOnly: false,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return response;
}
