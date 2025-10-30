import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { env } from '@/lib/config/env';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      // Even if not authenticated, clear cookies to ensure clean state
      const unauthResponse = NextResponse.json({ success: true });
      unauthResponse.cookies.set('admin_token', '', {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
      });
      unauthResponse.cookies.set('admin_csrf', '', {
        httpOnly: false,
        secure: env.nodeEnv === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
      });
      return unauthResponse;
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });
    response.cookies.set('admin_csrf', '', {
      httpOnly: false,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });
    return response;
  } catch (error) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });
    response.cookies.set('admin_csrf', '', {
      httpOnly: false,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });
    return response;
  }
}
