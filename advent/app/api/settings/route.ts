import { NextResponse } from 'next/server';
import { SettingsService } from '@/lib/services/settingsService';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
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
