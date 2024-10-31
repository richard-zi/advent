/**
 * @fileoverview /backend/middleware/errorHandler.js
 * Zentrale Fehlerbehandlungs-Middleware
 * 
 * Diese Middleware ist für die einheitliche Behandlung von Fehlern in der Express-Anwendung zuständig.
 * Sie fängt alle Fehler ab und formatiert sie in ein konsistentes Antwortformat.
 */

const logger = require('../utils/logger');

/**
 * Express Fehlerbehandlungs-Middleware
 * Diese Middleware wird automatisch aufgerufen, wenn Fehler in der Anwendung auftreten
 * 
 * @param {Error} err - Das Fehlerobjekt, das aufgetreten ist
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 * @param {Function} next - Express next-Funktion (wird hier nicht verwendet)
 */
const errorHandler = (err, req, res, next) => {
  // Logge den Fehler für Debugging und Monitoring
  logger.error('Server Error:', err);
  
  // Sende eine formatierte Fehlerantwort zurück
  // In der Entwicklungsumgebung werden detaillierte Fehlermeldungen gesendet
  // In der Produktion werden nur allgemeine Fehlermeldungen gezeigt
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;