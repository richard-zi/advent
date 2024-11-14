/**
 * @fileoverview /backend/middleware/authMiddleware.js
 * Authentifizierungs-Middleware
 * 
 * Diese Middleware überprüft die Authentifizierung von Anfragen durch JWT-Token-Validierung.
 * Sie wird für geschützte Routen verwendet, die nur für authentifizierte Benutzer zugänglich sein sollen.
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

// Geheimschlüssel für JWT-Signierung und Verifizierung aus Umgebungsvariablen
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Express Middleware für die Token-basierte Authentifizierung
 * 
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 * @param {Function} next - Express next-Funktion
 * @returns {void}
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Überprüfe ob der Token abgelaufen ist
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ error: 'Token expired' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;