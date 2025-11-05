import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { createCanvas } from '@napi-rs/canvas';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { paths } from '../config/paths';
import type { FileType } from '../utils/fileUtils';
import type { ContentType } from '../types';

type MarkdownPreviewLine = {
  type: 'heading' | 'subheading' | 'paragraph' | 'bullet' | 'numbered' | 'quote' | 'code';
  text: string;
  prefix?: string;
};

type MarkdownTheme = {
  textColor: string;
  headingColor: string;
  accentColor: string;
  mutedColor: string;
  bulletColor: string;
  quoteColor: string;
  codeBackground: string;
  codeBorder: string;
  codeText: string;
};

type PreparedMarkdownLine = {
  type: MarkdownPreviewLine['type'];
  font: string;
  lineHeight: number;
  extraSpacing: number;
  indent: number;
  segments: string[];
  availableWidth: number;
  ellipsis: boolean;
  blockWidth: number;
  leftDecor: number;
  rightDecor: number;
  prefix?: string;
  prefixWidth?: number;
  bullet?: { radius: number; centerOffset: number };
  hasCodeBox?: boolean;
};


export class ThumbnailService {
  private static thumbnailCache = new Map<string, string>();
  private static targetWidth = env.thumbnailWidth;
  private static quality = env.thumbnailQuality;

