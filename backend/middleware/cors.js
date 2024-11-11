/**
 * @fileoverview /backend/middleware/cors.js
 * CORS (Cross-Origin Resource Sharing) Middleware-Konfiguration
 * 
 * Diese Datei konfiguriert die CORS-Einstellungen für die API.
 * CORS ist notwendig, um Anfragen von anderen Domains zu erlauben,
 * was besonders wichtig für die Frontend-Backend-Kommunikation ist.
 */

const cors = require('cors');
require('dotenv').config();

// Erstelle eine CORS-Middleware mit erweiterter Konfiguration
const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Convert HTTP origins to HTTPS if they match our allowed domains
    const secureOrigin = origin.replace('http:', 'https:');
    const originalOrigin = origin.replace('https:', 'http:');

    if (allowedOrigins.includes(origin) || 
        allowedOrigins.includes(secureOrigin) || 
        allowedOrigins.includes(originalOrigin) ||
        origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
});

module.exports = corsMiddleware;