import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/services/mediaService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { TimingService } from '@/lib/services/timingService';
import { PollService } from '@/lib/services/pollService';
import { FileUtils } from '@/lib/utils/fileUtils';
import { paths } from '@/lib/config/paths';
import { logger } from '@/lib/utils/logger';
import path from 'path';
import type { DoorContent } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { doorNumber: string } }
) {
  try {
    const doorNumber = parseInt(params.doorNumber);

    if (!doorNumber || doorNumber < 1 || doorNumber > 24) {
      return NextResponse.json(
        { error: 'Invalid door number' },
        { status: 400 }
      );
    }

    // Security check: Is this door available today?
    const isAvailable = TimingService.dateCheck(doorNumber);

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Door not yet available' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const doorStatesParam = searchParams.get('doorStates');
    const doorStates = doorStatesParam ? JSON.parse(doorStatesParam) : {};

    // Get medium.json
    const allDoors = await MediaService.getAllDoors();

    if (!allDoors[doorNumber]) {
      return NextResponse.json({
        type: 'not available yet',
        data: null,
        text: null,
        thumbnailLight: null,
        thumbnailDark: null,
        meta: null,
      } as DoorContent);
    }

    const filename = allDoors[doorNumber];
    const filePath = path.join(paths.mediaDir, filename);

    if (!FileUtils.fileExists(filePath)) {
      return NextResponse.json({
        type: 'not available yet',
        data: null,
        text: null,
        thumbnailLight: null,
        thumbnailDark: null,
        meta: null,
      } as DoorContent);
    }

    const fileType = FileUtils.getFileType(filename);
    const mediaContent = MediaService.prepareMediaContent(
      filePath,
      fileType,
      doorStates,
      doorNumber
    );

    let thumbnailLight: string | null = null;
    let thumbnailDark: string | null = null;
    const meta = mediaContent.meta ?? null;
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

    // Handle poll data
    if (mediaContent.type === 'poll') {
      const pollData = PollService.getPollData(doorNumber);
      const pollVotes = PollService.getVotes(doorNumber);

      return NextResponse.json({
        type: mediaContent.type,
        data: JSON.stringify({ question: pollData, votes: pollVotes }),
        text: message,
        thumbnailLight,
        thumbnailDark,
        meta,
      } as DoorContent, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      });
    }

    return NextResponse.json({
      type: mediaContent.type,
      data: mediaContent.data || null,
      text: message,
      thumbnailLight,
      thumbnailDark,
      meta,
      isSolved: mediaContent.type === 'puzzle'
        ? Boolean(doorStates[doorNumber]?.win)
        : undefined,
    } as DoorContent, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    logger.error(`Error fetching door ${params.doorNumber}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
