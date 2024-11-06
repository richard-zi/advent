/**
 * @fileoverview /backend/config/env.js
 * Environment Variables Loader
 * 
 * Diese Datei lädt und validiert alle benötigten Umgebungsvariablen beim Serverstart.
 * Sie stellt sicher, dass alle erforderlichen Variablen vorhanden sind und setzt
 * Standardwerte für optionale Variablen.
 */

require('dotenv').config();
const logger = require('../utils/logger');

// Prüfe ob erforderliche Umgebungsvariablen vorhanden sind
const requiredEnvVars = [
  'JWT_SECRET',
  'FFMPEG_PATH',
  'FFPROBE_PATH',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];

// Prüfe die erforderlichen Umgebungsvariablen
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  logger.error('Fehlende erforderliche Umgebungsvariablen:', missingEnvVars);
  process.exit(1);
}

// Setze Standardwerte für optionale Variablen
const config = {
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  ffmpegPath: process.env.FFMPEG_PATH,
  ffprobePath: process.env.FFPROBE_PATH,
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800,
  thumbnailWidth: parseInt(process.env.THUMBNAIL_WIDTH) || 500,
  thumbnailQuality: parseInt(process.env.THUMBNAIL_QUALITY) || 85
};

module.exports = config;