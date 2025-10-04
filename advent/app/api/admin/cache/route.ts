import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { CacheService } from '@/lib/services/cacheService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  try {
    const timestamp = CacheService.getLastResetTimestamp();
    return NextResponse.json({ timestamp });
  } catch (error) {
    logger.error('Error fetching cache timestamp:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache timestamp' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    CacheService.invalidateCache();
    ThumbnailService.clearCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
