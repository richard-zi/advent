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

// Cache for door data (10 seconds TTL for faster settings updates)
let doorDataCache: { data: Record<string, DoorContent>; timestamp: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds

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

        // Prepare media content
        const mediaContent = MediaService.prepareMediaContent(
          filePath,
          fileType,
          doorStates,
          index
        );

        // Generate thumbnail for all content types
        let thumbnailUrl: string | null = null;
        const thumbnail = await ThumbnailService.generateThumbnail(
          filePath,
          mediaContent.type,
          index
        );
        if (thumbnail) {
          thumbnailUrl = `/thumbnails/${path.basename(thumbnail)}`;
        }

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
          data = `/api/media/${puzzleImageIndex}`;

            if (doorStates[index]?.win) {
              thumbnailUrl = data;
            }
            break;
          }
          default:
          data = `/api/media/${index}`;
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
