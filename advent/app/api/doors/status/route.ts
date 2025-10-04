import { NextResponse } from 'next/server';
import { TimingService } from '@/lib/services/timingService';
import { MediaService } from '@/lib/services/mediaService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const allDoors = await MediaService.getAllDoors();
    const doorStatus: Record<number, { hasContent: boolean; isAvailable: boolean; type: string }> = {};

    for (let day = 1; day <= 24; day++) {
      const hasContent = allDoors[day] !== undefined;
      const isAvailable = TimingService.dateCheck(day);

      doorStatus[day] = {
        hasContent,
        isAvailable,
        type: hasContent && isAvailable ? 'locked' : 'not available yet'
      };
    }

    return NextResponse.json(doorStatus, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    logger.error('Error fetching door status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch door status' },
      { status: 500 }
    );
  }
}
