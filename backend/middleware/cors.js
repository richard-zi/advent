/**
 * @fileoverview /backend/middleware/cors.js
 * CORS (Cross-Origin Resource Sharing) Middleware-Konfiguration
 * 
 * Diese Datei konfiguriert die CORS-Einstellungen für die API.
 * CORS ist notwendig, um Anfragen von anderen Domains zu erlauben,
 * was besonders wichtig für die Frontend-Backend-Kommunikation ist.
 */

const cors = require('cors');
const config = require('../config/env');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

module.exports = cors(corsOptions);