import fs from 'fs';
import path from 'path';
import { paths } from '../config/paths';
import { logger } from '../utils/logger';

export interface CalendarSettings {
  startDate: string; // ISO date string
  title: string;
  description: string;
}

const SETTINGS_FILE = path.join(paths.dataDir, 'settings.json');

const DEFAULT_SETTINGS: CalendarSettings = {
  startDate: '2024-12-01',
  title: 'Adventskalender 2024',
  description: 'Öffne jeden Tag ein neues Türchen und entdecke die Überraschung! 🎁',
};

export class SettingsService {
  static getSettings(): CalendarSettings {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
      }

      // Create default settings if not exists
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (error) {
      logger.error('Error reading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: CalendarSettings): void {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(paths.dataDir)) {
        fs.mkdirSync(paths.dataDir, { recursive: true });
      }

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
      logger.info('Settings saved successfully');
    } catch (error) {
      logger.error('Error saving settings:', error);
      throw error;
    }
  }

  static getStartDate(): Date {
    const settings = this.getSettings();
    return new Date(settings.startDate);
  }
}
