/**
 * @fileoverview /backend/middleware/cors.js
 * CORS Middleware Configuration
 */

const cors = require('cors');
require('dotenv').config();

const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  // Add these options to handle proxy
  exposedHeaders: ['Access-Control-Allow-Origin'],
  maxAge: 600 // Cache preflight requests for 10 minutes
});

module.exports = corsMiddleware;