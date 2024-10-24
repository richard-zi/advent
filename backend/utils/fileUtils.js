/**
 * @fileoverview /backend/utils/fileUtils.js
 * Datei-Utilities
 * 
 * Stellt Hilfsfunktionen für die Dateiverarbeitung bereit.
 * Enthält Funktionen zur Typbestimmung und Dateiverwaltung.
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const paths = require('../config/paths');

class FileUtils {
  /**
   * Ermittelt den Dateityp anhand der Dateiendung
   * @param {string} filename - Name der zu prüfenden Datei
   * @returns {string} Der ermittelte Dateityp
   */
  static getFileType(filename) {
    const extension = path.extname(filename).toLowerCase();
    switch (extension) {
      case '.png':
      case '.jpg':
      case '.jpeg':
        return 'image';
      case '.gif':
        return 'gif';
      case '.mp4':
      case '.m4a':
      case '.mov':
        return 'video';
      case '.mp3':
      case '.ogg':
      case '.wav':
        return 'audio';
      case '.txt':
      case '.md':
        return 'text';
      default:
        return 'unknown';
    }
  }

  /**
   * Räumt temporäre Dateien im Thumbnail-Verzeichnis auf
   * Wird beim Serverstart ausgeführt
   */
  static cleanupTempFiles() {
    if (fs.existsSync(paths.thumbnailsDir)) {
      try {
        const files = fs.readdirSync(paths.thumbnailsDir);
        files.forEach(file => {
          if (file.includes('_temp')) {
            try {
              fs.unlinkSync(path.join(paths.thumbnailsDir, file));
              logger.info('Gelöschte temporäre Datei:', file);
            } catch (error) {
              logger.warn('Konnte temporäre Datei nicht löschen:', file);
            }
          }
        });
      } catch (error) {
        logger.error('Fehler beim Aufräumen temporärer Dateien:', error);
      }
    }
  }

  /**
   * Stellt sicher, dass ein Verzeichnis existiert
   * Erstellt es bei Bedarf
   * @param {string} dirPath - Pfad zum zu prüfenden Verzeichnis
   */
  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

module.exports = FileUtils;