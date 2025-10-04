import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { PollService } from '@/lib/services/pollService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  try {
    const polls = PollService.getAllPolls();
    return NextResponse.json(polls);
  } catch (error) {
    logger.error('Error fetching polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
