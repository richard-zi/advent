/**
 * @fileoverview /backend/middleware/errorHandler.js
 * Express Fehlerbehandlungs-Middleware
 * 
 * Zentrale Fehlerbehandlung für die Express-Anwendung.
 * Fängt alle Fehler ab und sendet eine einheitliche Fehlerantwort.
 */

const logger = require('../utils/logger');

/**
 * Express Fehlerbehandlungs-Middleware
 * @param {Error} err - Der aufgetretene Fehler
 * @param {Request} req - Express Request Objekt
 * @param {Response} res - Express Response Objekt
 * @param {Function} next - Express next Funktion
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Server Error:', err);
  
  // Sende detaillierte Fehlermeldungen nur in der Entwicklungsumgebung
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;