  static async generateThumbnail(
    filePath: string,
    type: FileType | ContentType,
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

      if (type !== 'puzzle' && lightExists && darkExists) {
        return { light: thumbnailPathLight, dark: thumbnailPathDark };
      }

      logger.info('Generiere neue Thumbnails für:', filename, 'Typ:', type);

      switch (type) {
        case 'puzzle':
          return await this.generatePuzzleThumbnails(
            thumbnailPathLight,
            thumbnailPathDark,
            typeof doorNumber === 'number' ? doorNumber : undefined
          );
        case 'video':
          return await this.generateMediaThumbnails(filePath, thumbnailPathLight, thumbnailPathDark);
        case 'gif':
          return await this.generateGifThumbnails(filePath, thumbnailPathLight, thumbnailPathDark);
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
    thumbnailPathDark: string,
    doorNumber?: number
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      if (typeof doorNumber === 'number') {
        const mediumPath = paths.mediumJsonPath;
        if (fs.existsSync(mediumPath)) {
          const mediumRaw = fs.readFileSync(mediumPath, 'utf-8');
          const medium = JSON.parse(mediumRaw) as Record<string, string>;
          const imageIndex = doorNumber + 1000;
          const puzzleImage = medium[imageIndex];

          if (puzzleImage) {
            const puzzleImagePath = path.join(paths.mediaDir, puzzleImage);
            if (fs.existsSync(puzzleImagePath)) {
              if (fs.existsSync(thumbnailPathLight)) {
                const thumbStat = fs.statSync(thumbnailPathLight);
                const imageStat = fs.statSync(puzzleImagePath);
                if (thumbStat.mtimeMs >= imageStat.mtimeMs) {
                  if (!fs.existsSync(thumbnailPathDark)) {
                    fs.copyFileSync(thumbnailPathLight, thumbnailPathDark);
                  }
                  return { light: thumbnailPathLight, dark: thumbnailPathDark };
                }
              }

              await sharp(puzzleImagePath)
                .resize(this.targetWidth, this.targetWidth, { fit: 'cover' })
                .jpeg({ quality: this.quality })
                .toFile(thumbnailPathLight);

              fs.copyFileSync(thumbnailPathLight, thumbnailPathDark);
              return { light: thumbnailPathLight, dark: thumbnailPathDark };
            }
          }
        }
      }

      const puzzleAsset = path.join(paths.assetDir, 'puzzle.jpg');
      if (fs.existsSync(puzzleAsset)) {
        // Puzzle thumbnails are the same for both themes (they're actual images)
        fs.copyFileSync(puzzleAsset, thumbnailPathLight);
        fs.copyFileSync(puzzleAsset, thumbnailPathDark);
        return { light: thumbnailPathLight, dark: thumbnailPathDark };
      }
    } catch (error) {
      logger.error('Fehler bei Puzzle-Thumbnail:', error);
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
          timestamps: ['00:00:00.500'],
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

  static async generateGifThumbnails(
    filePath: string,
    thumbnailPathLight: string,
    thumbnailPathDark: string
  ): Promise<{ light: string | null; dark: string | null }> {
    try {
      // Extract first frame from GIF using Sharp
      const metadata = await sharp(filePath).metadata();
      const targetHeight = Math.round(
        this.targetWidth * ((metadata.height || 500) / (metadata.width || 500))
      );

      // GIFs are the same for both themes (extract first frame)
      await sharp(filePath, { animated: false })
        .resize(this.targetWidth, targetHeight, { fit: 'fill' })
        .jpeg({ quality: this.quality })
        .toFile(thumbnailPathLight);

      fs.copyFileSync(thumbnailPathLight, thumbnailPathDark);

      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    } catch (error) {
      logger.error('Fehler bei GIF-Thumbnail:', error);
      return { light: null, dark: null };
    }
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
      // Remove HTML entities (&#x20;, &nbsp;, etc.)
      .replace(/&#x[0-9a-fA-F]+;/g, ' ')
      .replace(/&#\d+;/g, ' ')
      .replace(/&[a-zA-Z]+;/g, ' ')
      // Remove extra whitespace and newlines
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
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
      const previewLines = this.formatMarkdownPreview(textContent, 14);

      // Generate light version
      const canvasLight = createCanvas(500, 500);
      const ctxLight = canvasLight.getContext('2d');

      // Light theme: white background
      ctxLight.fillStyle = 'hsl(0, 0%, 100%)';
      ctxLight.fillRect(0, 0, 500, 500);

      this.drawMarkdownThumbnail(ctxLight, previewLines, {
        textColor: 'hsl(0, 0%, 28%)',
        headingColor: 'hsl(0, 0%, 12%)',
        accentColor: 'hsl(43, 85%, 45%)',
        mutedColor: 'hsl(0, 0%, 45%)',
        bulletColor: 'hsl(43, 85%, 45%)',
        quoteColor: 'rgba(214, 174, 56, 0.25)',
        codeBackground: 'rgba(248, 248, 248, 0.95)',
        codeBorder: 'rgba(0, 0, 0, 0.06)',
        codeText: 'hsl(220, 15%, 20%)',
      });

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      // Dark theme: dark background
      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      this.drawMarkdownThumbnail(ctxDark, previewLines, {
        textColor: 'hsl(0, 0%, 74%)',
        headingColor: 'hsl(0, 0%, 96%)',
        accentColor: 'hsl(43, 85%, 58%)',
        mutedColor: 'hsl(0, 0%, 60%)',
        bulletColor: 'hsl(43, 85%, 58%)',
        quoteColor: 'rgba(214, 174, 56, 0.35)',
        codeBackground: 'rgba(255, 255, 255, 0.08)',
        codeBorder: 'rgba(255, 255, 255, 0.12)',
        codeText: 'hsl(43, 85%, 70%)',
      });

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

      ctxLight.strokeStyle = 'hsl(0, 0%, 20%)';
      ctxLight.fillStyle = 'hsl(0, 0%, 20%)';
      ctxLight.lineWidth = 2.5;
      ctxLight.lineCap = 'round';
      ctxLight.lineJoin = 'round';

      const chartTop = 140;
      const chartBottom = 320;
      const chartHeight = chartBottom - chartTop;
      const barWidth = 42;
      const barSpacing = 30;
      const barValues = [0.55, 0.85, 0.65, 1];
      const totalWidth = (barValues.length * barWidth) + ((barValues.length - 1) * barSpacing);
      const startX = 250 - totalWidth / 2;

      barValues.forEach((value, i) => {
        const height = chartHeight * value;
        const x = startX + i * (barWidth + barSpacing);
        const y = chartBottom - height;
        ctxLight.beginPath();
        ctxLight.roundRect(x, y, barWidth, height, 8);
        ctxLight.fill();
      });

      ctxLight.strokeStyle = 'hsl(0, 0%, 75%)';
      ctxLight.lineWidth = 2;
      ctxLight.beginPath();
      ctxLight.moveTo(startX - 20, chartBottom + 6);
      ctxLight.lineTo(startX + totalWidth + 20, chartBottom + 6);
      ctxLight.stroke();

      ctxLight.font = '600 20px "Inter", sans-serif';
      ctxLight.textAlign = 'center';
      ctxLight.fillStyle = 'hsl(0, 0%, 30%)';
      this.wrapText(ctxLight, poll.question, 250, chartBottom + 40, 420, 28);

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      ctxDark.strokeStyle = 'hsl(0, 0%, 80%)';
      ctxDark.fillStyle = 'hsl(0, 0%, 80%)';
      ctxDark.lineWidth = 2.5;
      ctxDark.lineCap = 'round';
      ctxDark.lineJoin = 'round';

      const chartTopDark = 140;
      const chartBottomDark = 320;
      const chartHeightDark = chartBottomDark - chartTopDark;
      const barWidthDark = 42;
      const barSpacingDark = 30;
      const barValuesDark = [0.55, 0.85, 0.65, 1];
      const totalWidthDark = (barValuesDark.length * barWidthDark) + ((barValuesDark.length - 1) * barSpacingDark);
      const startXDark = 250 - totalWidthDark / 2;

      barValuesDark.forEach((value, i) => {
        const height = chartHeightDark * value;
        const x = startXDark + i * (barWidthDark + barSpacingDark);
        const y = chartBottomDark - height;
        ctxDark.beginPath();
        ctxDark.roundRect(x, y, barWidthDark, height, 8);
        ctxDark.fill();
      });

      ctxDark.strokeStyle = 'hsl(0, 0%, 55%)';
      ctxDark.lineWidth = 2;
      ctxDark.beginPath();
      ctxDark.moveTo(startXDark - 20, chartBottomDark + 6);
      ctxDark.lineTo(startXDark + totalWidthDark + 20, chartBottomDark + 6);
      ctxDark.stroke();

      ctxDark.font = '600 20px "Inter", sans-serif';
      ctxDark.textAlign = 'center';
      ctxDark.fillStyle = 'hsl(0, 0%, 70%)';
      this.wrapText(ctxDark, poll.question, 250, chartBottomDark + 40, 420, 28);

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

      // Lucide AudioWaveform icon - smoother, more elegant
      ctxLight.strokeStyle = 'hsl(0, 0%, 20%)';
      ctxLight.lineWidth = 3;
      ctxLight.lineCap = 'round';
      ctxLight.lineJoin = 'round';

      // Waveform lines with varying heights (Lucide style)
      const waveHeights = [50, 110, 70, 140, 90, 130, 60, 120, 80, 100, 65];
      const lineSpacing = 20;
      const totalWidth = (waveHeights.length - 1) * lineSpacing;
      const startX = 250 - totalWidth / 2;

      waveHeights.forEach((height, i) => {
        const x = startX + i * lineSpacing;
        const y = 250 - height / 2;
        ctxLight.beginPath();
        ctxLight.moveTo(x, y);
        ctxLight.lineTo(x, y + height);
        ctxLight.stroke();
      });

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      // Lucide AudioWaveform icon - smoother, more elegant
      ctxDark.strokeStyle = 'hsl(0, 0%, 80%)';
      ctxDark.lineWidth = 3;
      ctxDark.lineCap = 'round';
      ctxDark.lineJoin = 'round';

      waveHeights.forEach((height, i) => {
        const x = startX + i * lineSpacing;
        const y = 250 - height / 2;
        ctxDark.beginPath();
        ctxDark.moveTo(x, y);
        ctxDark.lineTo(x, y + height);
        ctxDark.stroke();
      });

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

      // Lucide Clock icon
      ctxLight.strokeStyle = 'hsl(0, 0%, 20%)';
      ctxLight.fillStyle = 'hsl(0, 0%, 20%)';
      ctxLight.lineWidth = 2.5;
      ctxLight.lineCap = 'round';
      ctxLight.lineJoin = 'round';

      // Clock circle centered icon
      const clockCenterX = 250;
      const clockCenterY = 250;
      const clockRadius = 110;

      ctxLight.beginPath();
      ctxLight.arc(clockCenterX, clockCenterY, clockRadius, 0, Math.PI * 2);
      ctxLight.stroke();

      // Clock hands (12:00 position for countdown)
      // Hour hand (pointing up)
      ctxLight.lineWidth = 4;
      ctxLight.beginPath();
      ctxLight.moveTo(clockCenterX, clockCenterY);
      ctxLight.lineTo(clockCenterX, clockCenterY - clockRadius * 0.45);
      ctxLight.stroke();

      // Minute hand (pointing up)
      ctxLight.lineWidth = 3;
      ctxLight.beginPath();
      ctxLight.moveTo(clockCenterX, clockCenterY);
      ctxLight.lineTo(clockCenterX, clockCenterY - clockRadius * 0.7);
      ctxLight.stroke();

      // Center dot
      ctxLight.beginPath();
      ctxLight.arc(clockCenterX, clockCenterY, 5, 0, Math.PI * 2);
      ctxLight.fill();

      // Optional label removed per user request

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Generate dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      // Lucide Clock icon
      ctxDark.strokeStyle = 'hsl(0, 0%, 80%)';
      ctxDark.fillStyle = 'hsl(0, 0%, 80%)';
      ctxDark.lineWidth = 2.5;
      ctxDark.lineCap = 'round';
      ctxDark.lineJoin = 'round';

      // Clock circle centered icon
      ctxDark.beginPath();
      ctxDark.arc(clockCenterX, clockCenterY, clockRadius, 0, Math.PI * 2);
      ctxDark.stroke();

      // Clock hands (12:00 position for countdown)
      // Hour hand (pointing up)
      ctxDark.lineWidth = 4;
      ctxDark.beginPath();
      ctxDark.moveTo(clockCenterX, clockCenterY);
      ctxDark.lineTo(clockCenterX, clockCenterY - clockRadius * 0.45);
      ctxDark.stroke();

      // Minute hand (pointing up)
      ctxDark.lineWidth = 3;
      ctxDark.beginPath();
      ctxDark.moveTo(clockCenterX, clockCenterY);
      ctxDark.lineTo(clockCenterX, clockCenterY - clockRadius * 0.7);
      ctxDark.stroke();

      // Center dot
      ctxDark.beginPath();
      ctxDark.arc(clockCenterX, clockCenterY, 5, 0, Math.PI * 2);
      ctxDark.fill();

      // Optional label removed per user request

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

      // Fallback: Generic iframe thumbnail with Lucide Monitor icon - light version
      const canvasLight = createCanvas(500, 500);
      const ctxLight = canvasLight.getContext('2d');

      ctxLight.fillStyle = 'hsl(0, 0%, 100%)';
      ctxLight.fillRect(0, 0, 500, 500);

      // Lucide Monitor icon
      ctxLight.strokeStyle = 'hsl(0, 0%, 20%)';
      ctxLight.fillStyle = 'hsl(0, 0%, 20%)';
      ctxLight.lineWidth = 2.5;
      ctxLight.lineCap = 'round';
      ctxLight.lineJoin = 'round';

      // Monitor screen (larger, better proportions)
      const screenX = 100;
      const screenY = 100;
      const screenWidth = 300;
      const screenHeight = 200;

      ctxLight.beginPath();
      ctxLight.roundRect(screenX, screenY, screenWidth, screenHeight, 8);
      ctxLight.stroke();

      // Monitor stand (V-shape)
      ctxLight.beginPath();
      ctxLight.moveTo(220, screenY + screenHeight);
      ctxLight.lineTo(250, screenY + screenHeight + 50);
      ctxLight.lineTo(280, screenY + screenHeight);
      ctxLight.stroke();

      // Monitor base (horizontal line)
      ctxLight.beginPath();
      ctxLight.moveTo(200, screenY + screenHeight + 50);
      ctxLight.lineTo(300, screenY + screenHeight + 50);
      ctxLight.stroke();

      // Play button (triangle) in the center
      const playSize = 35;
      const playCenterX = screenX + screenWidth / 2;
      const playCenterY = screenY + screenHeight / 2;

      ctxLight.beginPath();
      ctxLight.moveTo(playCenterX - playSize / 3, playCenterY - playSize / 2);
      ctxLight.lineTo(playCenterX - playSize / 3, playCenterY + playSize / 2);
      ctxLight.lineTo(playCenterX + playSize / 2, playCenterY);
      ctxLight.closePath();
      ctxLight.fill();

      const bufferLight = canvasLight.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathLight, bufferLight);

      // Fallback: Generic iframe thumbnail with Lucide Monitor icon - dark version
      const canvasDark = createCanvas(500, 500);
      const ctxDark = canvasDark.getContext('2d');

      ctxDark.fillStyle = 'hsl(0, 0%, 4%)';
      ctxDark.fillRect(0, 0, 500, 500);

      // Lucide Monitor icon
      ctxDark.strokeStyle = 'hsl(0, 0%, 80%)';
      ctxDark.fillStyle = 'hsl(0, 0%, 80%)';
      ctxDark.lineWidth = 2.5;
      ctxDark.lineCap = 'round';
      ctxDark.lineJoin = 'round';

      // Monitor screen (larger, better proportions)
      ctxDark.beginPath();
      ctxDark.roundRect(screenX, screenY, screenWidth, screenHeight, 8);
      ctxDark.stroke();

      // Monitor stand (V-shape)
      ctxDark.beginPath();
      ctxDark.moveTo(220, screenY + screenHeight);
      ctxDark.lineTo(250, screenY + screenHeight + 50);
      ctxDark.lineTo(280, screenY + screenHeight);
      ctxDark.stroke();

      // Monitor base (horizontal line)
      ctxDark.beginPath();
      ctxDark.moveTo(200, screenY + screenHeight + 50);
      ctxDark.lineTo(300, screenY + screenHeight + 50);
      ctxDark.stroke();

      // Play button (triangle) in the center
      ctxDark.beginPath();
      ctxDark.moveTo(playCenterX - playSize / 3, playCenterY - playSize / 2);
      ctxDark.lineTo(playCenterX - playSize / 3, playCenterY + playSize / 2);
      ctxDark.lineTo(playCenterX + playSize / 2, playCenterY);
      ctxDark.closePath();
      ctxDark.fill();

      const bufferDark = canvasDark.toBuffer('image/jpeg', 85);
      fs.writeFileSync(thumbnailPathDark, bufferDark);

      return { light: thumbnailPathLight, dark: thumbnailPathDark };
    } catch (error) {
      logger.error('Fehler bei Iframe-Thumbnail:', error);
      return { light: null, dark: null };
    }
  }

  private static cleanInlineMarkdown(text: string): string {
    const decoded = text
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return this.decodeHtmlEntities(decoded);
  }

  private static formatMarkdownPreview(text: string, maxItems = 14): MarkdownPreviewLine[] {
    const result: MarkdownPreviewLine[] = [];
    const lines = text.split(/\r?\n/);
    let inCodeBlock = false;

    for (const rawLine of lines) {
      if (result.length >= maxItems) {
        break;
      }

      const normalized = rawLine.replace(/\t/g, '  ');
      const trimmedEnd = normalized.trimEnd();

      if (trimmedEnd.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        if (trimmedEnd.length > 0) {
          result.push({
            type: 'code',
            text: trimmedEnd.length > 110 ? `${trimmedEnd.substring(0, 107)}...` : trimmedEnd,
          });
        }
        continue;
      }

      const trimmed = trimmedEnd.trim();
      if (!trimmed) {
        continue;
      }

      if (/^#{1,6}\s+/.test(trimmed)) {
        const level = trimmed.match(/^#{1,6}/)?.[0]?.length ?? 1;
        const headingText = this.cleanInlineMarkdown(trimmed.replace(/^#{1,6}\s+/, ''));
        if (headingText) {
          result.push({
            type: level <= 2 ? 'heading' : 'subheading',
            text: headingText.substring(0, 140),
          });
        }
        continue;
      }

      if (/^>\s+/.test(trimmed)) {
        const quoteText = this.cleanInlineMarkdown(trimmed.replace(/^>\s+/, ''));
        if (quoteText) {
          result.push({
            type: 'quote',
            text: quoteText.substring(0, 140),
          });
        }
        continue;
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        const bulletText = this.cleanInlineMarkdown(trimmed.replace(/^[-*+]\s+/, ''));
        if (bulletText) {
          result.push({
            type: 'bullet',
            text: bulletText.substring(0, 140),
          });
        }
        continue;
      }

      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        const prefix = `${numberedMatch[1]}.`;
        const numberedText = this.cleanInlineMarkdown(numberedMatch[2]);
        if (numberedText) {
          result.push({
            type: 'numbered',
            text: numberedText.substring(0, 140),
            prefix,
          });
        }
        continue;
      }

      const cleaned = this.cleanInlineMarkdown(trimmed);
      if (cleaned) {
        result.push({
          type: 'paragraph',
          text: cleaned.substring(0, 160),
        });
      }
    }

    if (result.length === 0) {
      const fallback = this.cleanInlineMarkdown(text);
      if (fallback) {
        result.push({ type: 'paragraph', text: fallback.substring(0, 160) });
      }
    }

    return result;
  }

  private static drawMarkdownThumbnail(
    ctx: any,
    lines: MarkdownPreviewLine[],
    theme: MarkdownTheme
  ): void {
    const canvasWidth = ctx?.canvas?.width ?? 500;
    const sideMargin = 40;
    const maxRenderedLines = 8;
    let maxWidth = 380;

    let layout = this.prepareMarkdownLayout(ctx, lines, maxRenderedLines, maxWidth);
    let totalWidth = layout.contentWidth + layout.leftDecor + layout.rightDecor;
    const maxAllowedWidth = canvasWidth - sideMargin * 2;

    if (totalWidth > maxAllowedWidth) {
      const adjustedMaxWidth = Math.max(
        140,
        maxAllowedWidth - (layout.leftDecor + layout.rightDecor)
      );

      if (adjustedMaxWidth < maxWidth) {
        maxWidth = adjustedMaxWidth;
        layout = this.prepareMarkdownLayout(ctx, lines, maxRenderedLines, maxWidth);
        totalWidth = layout.contentWidth + layout.leftDecor + layout.rightDecor;
      }
    }

    let startX = Math.round(
      (canvasWidth - totalWidth) / 2 + layout.leftDecor
    );

    const leftBoundary = startX - layout.leftDecor;
    const rightBoundary = startX + layout.contentWidth + layout.rightDecor;

    if (leftBoundary < sideMargin) {
      startX += sideMargin - leftBoundary;
    }

    if (rightBoundary > canvasWidth - sideMargin) {
      startX -= rightBoundary - (canvasWidth - sideMargin);
    }

    let currentY = 80;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (const line of layout.lines) {
      let color = theme.textColor;

      switch (line.type) {
        case 'heading':
          color = theme.headingColor;
          break;
        case 'subheading':
          color = theme.headingColor;
          break;
        case 'quote':
          color = theme.mutedColor;
          break;
        case 'code':
          color = theme.codeText;
          break;
        default:
          color = theme.textColor;
          break;
      }

      currentY += line.extraSpacing;
      const blockTop = currentY;
      const blockHeight = line.lineHeight * line.segments.length;

      if (line.hasCodeBox) {
        ctx.save();
        ctx.fillStyle = theme.codeBackground;
        ctx.strokeStyle = theme.codeBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const codeStart = startX - line.leftDecor;
        const codeWidth = line.blockWidth + line.leftDecor + line.rightDecor;
        ctx.roundRect(codeStart, blockTop - 8, codeWidth, blockHeight + 16);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        currentY += 4;
      } else if (line.type === 'quote') {
        ctx.save();
        ctx.fillStyle = theme.quoteColor;
        ctx.fillRect(startX - line.leftDecor, blockTop - 2, 4, blockHeight + 4);
        ctx.restore();
      } else if (line.type === 'bullet' && line.bullet) {
        ctx.save();
        ctx.fillStyle = theme.bulletColor;
        ctx.beginPath();
        const centerX = startX - line.bullet.centerOffset;
        const centerY = blockTop + line.lineHeight / 2;
        ctx.arc(centerX, centerY, line.bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (line.type === 'numbered' && line.prefix && line.prefixWidth !== undefined) {
        ctx.save();
        ctx.font = '600 18px "Inter", sans-serif';
        ctx.fillStyle = theme.accentColor;
        const prefixX = startX - Math.max(line.leftDecor - 4, line.prefixWidth + 6);
        ctx.fillText(line.prefix, prefixX, blockTop);
        ctx.restore();
      }

      ctx.font = line.font;
      ctx.fillStyle = color;

      for (let i = 0; i < line.segments.length; i++) {
        let segment = line.segments[i];

        if (line.ellipsis && i === line.segments.length - 1) {
          segment = this.truncateWithEllipsis(ctx, segment, line.availableWidth);
        }

        ctx.fillText(segment, startX + line.indent, currentY);
        currentY += line.lineHeight;
      }

      if (line.hasCodeBox) {
        currentY += 6;
      }
    }
  }

  private static prepareMarkdownLayout(
    ctx: any,
    lines: MarkdownPreviewLine[],
    maxRenderedLines: number,
    maxWidth: number
  ): {
    lines: PreparedMarkdownLine[];
    contentWidth: number;
    leftDecor: number;
    rightDecor: number;
  } {
    const prepared: PreparedMarkdownLine[] = [];
    let renderedLines = 0;
    let maxContentWidth = 0;
    let maxLeftDecor = 0;
    let maxRightDecor = 0;

    for (let index = 0; index < lines.length && renderedLines < maxRenderedLines; index++) {
      const line = lines[index];

      let font = '500 18px "Inter", sans-serif';
      let lineHeight = 28;
      let extraSpacing = prepared.length > 0 ? 6 : 0;
      let indent = 0;
      let leftDecor = 0;
      let rightDecor = 0;
      let bullet: PreparedMarkdownLine['bullet'];
      let prefix: string | undefined;
      let prefixWidth: number | undefined;
      let hasCodeBox = false;

      switch (line.type) {
        case 'heading':
          font = '700 30px "Inter", sans-serif';
          lineHeight = 40;
          extraSpacing = prepared.length > 0 ? 12 : 0;
          break;
        case 'subheading':
          font = '600 22px "Inter", sans-serif';
          lineHeight = 32;
          extraSpacing = 8;
          break;
        case 'quote':
          font = 'italic 18px "Georgia", serif';
          lineHeight = 30;
          extraSpacing = 8;
          indent = 20;
          leftDecor = 16;
          break;
        case 'bullet':
          font = '500 18px "Inter", sans-serif';
          lineHeight = 28;
          extraSpacing = 6;
          indent = 20;
          bullet = { radius: 4, centerOffset: 6 };
          leftDecor = bullet.centerOffset + bullet.radius;
          break;
        case 'numbered':
          font = '500 18px "Inter", sans-serif';
          lineHeight = 28;
          extraSpacing = 6;
          prefix = line.prefix;
          ctx.save();
          ctx.font = '600 18px "Inter", sans-serif';
          prefixWidth = prefix ? ctx.measureText(prefix).width : 0;
          ctx.restore();
          indent = Math.max((prefixWidth ?? 0) + 14, 30);
          leftDecor = (prefixWidth ?? 0) + 10;
          break;
        case 'code':
          font = '600 17px "Fira Code", monospace';
          lineHeight = 26;
          extraSpacing = 10;
          indent = 18;
          leftDecor = 18;
          rightDecor = 18;
          hasCodeBox = true;
          break;
        default:
          break;
      }

      const sanitizedText =
        line.type === 'code' ? line.text : line.text.replace(/\s+/g, ' ').trim();

      const availableWidth = Math.max(maxWidth - indent, 140);
      const wrapped = this.wrapMarkdownText(ctx, sanitizedText, availableWidth);
      if (wrapped.length === 0) {
        continue;
      }

      const remainingLines = maxRenderedLines - renderedLines;
      const linesToRender = Math.min(wrapped.length, remainingLines);
      const segments = wrapped.slice(0, linesToRender);

      let maxLineWidth = 0;
      for (const segment of segments) {
        const segmentWidth = ctx.measureText(segment).width;
        if (segmentWidth > maxLineWidth) {
          maxLineWidth = segmentWidth;
        }
      }

      let blockWidth = indent + Math.min(maxLineWidth, availableWidth);
      if (hasCodeBox) {
        blockWidth = Math.max(blockWidth, indent + availableWidth);
      }

      const shouldEllipsis =
        linesToRender === remainingLines &&
        (wrapped.length > linesToRender || index < lines.length - 1);

      prepared.push({
        type: line.type,
        font,
        lineHeight,
        extraSpacing,
        indent,
        segments,
        availableWidth,
        ellipsis: shouldEllipsis,
        blockWidth,
        leftDecor,
        rightDecor,
        prefix,
        prefixWidth,
        bullet,
        hasCodeBox,
      });

      maxContentWidth = Math.max(maxContentWidth, blockWidth);
      maxLeftDecor = Math.max(maxLeftDecor, leftDecor);
      maxRightDecor = Math.max(maxRightDecor, rightDecor);
      renderedLines += segments.length;
    }

    return {
      lines: prepared,
      contentWidth: Math.max(maxContentWidth, 0),
      leftDecor: maxLeftDecor,
      rightDecor: maxRightDecor,
    };
  }

  private static wrapMarkdownText(ctx: any, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return [];
    }

    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          let truncated = word;
          while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
            truncated = truncated.slice(0, -1);
          }
          lines.push(truncated);
          currentLine = word.slice(truncated.length);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private static truncateWithEllipsis(ctx: any, text: string, maxWidth: number): string {
    let trimmed = text.trim();
    if (!trimmed) {
      return '…';
    }

    if (ctx.measureText(`${trimmed} …`).width <= maxWidth) {
      return `${trimmed} …`;
    }

    while (trimmed.length > 1 && ctx.measureText(`${trimmed} …`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1).trimEnd();
    }

    return `${trimmed} …`;
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

  private static decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) ? String.fromCharCode(code) : '';
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = parseInt(dec, 10);
        return Number.isFinite(code) ? String.fromCharCode(code) : '';
      })
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }
}
