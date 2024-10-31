/**
 * @fileoverview /backend/services/thumbnailService.js
 * Thumbnail-Service
 * 
 * Dieser Service ist für die Erstellung und Verwaltung von Vorschaubildern zuständig.
 * Er unterstützt die Generierung von Thumbnails für verschiedene Medientypen wie
 * Bilder, Videos und GIFs.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { ffmpeg } = require('../config/ffmpeg');
const logger = require('../utils/logger');
const paths = require('../config/paths');

class ThumbnailService {
  // Cache für bereits generierte Thumbnails zur Verbesserung der Performance
  static thumbnailCache = new Map();

  /**
   * Generiert ein Thumbnail für eine Mediendatei
   * @param {string} filePath - Pfad zur Originaldatei
   * @param {string} type - Medientyp (video, image, gif)
   * @returns {Promise<string|null>} Pfad zum generierten Thumbnail oder null bei Fehler
   */
  static async generateThumbnail(filePath, type) {
    // Überspringe nicht unterstützte Dateitypen
    if (!['video', 'image', 'gif', 'puzzle'].includes(type)) {
      logger.info('Skipping thumbnail generation for type:', type);
      return null;
    }

    try {
      const filename = path.basename(filePath);
      const thumbnailPath = path.join(paths.thumbnailsDir, `thumb_${filename.split('.')[0]}.jpg`);

      // Prüfe ob bereits ein gültiges Thumbnail existiert
      if (await this.checkExistingThumbnail(thumbnailPath)) {
        return thumbnailPath;
      }

      logger.info('Generiere neues Thumbnail für:', filename);

      if(type === 'puzzle'){
        return fs.copyFileSync(path.join(paths.assetDir, "puzzle.jpg"), path.join(paths.thumbnailsDir,  `thumb_${filename.split('.')[0]}.jpg`))
      }
      if (type === 'video' || type === 'gif') {
        return this.generateMediaThumbnail(filePath, thumbnailPath);
      } else if (type === 'image') {
        return this.generateImageThumbnail(filePath, thumbnailPath);
      }
    } catch (error) {
      logger.error('Fehler bei der Thumbnail-Generierung:', error);
      return null;
    }
  }

  /**
   * Generiert ein Thumbnail für Video- oder GIF-Dateien
   * @private
   * @param {string} filePath - Pfad zur Originaldatei
   * @param {string} thumbnailPath - Zielpfad für das Thumbnail
   * @returns {Promise<string>} Pfad zum generierten Thumbnail
   */
  static async generateMediaThumbnail(filePath, thumbnailPath) {
    return new Promise((resolve, reject) => {
      const tempPath = thumbnailPath.replace('.jpg', '_temp.jpg');

      ffmpeg(filePath)
        .screenshots({
          timestamps: ['00:00:01.000'],
          filename: path.basename(tempPath),
          folder: path.dirname(tempPath),
        })
        .on('end', async () => {
          try {
            await this.processTemporaryFile(tempPath, thumbnailPath);
            resolve(thumbnailPath);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', reject);
    });
  }

  /**
   * Generiert ein Thumbnail für Bilddateien
   * @private
   * @param {string} filePath - Pfad zur Originaldatei
   * @param {string} thumbnailPath - Zielpfad für das Thumbnail
   * @returns {Promise<string>} Pfad zum generierten Thumbnail
   */
  static async generateImageThumbnail(filePath, thumbnailPath) {
    const metadata = await sharp(filePath).metadata();
    const targetWidth = 500;
    const targetHeight = Math.round(targetWidth * (metadata.height / metadata.width));

    await sharp(filePath)
      .resize(targetWidth, targetHeight, { fit: 'fill' })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  /**
   * Verarbeitet temporäre Dateien zu finalen Thumbnails
   * @private
   * @param {string} tempPath - Pfad zur temporären Datei
   * @param {string} finalPath - Zielpfad für das finale Thumbnail
   */
  static async processTemporaryFile(tempPath, finalPath) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const metadata = await sharp(tempPath).metadata();
      const targetWidth = 500;
      const targetHeight = Math.round(targetWidth * (metadata.height / metadata.width));

      // Generiere das finale Thumbnail
      await sharp(tempPath)
        .resize(targetWidth, targetHeight, { fit: 'fill' })
        .jpeg({ quality: 85 })
        .toFile(finalPath);

      // Versuche die temporäre Datei zu löschen
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (error) {
        logger.warn('Konnte temporäre Datei nicht löschen:', tempPath);
      }
    } catch (error) {
      logger.error('Fehler bei der Verarbeitung der temporären Datei:', error);
      throw error;
    }
  }

  /**
   * Prüft ob ein gültiges Thumbnail bereits existiert
   * @private
   * @param {string} thumbnailPath - Pfad zum zu prüfenden Thumbnail
   * @returns {Promise<boolean>} True wenn ein gültiges Thumbnail existiert
   */
  static async checkExistingThumbnail(thumbnailPath) {
    try {
      if (fs.existsSync(thumbnailPath)) {
        const metadata = await sharp(thumbnailPath).metadata();
        if (metadata.width && metadata.height) {
          logger.info('Verwende existierendes Thumbnail:', thumbnailPath);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Leert den Thumbnail-Cache
   */
  static clearCache() {
    this.thumbnailCache.clear();
    logger.info('Thumbnail-Cache geleert');
  }
}

module.exports = ThumbnailService;