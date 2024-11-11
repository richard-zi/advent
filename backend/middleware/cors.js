/**
 * @fileoverview /backend/middleware/cors.js
 * CORS-Konfiguration für Reverse-Proxy Setup
 */

const cors = require('cors');
require('dotenv').config();

const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    
    // Erlaube Anfragen ohne Origin (z.B. vom Proxy)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true);  // Im Proxy-Setup erlauben wir zunächst alle Origins
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-Proto'],
  credentials: true,
  // Trust the X-Forwarded-Proto header from our reverse proxy
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-Proto', 'X-Forwarded-Host'],
});

module.exports = corsMiddleware;