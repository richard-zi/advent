import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/services/mediaService';
import { TimingService } from '@/lib/services/timingService';
import { logger } from '@/lib/utils/logger';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    index: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const index = parseInt(params.index);

    if (!TimingService.dateCheck(index)) {
      return new NextResponse('File is not available yet', { status: 423 });
    }

    const filePath = await MediaService.getMediaFile(index);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    logger.error('Error serving media file:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
