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
    // Extrahiere den Authorization-Header
    const authHeader = req.headers.authorization;
    
    // Prüfe ob der Authorization-Header existiert und korrekt formatiert ist
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Extrahiere und verifiziere das JWT-Token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Füge decodierte Benutzerinformationen zum Request-Objekt hinzu
    req.user = decoded;
    
    // Fahre mit der Request-Verarbeitung fort
    next();
  } catch (error) {
    // Logge Authentifizierungsfehler für Debugging-Zwecke
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;