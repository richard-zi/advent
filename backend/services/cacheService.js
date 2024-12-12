/**
 * @fileoverview Cache Service
 * Verwaltet das Cache-System und stellt Methoden zum Invalidieren des Caches bereit
 */

class CacheService {
  constructor() {
    this.lastCacheReset = Date.now();
  }

  // Gibt den Zeitstempel der letzten Cache-Invalidierung zurück
  getLastResetTimestamp() {
    return this.lastCacheReset;
  }

  // Setzt einen neuen Zeitstempel für Cache-Invalidierung
  invalidateCache() {
    this.lastCacheReset = Date.now();
    return this.lastCacheReset;
  }
}

// Singleton-Instanz
const cacheService = new CacheService();
module.exports = cacheService;