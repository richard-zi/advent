import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { AuthService } from '@/lib/services/authService';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const attempts = new Map<string, LoginAttempt>();

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.ip ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const attempt = attempts.get(clientId);
    const now = Date.now();

    if (attempt?.blockedUntil && now < attempt.blockedUntil) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    const isValid = await AuthService.validateCredentials(username, password);

    if (!isValid) {
      if (!attempt || now - attempt.firstAttempt > WINDOW_MS) {
        attempts.set(clientId, { count: 1, firstAttempt: now });
      } else {
        attempt.count += 1;
        if (attempt.count >= MAX_ATTEMPTS) {
          attempt.blockedUntil = now + BLOCK_DURATION_MS;
        }
      }

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    attempts.delete(clientId);

    const token = AuthService.generateToken(username);
    const csrfToken = crypto.randomBytes(32).toString('hex');

    const response = NextResponse.json({ success: true, csrfToken });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    response.cookies.set('admin_csrf', csrfToken, {
      httpOnly: false,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
