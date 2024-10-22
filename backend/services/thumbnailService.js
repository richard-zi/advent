const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { ffmpeg } = require('../config/ffmpeg');
const logger = require('../utils/logger');
const paths = require('../config/paths');

class ThumbnailService {
  static thumbnailCache = new Map();

  static async generateThumbnail(filePath, type) {
    // Skip thumbnail generation for unsupported types
    if (!['video', 'image', 'gif'].includes(type)) {
      logger.info('Skipping thumbnail generation for type:', type);
      return null;
    }

    try {
      const filename = path.basename(filePath);
      const thumbnailPath = path.join(paths.thumbnailsDir, `thumb_${filename.split('.')[0]}.jpg`);

      if (await this.checkExistingThumbnail(thumbnailPath)) {
        return thumbnailPath;
      }

      logger.info('Generating new thumbnail for:', filename);

      if (type === 'video' || type === 'gif') {
        return this.generateMediaThumbnail(filePath, thumbnailPath);
      } else if (type === 'image') {
        return this.generateImageThumbnail(filePath, thumbnailPath);
      }
    } catch (error) {
      logger.error('Error in generateThumbnail:', error);
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
    const targetWidth = 500;
    const targetHeight = Math.round(targetWidth * (metadata.height / metadata.width));

    await sharp(filePath)
      .resize(targetWidth, targetHeight, { fit: 'fill' })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  static async processTemporaryFile(tempPath, finalPath) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const metadata = await sharp(tempPath).metadata();
      const targetWidth = 500;
      const targetHeight = Math.round(targetWidth * (metadata.height / metadata.width));

      await sharp(tempPath)
        .resize(targetWidth, targetHeight, { fit: 'fill' })
        .jpeg({ quality: 85 })
        .toFile(finalPath);

      // Try to delete temp file after processing
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (error) {
        logger.warn('Could not delete temporary file:', tempPath);
      }
    } catch (error) {
      logger.error('Error processing temporary file:', error);
      throw error;
    }
  }

  static async checkExistingThumbnail(thumbnailPath) {
    try {
      if (fs.existsSync(thumbnailPath)) {
        const metadata = await sharp(thumbnailPath).metadata();
        if (metadata.width && metadata.height) {
          logger.info('Using existing thumbnail:', thumbnailPath);
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
    logger.info('Thumbnail cache cleared');
  }
}

module.exports = ThumbnailService;