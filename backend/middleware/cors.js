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

// Erstelle eine CORS-Middleware mit Konfiguration aus Umgebungsvariablen
const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

module.exports = corsMiddleware;