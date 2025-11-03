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
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      const filename = path.basename(filePath);
      const identifier = doorNumber || filename.split('.')[0];
      const thumbnailPathLight = path.join(
        paths.thumbnailsDir,
        `thumb_${identifier}_light.jpg`
      );
      const thumbnailPathDark = path.join(
        paths.thumbnailsDir,
        `thumb_${identifier}_dark.jpg`
      );

      // Check if both thumbnails exist
      const lightExists = await this.checkExistingThumbnail(thumbnailPathLight);
      const darkExists = await this.checkExistingThumbnail(thumbnailPathDark);

      if (lightExists && darkExists) {
        return { light: thumbnailPathLight, dark: thumbnailPathDark };
      }

      logger.info('Generiere neue Thumbnails für:', filename, 'Typ:', type);

      switch (type) {
        case 'puzzle':
          return await this.generatePuzzleThumbnails(thumbnailPathLight, thumbnailPathDark);
        case 'video':
        case 'gif':
          return await this.generateMediaThumbnails(filePath, thumbnailPathLight, thumbnailPathDark);
        case 'image':
          return await this.generateImageThumbnails(filePath, thumbnailPathLight, thumbnailPathDark);
        case 'text':
          return await this.generateTextThumbnails(filePath, thumbnailPathLight, thumbnailPathDark);
        case 'poll':
          return await this.generatePollThumbnails(doorNumber!, thumbnailPathLight, thumbnailPathDark);
        case 'audio':
          return await this.generateAudioThumbnails(filePath, thumbnailPathLight, thumbnailPathDark);
        case 'countdown':
          return await this.generateCountdownThumbnails(thumbnailPathLight, thumbnailPathDark);
        case 'iframe':
          return await this.generateIframeThumbnails(filePath, thumbnailPathLight, thumbnailPathDark);
        default:
          logger.info('Kein Thumbnail-Generator für Typ:', type);
          return { light: null, dark: null };
      }
    } catch (error) {
      logger.error('Fehler bei der Thumbnail-Generierung:', error);
      return { light: null, dark: null };
    }
  }

  static async generatePuzzleThumbnails(
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    const puzzleAsset = path.join(paths.assetDir, 'puzzle.jpg');
    if (fs.existsSync(puzzleAsset)) {
      // Puzzle thumbnails are the same for both themes (they're actual images)
      fs.copyFileSync(puzzleAsset, thumbnailPathLight);
      fs.copyFileSync(puzzleAsset, thumbnailPathDark);
      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    }
    return { light: null, dark: null };
  }

  static async generateMediaThumbnails(
    filePath: string,
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    // Check if FFmpeg is available
    if (!env.ffmpegPath || !env.ffprobePath) {
      logger.warn('FFmpeg nicht konfiguriert, überspringe Video/GIF-Thumbnail');
      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    }

    return new Promise((resolve, reject) => {
      const tempPath = thumbnailPathLight.replace('_light.jpg', '_temp.jpg');

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
            // Process both versions (they're identical for media files)
            await this.processTemporaryFile(tempPath, thumbnailPathLight);
            fs.copyFileSync(thumbnailPathLight, thumbnailPathDark);
            resolve({ light: thumbnailPathLight, dark: thumbnailPathDark });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          logger.error('FFmpeg error:', err);
          resolve({ light: thumbnailPathLight, dark: thumbnailPathDark });
        });
    });
  }

  static async generateImageThumbnails(
    filePath: string,
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    const metadata = await sharp(filePath).metadata();
    const targetHeight = Math.round(
      this.targetWidth * ((metadata.height || 500) / (metadata.width || 500))
    );

    // Images are the same for both themes
    await sharp(filePath)
      .resize(this.targetWidth, targetHeight, { fit: 'fill' })
      .jpeg({ quality: this.quality })
      .toFile(thumbnailPathLight);

    fs.copyFileSync(thumbnailPathLight, thumbnailPathDark);

    return { light: thumbnailPathLight, dark: thumbnailPathDark };
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
      const identifier = filename.split('.')[0];
      const thumbnailPathLight = path.join(
        paths.thumbnailsDir,
        `thumb_${identifier}_light.jpg`
      );
      const thumbnailPathDark = path.join(
        paths.thumbnailsDir,
        `thumb_${identifier}_dark.jpg`
      );

      if (fs.existsSync(thumbnailPathLight)) {
        fs.unlinkSync(thumbnailPathLight);
        logger.info('Thumbnail gelöscht:', thumbnailPathLight);
      }
      if (fs.existsSync(thumbnailPathDark)) {
        fs.unlinkSync(thumbnailPathDark);
        logger.info('Thumbnail gelöscht:', thumbnailPathDark);
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

  static async generateTextThumbnails(
    filePath: string,
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      const textContent = fs.readFileSync(filePath, 'utf-8');
      const cleanText = this.stripMarkdown(textContent);
      const preview = cleanText.substring(0, 250);

      // Generate light version
      const canvasLight = createCanvas(500, 500);
      const ctxLight = canvasLight.getContext('2d');

      // Light theme: white background
      ctxLight.fillStyle = 'hsl(0, 0%, 100%)';
      ctxLight.fillRect(0, 0, 500, 500);

      // Text rendering - dark text on light background
      ctxLight.fillStyle = 'hsl(0, 0%, 4%)';
      ctxLight.font = 'bold 24px sans-serif';
      ctxLight.textAlign = 'center';
      ctxLight.fillText('📝 Text', 250, 60);

      ctxLight.font = '18px sans-serif';
      this.wrapText(ctxLight, preview, 250, 120, 440, 26);

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      // Dark theme: dark background
      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      // Text rendering - light text on dark background
      ctxDark.fillStyle = 'hsl(0, 0%, 98%)';
      ctxDark.font = 'bold 24px sans-serif';
      ctxDark.textAlign = 'center';
      ctxDark.fillText('📝 Text', 250, 60);

      ctxDark.font = '18px sans-serif';
      this.wrapText(ctxDark, preview, 250, 120, 440, 26);

      const bufferDark = canvasDark.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathDark, bufferDark);

      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    } catch (error) {
      logger.error('Fehler bei Text-Thumbnail:', error);
      return { light: null, dark: null };
    }
  }

  static async generatePollThumbnails(
    doorNumber: number,
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      const pollDataPath = path.join(paths.dataDir, 'polls', 'pollData.json');
      if (!fs.existsSync(pollDataPath)) {
        return { light: null, dark: null };
      }

      const pollData = JSON.parse(fs.readFileSync(pollDataPath, 'utf-8'));
      const poll = pollData[doorNumber];

      if (!poll) {
        return { light: null, dark: null };
      }

      // Generate light version
      const canvasLight = createCanvas(500, 500);
      const ctxLight = canvasLight.getContext('2d');

      ctxLight.fillStyle = 'hsl(0, 0%, 100%)';
      ctxLight.fillRect(0, 0, 500, 500);

      ctxLight.fillStyle = 'hsl(0, 0%, 4%)';
      ctxLight.font = 'bold 28px sans-serif';
      ctxLight.textAlign = 'center';
      ctxLight.fillText('📊 Umfrage', 250, 60);

      ctxLight.font = 'bold 22px sans-serif';
      this.wrapText(ctxLight, poll.question, 250, 120, 440, 32);

      ctxLight.font = '16px sans-serif';
      let yPos = 280;
      poll.options.slice(0, 4).forEach((option: string, index: number) => {
        const shortOption = option.length > 35 ? option.substring(0, 35) + '...' : option;
        ctxLight.fillText(`${index + 1}. ${shortOption}`, 250, yPos);
        yPos += 30;
      });

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      ctxDark.fillStyle = 'hsl(0, 0%, 98%)';
      ctxDark.font = 'bold 28px sans-serif';
      ctxDark.textAlign = 'center';
      ctxDark.fillText('📊 Umfrage', 250, 60);

      ctxDark.font = 'bold 22px sans-serif';
      this.wrapText(ctxDark, poll.question, 250, 120, 440, 32);

      ctxDark.font = '16px sans-serif';
      yPos = 280;
      poll.options.slice(0, 4).forEach((option: string, index: number) => {
        const shortOption = option.length > 35 ? option.substring(0, 35) + '...' : option;
        ctxDark.fillText(`${index + 1}. ${shortOption}`, 250, yPos);
        yPos += 30;
      });

      const bufferDark = canvasDark.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathDark, bufferDark);

      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    } catch (error) {
      logger.error('Fehler bei Poll-Thumbnail:', error);
      return { light: null, dark: null };
    }
  }

  static async generateAudioThumbnails(
    filePath: string,
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      // Generate light version
      const canvasLight = createCanvas(500, 500);
      const ctxLight = canvasLight.getContext('2d');

      ctxLight.fillStyle = 'hsl(0, 0%, 100%)';
      ctxLight.fillRect(0, 0, 500, 500);

      ctxLight.fillStyle = 'hsl(0, 0%, 4%)';
      ctxLight.font = 'bold 120px sans-serif';
      ctxLight.textAlign = 'center';
      ctxLight.fillText('🎵', 250, 280);

      ctxLight.font = 'bold 32px sans-serif';
      ctxLight.fillText('Audio', 250, 380);

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      ctxDark.fillStyle = 'hsl(0, 0%, 98%)';
      ctxDark.font = 'bold 120px sans-serif';
      ctxDark.textAlign = 'center';
      ctxDark.fillText('🎵', 250, 280);

      ctxDark.font = 'bold 32px sans-serif';
      ctxDark.fillText('Audio', 250, 380);

      const bufferDark = canvasDark.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathDark, bufferDark);

      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    } catch (error) {
      logger.error('Fehler bei Audio-Thumbnail:', error);
      return { light: null, dark: null };
    }
  }

  static async generateCountdownThumbnails(
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      // Generate light version
      const canvasLight = createCanvas(500, 500);
      const ctxLight = canvasLight.getContext('2d');

      ctxLight.fillStyle = 'hsl(0, 0%, 100%)';
      ctxLight.fillRect(0, 0, 500, 500);

      ctxLight.fillStyle = 'hsl(0, 0%, 4%)';
      ctxLight.font = 'bold 120px sans-serif';
      ctxLight.textAlign = 'center';
      ctxLight.fillText('⏱️', 250, 230);

      ctxLight.font = 'bold 32px sans-serif';
      ctxLight.fillText('Christmas', 250, 320);
      ctxLight.fillText('Countdown', 250, 370);

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      ctxDark.fillStyle = 'hsl(0, 0%, 98%)';
      ctxDark.font = 'bold 120px sans-serif';
      ctxDark.textAlign = 'center';
      ctxDark.fillText('⏱️', 250, 230);

      ctxDark.font = 'bold 32px sans-serif';
      ctxDark.fillText('Christmas', 250, 320);
      ctxDark.fillText('Countdown', 250, 370);

      const bufferDark = canvasDark.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathDark, bufferDark);

      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    } catch (error) {
      logger.error('Fehler bei Countdown-Thumbnail:', error);
      return { light: null, dark: null };
    }
  }

  static async generateIframeThumbnails(
    filePath: string,
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      const iframeUrl = fs.readFileSync(filePath, 'utf-8').trim();

      // Try to extract YouTube video ID
      const youtubeMatch = iframeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);

      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        const ytThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        try {
          // Download YouTube thumbnail (same for both themes)
          const response = await fetch(ytThumbnailUrl);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            await sharp(buffer)
              .resize(this.targetWidth, null, { fit: 'cover' })
              .jpeg({ quality: this.quality })
              .toFile(thumbnailPathLight);

            fs.copyFileSync(thumbnailPathLight, thumbnailPathDark);
            return { light: thumbnailPathLight, dark: thumbnailPathDark };
          }
        } catch (err) {
          logger.warn('YouTube-Thumbnail konnte nicht geladen werden, verwende Fallback');
        }
      }

      // Fallback: Generic iframe thumbnail - light version
      const canvasLight = createCanvas(500, 500);
      const ctxLight = canvasLight.getContext('2d');

      ctxLight.fillStyle = 'hsl(0, 0%, 100%)';
      ctxLight.fillRect(0, 0, 500, 500);

      ctxLight.fillStyle = 'hsl(0, 0%, 4%)';
      ctxLight.font = 'bold 120px sans-serif';
      ctxLight.textAlign = 'center';
      ctxLight.fillText('🖼️', 250, 280);

      ctxLight.font = 'bold 32px sans-serif';
      ctxLight.fillText('Iframe', 250, 380);

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Fallback: Generic iframe thumbnail - dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      ctxDark.fillStyle = 'hsl(0, 0%, 98%)';
      ctxDark.font = 'bold 120px sans-serif';
      ctxDark.textAlign = 'center';
      ctxDark.fillText('🖼️', 250, 280);

      ctxDark.font = 'bold 32px sans-serif';
      ctxDark.fillText('Iframe', 250, 380);

      const bufferDark = canvasDark.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathDark, bufferDark);

      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    } catch (error) {
      logger.error('Fehler bei Iframe-Thumbnail:', error);
      return { light: null, dark: null };
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
