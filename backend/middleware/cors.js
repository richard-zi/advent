/**
 * @fileoverview /backend/middleware/cors.js
 * CORS (Cross-Origin Resource Sharing) Middleware-Konfiguration
 * 
 * Diese Datei konfiguriert die CORS-Einstellungen für die API.
 * CORS ist notwendig, um Anfragen von anderen Domains zu erlauben,
 * was besonders wichtig für die Frontend-Backend-Kommunikation ist.
 */

const cors = require('cors');

// Erstelle eine CORS-Middleware mit Standardkonfiguration
// WICHTIG: In der Produktionsumgebung sollten die CORS-Einstellungen
// restriktiver sein und nur spezifische Domains zulassen
const corsMiddleware = cors();

// Alternativ könnte man auch eine spezifischere Konfiguration verwenden:
/*
const corsMiddleware = cors({
  origin: ['http://localhost:3000', 'https://ihre-produktions-domain.de'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
*/

module.exports = corsMiddleware;