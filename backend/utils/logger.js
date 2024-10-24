/**
 * @fileoverview /backend/utils/logger.js
 * Logger Utility
 * 
 * Zentraler Logger für die Anwendung.
 * Bietet verschiedene Log-Level und berücksichtigt die Umgebung (Development/Production).
 */

class Logger {
    /**
     * Loggt normale Informationsnachrichten
     * @param {...any} args - Die zu loggenden Informationen
     */
    static info(...args) {
      console.log(...args);
    }
  
    /**
     * Loggt Fehlermeldungen
     * @param {...any} args - Die zu loggenden Fehlerinformationen
     */
    static error(...args) {
      console.error(...args);
    }
  
    /**
     * Loggt Warnungen
     * @param {...any} args - Die zu loggenden Warnungen
     */
    static warn(...args) {
      console.warn(...args);
    }
  
    /**
     * Loggt Debug-Informationen (nur in Entwicklungsumgebung)
     * @param {...any} args - Die zu loggenden Debug-Informationen
     */
    static debug(...args) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(...args);
      }
    }
  }
  
  module.exports = Logger;