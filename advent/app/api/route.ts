import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/services/mediaService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { TimingService } from '@/lib/services/timingService';
import { FileUtils } from '@/lib/utils/fileUtils';
import { InitService } from '@/lib/services/initService';
import { paths } from '@/lib/config/paths';
import { logger } from '@/lib/utils/logger';
import path from 'path';
import type { DoorContent, DoorStates } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache for door data (1 minute TTL)
let doorDataCache: { data: Record<string, DoorContent>; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minute

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Initialize on first request
    await InitService.initialize();

    const searchParams = request.nextUrl.searchParams;
    const doorStatesParam = searchParams.get('doorStates');
    const doorStates: DoorStates = doorStatesParam
      ? JSON.parse(doorStatesParam)
      : {};

    // Check cache (only for requests without door states)
    const useCache = Object.keys(doorStates).length === 0;
    if (useCache && doorDataCache && Date.now() - doorDataCache.timestamp < CACHE_TTL) {
      logger.info(`API Cache hit - response time: ${Date.now() - startTime}ms`);
      return NextResponse.json(doorDataCache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Load all door data
    const medium = await MediaService.getAllDoors();

    // Process all entries
    const allDataEntries = await Promise.all(
      Object.entries(medium).map(async ([key, value]) => {
        const index = parseInt(key);

        if (!TimingService.dateCheck(index)) {
          return [
            key,
            {
              data: null,
              type: 'not available yet' as const,
              text: null,
              thumbnail: null,
            },
          ];
        }

        const filePath = path.join(paths.mediaDir, value);
        const fileType = FileUtils.getFileType(value);
        let thumbnailUrl: string | null = null;

        if (['video', 'image', 'gif'].includes(fileType)) {
          const thumbnail = await ThumbnailService.generateThumbnail(
            filePath,
            fileType
          );
          if (thumbnail) {
            thumbnailUrl = `/thumbnails/${path.basename(thumbnail)}`;
          }
        }

        // Prepare media content
        const mediaContent = MediaService.prepareMediaContent(
          filePath,
          fileType,
          doorStates,
          index
        );

        let data: string | null = null;

        switch (mediaContent.type) {
          case 'countdown':
          case 'poll':
            data = null;
            break;
          case 'iframe':
            data = mediaContent.data || null;
            break;
          case 'text':
            data = mediaContent.data || null;
            break;
          case 'puzzle': {
            const puzzleImageIndex = MediaService.getPuzzleImageIndex(index);
            data = `/media/${puzzleImageIndex}`;

            if (doorStates[index]?.win) {
              thumbnailUrl = data;
            }
            break;
          }
          default:
            data = `/media/${index}`;
        }

        // Load additional message if present
        const message = await MediaService.getMediaMessage(index);

        const doorContent: DoorContent = {
          data: TimingService.dateCheck(index) ? data : null,
          type: TimingService.dateCheck(index) ? mediaContent.type : 'not available yet',
          text: TimingService.dateCheck(index) ? message : null,
          thumbnail: TimingService.dateCheck(index) ? thumbnailUrl : null,
          isSolved:
            mediaContent.type === 'puzzle'
              ? doorStates[index]?.win || false
              : undefined,
        };

        return [key, doorContent];
      })
    );

    const result = Object.fromEntries(allDataEntries);

    // Update cache
    if (useCache) {
      doorDataCache = { data: result, timestamp: Date.now() };
    }

    const responseTime = Date.now() - startTime;
    logger.info(`API response time: ${responseTime}ms`);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Response-Time': `${responseTime}ms`,
      },
    });
  } catch (error) {
    logger.error('Error processing API request:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
