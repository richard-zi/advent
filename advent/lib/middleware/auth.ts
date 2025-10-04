import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
      return { authenticated: false, error: 'Invalid token' };
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
