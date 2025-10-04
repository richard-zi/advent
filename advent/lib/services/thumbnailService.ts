import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { paths } from '../config/paths';
import type { FileType } from '../utils/fileUtils';

export class ThumbnailService {
  private static thumbnailCache = new Map<string, string>();
  private static targetWidth = env.thumbnailWidth;
  private static quality = env.thumbnailQuality;

  static async generateThumbnail(
    filePath: string,
    type: FileType | 'puzzle'
  ): Promise<string | null> {
    if (!['video', 'image', 'gif', 'puzzle'].includes(type)) {
      logger.info('Skipping thumbnail generation for type:', type);
      return null;
    }

    try {
      const filename = path.basename(filePath);
      const thumbnailPath = path.join(
        paths.thumbnailsDir,
        `thumb_${filename.split('.')[0]}.jpg`
      );

      if (await this.checkExistingThumbnail(thumbnailPath)) {
        return thumbnailPath;
      }

      logger.info('Generiere neues Thumbnail für:', filename);

      if (type === 'puzzle') {
        const puzzleAsset = path.join(paths.assetDir, 'puzzle.jpg');
        if (fs.existsSync(puzzleAsset)) {
          fs.copyFileSync(puzzleAsset, thumbnailPath);
          return thumbnailPath;
        }
        return null;
      }

      if (type === 'video' || type === 'gif') {
        return this.generateMediaThumbnail(filePath, thumbnailPath);
      } else if (type === 'image') {
        return this.generateImageThumbnail(filePath, thumbnailPath);
      }

      return null;
    } catch (error) {
      logger.error('Fehler bei der Thumbnail-Generierung:', error);
      return null;
    }
  }

  static async generateMediaThumbnail(
    filePath: string,
    thumbnailPath: string
  ): Promise<string> {
    // Check if FFmpeg is available
    if (!env.ffmpegPath || !env.ffprobePath) {
      logger.warn('FFmpeg nicht konfiguriert, überspringe Video/GIF-Thumbnail');
      return thumbnailPath; // Return path anyway, will fail gracefully
    }

    return new Promise((resolve, reject) => {
      const tempPath = thumbnailPath.replace('.jpg', '_temp.jpg');

      // Set ffmpeg and ffprobe paths
      ffmpeg.setFfmpegPath(env.ffmpegPath);
      ffmpeg.setFfprobePath(env.ffprobePath);

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
        .on('error', (err) => {
          logger.error('FFmpeg error:', err);
          resolve(thumbnailPath); // Resolve anyway to prevent API failure
        });
    });
  }

  static async generateImageThumbnail(
    filePath: string,
    thumbnailPath: string
  ): Promise<string> {
    const metadata = await sharp(filePath).metadata();
    const targetHeight = Math.round(
      this.targetWidth * ((metadata.height || 500) / (metadata.width || 500))
    );

    await sharp(filePath)
      .resize(this.targetWidth, targetHeight, { fit: 'fill' })
      .jpeg({ quality: this.quality })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  static async processTemporaryFile(
    tempPath: string,
    finalPath: string
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const metadata = await sharp(tempPath).metadata();
      const targetHeight = Math.round(
        this.targetWidth * ((metadata.height || 500) / (metadata.width || 500))
      );

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

  static async checkExistingThumbnail(thumbnailPath: string): Promise<boolean> {
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

  static clearCache(): void {
    this.thumbnailCache.clear();
    logger.info('Thumbnail-Cache geleert');
  }

  static async deleteThumbnail(filename: string): Promise<void> {
    try {
      const thumbnailPath = path.join(
        paths.thumbnailsDir,
        `thumb_${filename.split('.')[0]}.jpg`
      );
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        logger.info('Thumbnail gelöscht:', thumbnailPath);
      }
    } catch (error) {
      logger.error('Fehler beim Löschen des Thumbnails:', error);
    }
  }
}
