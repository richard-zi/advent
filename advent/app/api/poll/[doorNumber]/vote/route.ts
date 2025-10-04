import { NextRequest, NextResponse } from 'next/server';
import { PollService } from '@/lib/services/pollService';
import { TimingService } from '@/lib/services/timingService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    doorNumber: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const doorNumber = parseInt(params.doorNumber);
    const body = await request.json();
    const { option, userId } = body;

    if (!option || !userId) {
      return NextResponse.json(
        { error: 'Option or userId missing' },
        { status: 400 }
      );
    }

    if (!TimingService.dateCheck(doorNumber)) {
      return NextResponse.json(
        { error: 'Poll is not available yet' },
        { status: 423 }
      );
    }

    const pollData = PollService.getPollData(doorNumber);
    if (!pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (!pollData.options.includes(option)) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
    }

    const result = PollService.vote(doorNumber, option, userId);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Error recording vote' },
      { status: 500 }
    );
  }
}
