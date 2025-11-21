import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { MediaService } from '@/lib/services/mediaService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { PollService } from '@/lib/services/pollService';
import { FileUtils } from '@/lib/utils/fileUtils';
import { paths } from '@/lib/config/paths';
import { logger } from '@/lib/utils/logger';
import path from 'path';
import type { DoorContent } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin can see ALL doors, regardless of date
    const allDoors = await MediaService.getAllDoors();
    const result: Record<number, DoorContent> = {};

    // Load content for all 24 doors
    for (let doorNumber = 1; doorNumber <= 24; doorNumber++) {
      if (!allDoors[doorNumber]) {
        result[doorNumber] = {
          type: 'not available yet',
          data: null,
          text: null,
          thumbnailLight: null,
          thumbnailDark: null,
          meta: null,
        };
        continue;
      }

      const filename = allDoors[doorNumber];
      const filePath = path.join(paths.mediaDir, filename);

      if (!FileUtils.fileExists(filePath)) {
        result[doorNumber] = {
          type: 'not available yet',
          data: null,
          text: null,
          thumbnailLight: null,
          thumbnailDark: null,
          meta: null,
        };
        continue;
      }

      const fileType = FileUtils.getFileType(filename);
      const mediaContent = MediaService.prepareMediaContent(
        filePath,
        fileType,
        {},
        doorNumber
      );

      let thumbnailLight: string | null = null;
      let thumbnailDark: string | null = null;
      if (mediaContent.type !== 'not available yet') {
        const thumbnailPaths = await ThumbnailService.generateThumbnail(
          filePath,
          mediaContent.type,
          doorNumber
        );
        if (thumbnailPaths.light) {
          thumbnailLight = `/api/thumbnails/${path.basename(thumbnailPaths.light)}`;
        }
        if (thumbnailPaths.dark) {
          thumbnailDark = `/api/thumbnails/${path.basename(thumbnailPaths.dark)}`;
        }
      }

      const message = await MediaService.getMediaMessage(doorNumber);
      const meta = mediaContent.meta ?? null;

      // Handle poll data
      if (mediaContent.type === 'poll') {
        const pollData = PollService.getPollData(doorNumber);
        const pollVotes = PollService.getVotes(doorNumber);

        result[doorNumber] = {
          type: mediaContent.type,
          data: JSON.stringify({ question: pollData, votes: pollVotes }),
          text: message,
          thumbnailLight,
          thumbnailDark,
          meta,
        };
        continue;
      }

      result[doorNumber] = {
        type: mediaContent.type,
        data: mediaContent.data || null,
        text: message,
        thumbnailLight,
        thumbnailDark,
        meta,
      };
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    logger.error('Error fetching doors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doors' },
      { status: 500 }
    );
  }
}
