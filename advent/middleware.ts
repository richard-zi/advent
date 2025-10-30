import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const allowedIps = (process.env.ADMIN_IP_ALLOWLIST ?? '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

function normalizeIp(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  if (ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
}

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return normalizeIp(forwardedFor.split(',')[0].trim());
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return normalizeIp(realIp.trim());
  }

  if (request.ip) {
    return normalizeIp(request.ip);
  }

  return null;
}

export function middleware(request: NextRequest) {
  if (!allowedIps.length) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);
  if (!clientIp || !allowedIps.includes(clientIp)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
