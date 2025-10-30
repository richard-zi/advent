import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { MediaService } from '@/lib/services/mediaService';
import { PollService } from '@/lib/services/pollService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { logger } from '@/lib/utils/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { doorNumber: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doorNumber = parseInt(params.doorNumber, 10);
    if (!doorNumber || doorNumber < 1 || doorNumber > 24) {
      return NextResponse.json({ error: 'Invalid door number' }, { status: 400 });
    }

    // Clean up polls and thumbnails if content exists
    try {
      const medium = await MediaService.getAllDoors();
      const existingFilename = medium[doorNumber];
      if (existingFilename) {
        await ThumbnailService.deleteThumbnail(existingFilename);
      }
      PollService.deletePoll(doorNumber);
    } catch (cleanupError) {
      logger.warn('Cleanup before delete failed:', cleanupError);
    }

    const success = await MediaService.deleteContent(doorNumber);
    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  } catch (error) {
    logger.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
