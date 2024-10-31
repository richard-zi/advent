/**
 * @fileoverview /backend/config/paths.js
 * Pfad-Konfigurationsdatei
 * 
 * Zentrale Verwaltung aller wichtigen Dateipfade der Anwendung.
 * Verwendet path.resolve für absolute Pfade ausgehend vom Projektroot.
 */

const path = require('path');

// Definiere Basispfade der Anwendung
const rootDir = path.resolve(__dirname, '..');  // Ein Verzeichnis über config/
const mediaDir = path.join(rootDir, 'media');  // Speicherort für Medieninhalte
const thumbnailsDir = path.join(rootDir, 'thumbnails');  // Speicherort für generierte Thumbnails
const messagesDir = path.join(rootDir, 'messages');  // Speicherort für zusätzliche Nachrichtendateien
const assetDir = path.join(rootDir, 'assets');

module.exports = {
  rootDir,
  mediaDir,
  thumbnailsDir,
  messagesDir,
  assetDir
};