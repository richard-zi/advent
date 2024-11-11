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

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-Proto', 'X-Forwarded-Host'],
  credentials: true
});

module.exports = corsMiddleware;