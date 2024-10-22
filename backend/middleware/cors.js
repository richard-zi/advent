/**
 * @fileoverview /backend/middleware/cors.js
 * CORS Middleware Konfiguration
 * 
 * Konfiguriert Cross-Origin Resource Sharing (CORS) für die API.
 * Ermöglicht Zugriffe von anderen Domains auf die API.
 */

const cors = require('cors');

// Erstelle CORS-Middleware mit Standardkonfiguration
// In Produktion sollte dies weiter eingeschränkt werden
const corsMiddleware = cors();

module.exports = corsMiddleware;