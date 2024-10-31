/**
 * @fileoverview /backend/utils/logger.js
 * Logger-Utility
 * 
 * Diese Klasse stellt zentrale Logging-Funktionalität für die gesamte Anwendung bereit.
 * Sie bietet verschiedene Log-Level und berücksichtigt die aktuelle Umgebung (Development/Production).
 */

class Logger {
  /**
   * Loggt normale Informationsnachrichten
   * Wird für wichtige Ereignisse und Statusmeldungen verwendet
   * 
   * @param {...any} args - Die zu loggenden Informationen
   * Beispiel: Logger.info('Server gestartet', { port: 3000 });
   */
  static info(...args) {
    console.log(...args);
  }

  /**
   * Loggt Fehlermeldungen
   * Wird für kritische Fehler und Ausnahmen verwendet, die das System beeinträchtigen können
   * 
   * @param {...any} args - Die zu loggenden Fehlerinformationen
   * Beispiel: Logger.error('Datenbankverbindung fehlgeschlagen', error);
   */
  static error(...args) {
    console.error(...args);
  }

  /**
   * Loggt Warnungen
   * Wird für nicht-kritische Probleme verwendet, die aber Aufmerksamkeit erfordern
   * 
   * @param {...any} args - Die zu loggenden Warnungen
   * Beispiel: Logger.warn('Veraltete API-Version verwendet', { version: '1.0' });
   */
  static warn(...args) {
    console.warn(...args);
  }

  /**
   * Loggt Debug-Informationen
   * Diese werden nur in der Entwicklungsumgebung ausgegeben
   * 
   * @param {...any} args - Die zu loggenden Debug-Informationen
   * Beispiel: Logger.debug('API-Aufruf', { method: 'GET', path: '/api/user' });
   */
  static debug(...args) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  }
}

module.exports = Logger;