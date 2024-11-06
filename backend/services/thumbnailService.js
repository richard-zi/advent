/**
 * @fileoverview /backend/services/thumbnailService.js
 * Thumbnail-Service (Fortsetzung)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { ffmpeg } = require('../config/ffmpeg');
const logger = require('../utils/logger');
const paths = require('../config/paths');
require('dotenv').config();

class ThumbnailService {
  static thumbnailCache = new Map();
  static targetWidth = parseInt(process.env.THUMBNAIL_WIDTH) || 500;
  static quality = parseInt(process.env.THUMBNAIL_QUALITY) || 85;

  static async generateThumbnail(filePath, type) {
    if (!['video', 'image', 'gif', 'puzzle'].includes(type)) {
      logger.info('Skipping thumbnail generation for type:', type);
      return null;
    }

    try {
      const filename = path.basename(filePath);
      const thumbnailPath = path.join(paths.thumbnailsDir, `thumb_${filename.split('.')[0]}.jpg`);

      if (await this.checkExistingThumbnail(thumbnailPath)) {
        return thumbnailPath;
      }

      logger.info('Generiere neues Thumbnail für:', filename);

      if(type === 'puzzle'){
        return fs.copyFileSync(path.join(paths.assetDir, "puzzle.jpg"), thumbnailPath);
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

  static async generateImageThumbnail(filePath, thumbnailPath) {
    const metadata = await sharp(filePath).metadata();
    const targetHeight = Math.round(this.targetWidth * (metadata.height / metadata.width));

    await sharp(filePath)
      .resize(this.targetWidth, targetHeight, { fit: 'fill' })
      .jpeg({ quality: this.quality })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  static async processTemporaryFile(tempPath, finalPath) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const metadata = await sharp(tempPath).metadata();
      const targetHeight = Math.round(this.targetWidth * (metadata.height / metadata.width));

      await sharp(tempPath)
        .resize(this.targetWidth, targetHeight, { fit: 'fill' })
        .jpeg({ quality: this.quality })
        .toFile(finalPath);

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

  static clearCache() {
    this.thumbnailCache.clear();
    logger.info('Thumbnail-Cache geleert');
  }
}

module.exports = ThumbnailService;