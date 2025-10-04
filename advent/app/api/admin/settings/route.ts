import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/services/settingsService';
import { verifyAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = SettingsService.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    SettingsService.saveSettings(body);

    return NextResponse.json({ success: true, settings: body });
  } catch (error) {
    logger.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
