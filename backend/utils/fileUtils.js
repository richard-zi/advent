/**
 * @fileoverview /backend/utils/fileUtils.js
 * Datei-Utilities
 * 
 * Diese Klasse stellt verschiedene Hilfsfunktionen für die Dateiverarbeitung bereit.
 * Sie enthält Methoden zur Typbestimmung und zum Management von Dateien.
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
      // Bildformate
      case '.png':
      case '.jpg':
      case '.jpeg':
        return 'image';
      // Animierte Bilder
      case '.gif':
        return 'gif';
      // Videoformate
      case '.mp4':
      case '.m4a':
      case '.mov':
        return 'video';
      // Audioformate
      case '.mp3':
      case '.ogg':
      case '.wav':
        return 'audio';
      // Textformate
      case '.txt':
      case '.md':
        return 'text';
      // Unbekannte Formate
      default:
        return 'unknown';
    }
  }

  /**
   * Räumt temporäre Dateien im Thumbnail-Verzeichnis auf
   * Diese Methode wird beim Serverstart ausgeführt
   */
  static cleanupTempFiles() {
    if (fs.existsSync(paths.thumbnailsDir)) {
      try {
        const files = fs.readdirSync(paths.thumbnailsDir);
        files.forEach(file => {
          // Lösche alle Dateien die '_temp' im Namen haben
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
   * Erstellt es bei Bedarf rekursiv
   * @param {string} dirPath - Pfad zum zu prüfenden Verzeichnis
   */
  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

module.exports = FileUtils;