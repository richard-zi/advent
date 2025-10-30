import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

export async function verifyAuth(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get('admin_token');
    if (!tokenCookie?.value) {
      return { authenticated: false, error: 'Missing authentication token' };
    }

    const decoded = AuthService.verifyToken(tokenCookie.value);

    if (!decoded) {
      return { authenticated: false, error: 'Invalid authentication token' };
    }

    const method = request.method?.toUpperCase();
    if (method && !SAFE_METHODS.has(method)) {
      const csrfCookie = request.cookies.get('admin_csrf')?.value;
      const csrfHeader = request.headers.get('x-csrf-token');

      if (!csrfCookie || !csrfHeader) {
        return { authenticated: false, error: 'Missing CSRF token' };
      }

      if (!timingSafeCompare(csrfCookie, csrfHeader)) {
        return { authenticated: false, error: 'Invalid CSRF token' };
      }
    }

    return { authenticated: true, user: decoded };
  } catch (error) {
    logger.error('Auth verification error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

export function withAuth(
  handler: (
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ) => {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Token is valid, proceed with the handler
    return handler(request, context);
  };
}
