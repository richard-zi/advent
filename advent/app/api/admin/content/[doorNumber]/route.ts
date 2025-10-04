import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { MediaService } from '@/lib/services/mediaService';
import { PollService } from '@/lib/services/pollService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { CacheService } from '@/lib/services/cacheService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    doorNumber: string;
  };
}

async function handler(request: NextRequest, context: RouteParams) {
  try {
    const doorNumber = parseInt(context.params.doorNumber);

    // Delete thumbnails
    const medium = await MediaService.getAllDoors();
    if (medium[doorNumber]) {
      const filename = medium[doorNumber];
      await ThumbnailService.deleteThumbnail(filename);
    }

    // Delete content
    await MediaService.deleteContent(doorNumber);
    PollService.deletePoll(doorNumber);

    // Invalidate cache
    CacheService.invalidateCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handler);
