import { SettingsService } from './settingsService';

export class TimingService {
  private static readonly LOOP_AROUND = 1000;

  static getStartDay(): Date {
    return SettingsService.getStartDate();
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static dateCheck(index: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Handle puzzle images (index > 1000)
    const actualIndex = index >= this.LOOP_AROUND ? index - this.LOOP_AROUND : index;

    // Calculate the date when this door should be available
    const startDay = this.getStartDay();
    const availableDate = this.addDays(startDay, actualIndex - 1);
    availableDate.setHours(0, 0, 0, 0);

    return today >= availableDate;
  }

  static getDayNumber(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(this.getStartDay());
    start.setHours(0, 0, 0, 0);

    const diff = today.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(1, Math.min(24, days));
  }
}
