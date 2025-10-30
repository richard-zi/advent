import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { createCanvas } from '@napi-rs/canvas';
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
    type: FileType | 'puzzle',
    doorNumber?: number
  ): Promise<string | null> {
    try {
      const filename = path.basename(filePath);
      const identifier = doorNumber || filename.split('.')[0];
      const thumbnailPath = path.join(
        paths.thumbnailsDir,
        `thumb_${identifier}.jpg`
      );

      if (await this.checkExistingThumbnail(thumbnailPath)) {
        return thumbnailPath;
      }

      logger.info('Generiere neues Thumbnail für:', filename, 'Typ:', type);

      switch (type) {
        case 'puzzle':
          return await this.generatePuzzleThumbnail(thumbnailPath);
        case 'video':
        case 'gif':
          return await this.generateMediaThumbnail(filePath, thumbnailPath);
        case 'image':
          return await this.generateImageThumbnail(filePath, thumbnailPath);
        case 'text':
          return await this.generateTextThumbnail(filePath, thumbnailPath);
        case 'poll':
          return await this.generatePollThumbnail(doorNumber!, thumbnailPath);
        case 'audio':
          return await this.generateAudioThumbnail(filePath, thumbnailPath);
        case 'countdown':
          return await this.generateCountdownThumbnail(thumbnailPath);
        case 'iframe':
          return await this.generateIframeThumbnail(filePath, thumbnailPath);
        default:
          logger.info('Kein Thumbnail-Generator für Typ:', type);
          return null;
      }
    } catch (error) {
      logger.error('Fehler bei der Thumbnail-Generierung:', error);
      return null;
    }
  }

  static async generatePuzzleThumbnail(thumbnailPath: string): Promise<string | null> {
    const puzzleAsset = path.join(paths.assetDir, 'puzzle.jpg');
    if (fs.existsSync(puzzleAsset)) {
      fs.copyFileSync(puzzleAsset, thumbnailPath);
      return thumbnailPath;
    }
    return null;
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

  // Helper function to strip markdown syntax from text
  private static stripMarkdown(text: string): string {
    return text
      // Remove headers (# ## ### etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold and italic (**text** or __text__ or *text* or _text_)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove links [text](url)
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove inline code `code`
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks ```code```
      .replace(/```[\s\S]*?```/g, '')
      // Remove blockquotes >
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules (---, ___, ***)
      .replace(/^[-_*]{3,}\s*$/gm, '')
      // Remove list markers (-, *, +, 1., 2., etc.)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Remove extra whitespace and newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // New thumbnail generation methods for all content types

  static async generateTextThumbnail(
    filePath: string,
    thumbnailPath: string
  ): Promise<string | null> {
    try {
      const textContent = fs.readFileSync(filePath, 'utf-8');
      const cleanText = this.stripMarkdown(textContent);
      const preview = cleanText.substring(0, 250); // First 250 characters of clean text

      const canvas = createCanvas(500, 500);
      const ctx = canvas.getContext('2d');

      // Christmas gradient background
      const gradient = ctx.createLinearGradient(0, 0, 500, 500);
      gradient.addColorStop(0, '#c1272d');
      gradient.addColorStop(1, '#228b22');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 500, 500);

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, 500, 500);

      // Text rendering
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📝 Text', 250, 60);

      // Content preview with word wrap
      ctx.font = '18px sans-serif';
      this.wrapText(ctx, preview, 250, 120, 440, 26);

      const buffer = canvas.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPath, buffer);

      return thumbnailPath;
    } catch (error) {
      logger.error('Fehler bei Text-Thumbnail:', error);
      return null;
    }
  }

  static async generatePollThumbnail(
    doorNumber: number,
    thumbnailPath: string
  ): Promise<string | null> {
    try {
      // Read poll data
      const pollDataPath = path.join(paths.dataDir, 'polls', 'pollData.json');
      if (!fs.existsSync(pollDataPath)) {
        return null;
      }

      const pollData = JSON.parse(fs.readFileSync(pollDataPath, 'utf-8'));
      const poll = pollData[doorNumber];

      if (!poll) {
        return null;
      }

      const canvas = createCanvas(500, 500);
      const ctx = canvas.getContext('2d');

      // Christmas gradient background
      const gradient = ctx.createLinearGradient(0, 0, 500, 500);
      gradient.addColorStop(0, '#228b22');
      gradient.addColorStop(1, '#c1272d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 500, 500);

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, 500, 500);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📊 Umfrage', 250, 60);

      // Poll question with word wrap
      ctx.font = 'bold 22px sans-serif';
      this.wrapText(ctx, poll.question, 250, 120, 440, 32);

      // Options (shortened)
      ctx.font = '16px sans-serif';
      let yPos = 280;
      poll.options.slice(0, 4).forEach((option: string, index: number) => {
        const shortOption = option.length > 35 ? option.substring(0, 35) + '...' : option;
        ctx.fillText(`${index + 1}. ${shortOption}`, 250, yPos);
        yPos += 30;
      });

      const buffer = canvas.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPath, buffer);

      return thumbnailPath;
    } catch (error) {
      logger.error('Fehler bei Poll-Thumbnail:', error);
      return null;
    }
  }

  static async generateAudioThumbnail(
    filePath: string,
    thumbnailPath: string
  ): Promise<string | null> {
    try {
      const canvas = createCanvas(500, 500);
      const ctx = canvas.getContext('2d');

      // Christmas gradient background
      const gradient = ctx.createLinearGradient(0, 0, 500, 500);
      gradient.addColorStop(0, '#ffd700');
      gradient.addColorStop(1, '#c1272d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 500, 500);

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, 500, 500);

      // Music note icon (simplified)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎵', 250, 280);

      // Title
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('Audio', 250, 380);

      const buffer = canvas.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPath, buffer);

      return thumbnailPath;
    } catch (error) {
      logger.error('Fehler bei Audio-Thumbnail:', error);
      return null;
    }
  }

  static async generateCountdownThumbnail(
    thumbnailPath: string
  ): Promise<string | null> {
    try {
      const canvas = createCanvas(500, 500);
      const ctx = canvas.getContext('2d');

      // Christmas gradient background
      const gradient = ctx.createLinearGradient(0, 0, 500, 500);
      gradient.addColorStop(0, '#c1272d');
      gradient.addColorStop(1, '#ffd700');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 500, 500);

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, 500, 500);

      // Clock icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏱️', 250, 230);

      // Title
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('Christmas', 250, 320);
      ctx.fillText('Countdown', 250, 370);

      const buffer = canvas.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPath, buffer);

      return thumbnailPath;
    } catch (error) {
      logger.error('Fehler bei Countdown-Thumbnail:', error);
      return null;
    }
  }

  static async generateIframeThumbnail(
    filePath: string,
    thumbnailPath: string
  ): Promise<string | null> {
    try {
      const iframeUrl = fs.readFileSync(filePath, 'utf-8').trim();

      // Try to extract YouTube video ID
      const youtubeMatch = iframeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);

      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        const ytThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        try {
          // Download YouTube thumbnail
          const response = await fetch(ytThumbnailUrl);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            // Resize to standard dimensions
            await sharp(buffer)
              .resize(this.targetWidth, null, { fit: 'cover' })
              .jpeg({ quality: this.quality })
              .toFile(thumbnailPath);
            return thumbnailPath;
          }
        } catch (err) {
          logger.warn('YouTube-Thumbnail konnte nicht geladen werden, verwende Fallback');
        }
      }

      // Fallback: Generic iframe thumbnail
      const canvas = createCanvas(500, 500);
      const ctx = canvas.getContext('2d');

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 500, 500);
      gradient.addColorStop(0, '#228b22');
      gradient.addColorStop(1, '#ffd700');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 500, 500);

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, 500, 500);

      // Frame icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🖼️', 250, 280);

      // Title
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('Iframe', 250, 380);

      const buffer = canvas.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPath, buffer);

      return thumbnailPath;
    } catch (error) {
      logger.error('Fehler bei Iframe-Thumbnail:', error);
      return null;
    }
  }

  // Helper function for text wrapping
  private static wrapText(
    ctx: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const maxLines = 8; // Limit to 8 lines
    let lineCount = 0;

    for (let i = 0; i < words.length && lineCount < maxLines; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }

    if (lineCount < maxLines && line.trim()) {
      // Add ellipsis if text was cut off
      const finalLine = lineCount === maxLines - 1 && words.length > maxLines * 5 ? line + '...' : line;
      ctx.fillText(finalLine, x, currentY);
    }
  }
}
