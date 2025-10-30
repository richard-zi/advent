import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { MediaService } from '@/lib/services/mediaService';
import { PollService } from '@/lib/services/pollService';
import { ThumbnailService } from '@/lib/services/thumbnailService';
import { logger } from '@/lib/utils/logger';
import { paths } from '@/lib/config/paths';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const doorNumber = parseInt(formData.get('doorNumber') as string);
    const contentType = formData.get('contentType') as string;
    const text = formData.get('text') as string | null;
    const file = formData.get('file') as File | null;
    const countdownDateRaw = formData.get('countdownDate');
    const countdownTextRaw = formData.get('countdownText');
    const countdownDate =
      typeof countdownDateRaw === 'string' ? countdownDateRaw.trim() : null;
    const countdownText =
      typeof countdownTextRaw === 'string' ? countdownTextRaw : '';

    if (!doorNumber || doorNumber < 1 || doorNumber > 24) {
      return NextResponse.json({ error: 'Invalid door number' }, { status: 400 });
    }

    // Delete existing content if any (including thumbnails & polls)
    const medium = await MediaService.getAllDoors();
    if (medium[doorNumber]) {
      await ThumbnailService.deleteThumbnail(medium[doorNumber]);
      await MediaService.deleteContent(doorNumber);
      PollService.deletePoll(doorNumber);
    }

    // Handle different content types
    switch (contentType) {
      case 'text': {
        if (!text) {
          return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
        }
        await MediaService.saveTextContent(doorNumber, text);
        break;
      }

      case 'image':
      case 'gif':
      case 'video':
      case 'audio': {
        if (!file) {
          return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const extension = path.extname(file.name);
        const filename = `${doorNumber}${extension}`;
        const filePath = path.join(paths.mediaDir, filename);

        await fs.writeFile(filePath, buffer);
        await MediaService.saveMediaFile(doorNumber, filename);
        break;
      }

      case 'poll': {
        const question = formData.get('pollQuestion') as string;
        const optionsJson = formData.get('pollOptions') as string;

        if (!question || !optionsJson) {
          return NextResponse.json(
            { error: 'Poll question and options are required' },
            { status: 400 }
          );
        }

        const options = JSON.parse(optionsJson);
        PollService.savePollData(doorNumber, { question, options });
        await MediaService.savePollMarker(doorNumber);
        break;
      }

      case 'puzzle': {
        if (!file) {
          return NextResponse.json({ error: 'Puzzle image is required' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const extension = path.extname(file.name);
        const imageIndex = MediaService.getPuzzleImageIndex(doorNumber);
        const filename = `${imageIndex}${extension}`;
        const filePath = path.join(paths.mediaDir, filename);

        await fs.writeFile(filePath, buffer);
        await MediaService.savePuzzleData(doorNumber, filename);
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
        const url = formData.get('iframeUrl') as string;
        if (!url) {
          return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }
        await MediaService.saveIframeContent(doorNumber, url);
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Save message if provided
    if (text && contentType !== 'text' && contentType !== 'countdown') {
      await MediaService.updateMessage(doorNumber, text);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error uploading content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
