import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { MediaService } from '@/lib/services/mediaService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  try {
    const doors = await MediaService.getAllDoors();
    return NextResponse.json(doors);
  } catch (error) {
    logger.error('Error fetching doors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doors' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
