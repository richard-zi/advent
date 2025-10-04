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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const doorNumber = parseInt(params.doorNumber);

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

    const votes = PollService.getVotes(doorNumber);
    const userId = request.nextUrl.searchParams.get('userId');
    const userVote = PollService.getUserVote(doorNumber, userId);

    return NextResponse.json({
      pollData,
      votes,
      userVote,
    });
  } catch (error) {
    logger.error('Error fetching poll data:', error);
    return NextResponse.json(
      { error: 'Error fetching poll data' },
      { status: 500 }
    );
  }
}
