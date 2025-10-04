export class CacheService {
  private static lastResetTimestamp = Date.now();

  static getLastResetTimestamp(): number {
    return this.lastResetTimestamp;
  }

  static invalidateCache(): void {
    this.lastResetTimestamp = Date.now();
  }
}
