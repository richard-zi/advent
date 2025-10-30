import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { MediaService } from '@/lib/services/mediaService';
import { PollService } from '@/lib/services/pollService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { CacheService } from '@/lib/services/cacheService';
import { logger } from '@/lib/utils/logger';
import { paths } from '@/lib/config/paths';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params?: {
    doorNumber?: string;
  };
}

async function handler(request: NextRequest, context: RouteParams = {}) {
  try {
    const doorParam = context.params?.doorNumber;
    if (!doorParam) {
      return NextResponse.json(
        { error: 'Door number is required' },
        { status: 400 }
      );
    }

    const doorNumber = parseInt(doorParam, 10);
    if (Number.isNaN(doorNumber)) {
      return NextResponse.json(
        { error: 'Door number must be numeric' },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const contentType = formData.get('contentType') as string;
    const message = formData.get('message') as string | null;
    const countdownDateRaw = formData.get('countdownDate');
    const countdownTextRaw = formData.get('countdownText');
    const countdownDate =
      typeof countdownDateRaw === 'string' ? countdownDateRaw.trim() : null;
    const countdownText =
      typeof countdownTextRaw === 'string' ? countdownTextRaw : '';

    // Delete old content first (including thumbnails)
    const medium = await MediaService.getAllDoors();
    if (medium[doorNumber]) {
      const oldFilename = medium[doorNumber];
      await ThumbnailService.deleteThumbnail(oldFilename);
      await MediaService.deleteContent(doorNumber);
      PollService.deletePoll(doorNumber);
    }

    // Handle different content types
    switch (contentType) {
      case 'text': {
        const textContent = formData.get('textContent') as string;
        await MediaService.saveTextContent(doorNumber, textContent);
        break;
      }

      case 'poll': {
        const question = formData.get('question') as string;
        const optionsJson = formData.get('options') as string;
        const options = JSON.parse(optionsJson);

        PollService.savePollData(doorNumber, { question, options });
        await MediaService.savePollMarker(doorNumber);
        break;
      }

      case 'countdown': {
        if (!countdownDate || !/^\d{4}-\d{2}-\d{2}$/.test(countdownDate)) {
          return NextResponse.json(
            { error: 'Countdown date is required in format YYYY-MM-DD' },
            { status: 400 }
          );
        }
        await MediaService.saveCountdownContent(doorNumber, {
          targetDate: countdownDate,
          text: countdownText,
        });
        break;
      }

      case 'iframe': {
        const url = formData.get('url') as string;
        await MediaService.saveIframeContent(doorNumber, url);
        break;
      }

      case 'puzzle': {
        const file = formData.get('file') as File;
        if (!file) {
          return NextResponse.json(
            { error: 'No file provided' },
            { status: 400 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name);
        const puzzleImageIndex = MediaService.getPuzzleImageIndex(doorNumber);
        const filename = `${puzzleImageIndex}${ext}`;
        const filePath = path.join(paths.mediaDir, filename);

        await fs.writeFile(filePath, buffer);
        await MediaService.savePuzzleData(doorNumber, filename);
        break;
      }

      case 'image':
      case 'video':
      case 'audio':
      case 'gif': {
        const file = formData.get('file') as File;
        if (!file) {
          return NextResponse.json(
            { error: 'No file provided' },
            { status: 400 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name);
        const filename = `${doorNumber}${ext}`;
        const filePath = path.join(paths.mediaDir, filename);

        await fs.writeFile(filePath, buffer);
        await MediaService.saveMediaFile(doorNumber, filename);
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 400 }
        );
    }

    // Save message if provided
    if (message && contentType !== 'countdown') {
      await MediaService.updateMessage(doorNumber, message);
    }

    // Invalidate cache
    CacheService.invalidateCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error uploading content:', error);
    return NextResponse.json(
      { error: 'Failed to upload content' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
