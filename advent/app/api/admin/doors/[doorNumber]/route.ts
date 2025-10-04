import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { MediaService } from '@/lib/services/mediaService';
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

    const doorNumber = parseInt(params.doorNumber);

    if (!doorNumber || doorNumber < 1 || doorNumber > 24) {
      return NextResponse.json({ error: 'Invalid door number' }, { status: 400 });
    }

    const success = await MediaService.deleteContent(doorNumber);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
  } catch (error) {
    logger.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
