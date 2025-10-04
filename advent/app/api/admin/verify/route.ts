import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  return NextResponse.json({ valid: true });
}

export const GET = withAuth(handler);
