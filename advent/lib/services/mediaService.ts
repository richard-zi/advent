import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { FileUtils } from '../utils/fileUtils';
import { paths } from '../config/paths';
import { TimingService } from './timingService';
import type { MediaContent, MediumData } from '../types';

const execPromise = promisify(exec);

export class MediaService {
  static async getMediaFile(index: number): Promise<string> {
    try {
      const mediumContent = await fs.readFile(paths.mediumJsonPath, 'utf8');
      const medium: MediumData = JSON.parse(mediumContent);

      if (!medium[index]) {
        throw new Error('File not found');
      }

      return path.join(paths.mediaDir, medium[index]);
    } catch (error) {
      logger.error('Error reading media file:', error);
      throw error;
    }
  }

  static async getMediaMessage(index: number): Promise<string | null> {
    try {
      const messagePath = path.join(paths.messagesDir, `${index}.txt`);
      const exists = FileUtils.fileExists(messagePath);

      if (!exists) {
        return null;
      }

      return await fs.readFile(messagePath, 'utf8');
    } catch (error) {
      logger.error('Error reading message file:', error);
      return null;
    }
  }

  static async updateMessage(index: number, message: string): Promise<boolean> {
    try {
      const messagePath = path.join(paths.messagesDir, `${index}.txt`);
      await fs.writeFile(messagePath, message);
      return true;
    } catch (error) {
      logger.error('Error updating message file:', error);
      return false;
    }
  }

  static async validateAudioFile(filePath: string): Promise<boolean> {
    try {
      const { stdout } = await execPromise(`ffprobe -i "${filePath}" -show_format -v quiet`);
      return (
        stdout.includes('format_name=mp3') ||
        stdout.includes('format_name=wav') ||
        stdout.includes('format_name=ogg')
      );
    } catch (error) {
      logger.error('Error validating audio file:', error);
      return false;
    }
  }

  static async processAudioFile(originalPath: string, destinationPath: string): Promise<boolean> {
    try {
      // Validate the audio file first
      const isValid = await this.validateAudioFile(originalPath);
      if (!isValid) {
        throw new Error('Invalid audio file format');
      }

      // Get the file extension
      const ext = path.extname(originalPath).toLowerCase();

      // If it's already in a supported format, just copy it
      if (['.mp3', '.wav', '.ogg'].includes(ext)) {
        await fs.copyFile(originalPath, destinationPath);
        return true;
      }

      // Convert to MP3 if it's in another format
      await execPromise(
        `ffmpeg -i "${originalPath}" -vn -ar 44100 -ac 2 -b:a 192k "${destinationPath}"`
      );
      return true;
    } catch (error) {
      logger.error('Error processing audio file:', error);
      throw new Error('Failed to process audio file');
    }
  }

  static prepareMediaContent(
    filePath: string,
    fileType: string,
    doorStates: Record<number, { win?: boolean }>,
    index: number
  ): MediaContent {
    try {
      switch (fileType) {
        case 'text': {
          const content = fsSync.readFileSync(filePath, 'utf8');
          const trimmed = content.trim();

          // Check for special content markers
          if (trimmed === '<[countdown]>') {
            return { type: 'countdown', meta: { targetDate: '', text: '' } };
          }
          if (trimmed.startsWith('{')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed?.type === 'countdown') {
                return {
                  type: 'countdown',
                  meta: {
                    targetDate:
                      typeof parsed.targetDate === 'string' ? parsed.targetDate : '',
                    text: typeof parsed.text === 'string' ? parsed.text : '',
                  },
                };
              }
            } catch {
              // Ignore JSON parse errors - treat as normal text below
            }
          }
          if (trimmed === '<[poll]>') {
            return { type: 'poll' };
          }
          if (trimmed === '<[puzzle]>') {
            return { type: 'puzzle' };
          }

          // Check for iframe content
          const iframeMatch = content.match(/<\[iframe\]>(.*?)<\[iframe\]>/);
          if (iframeMatch) {
            return {
              type: 'iframe',
              data: iframeMatch[1].trim(),
            };
          }

          return { type: 'text', data: content };
        }
        case 'audio':
          return { type: 'audio', data: `/api/media/${index}` };
        case 'video':
          return { type: 'video', data: `/api/media/${index}` };
        case 'image':
          return { type: 'image', data: `/api/media/${index}` };
        case 'gif':
          return { type: 'gif', data: `/api/media/${index}` };
        default:
          return { type: 'text' };
      }
    } catch (error) {
      logger.error('Error preparing media content:', error);
      return { type: 'text' };
    }
  }

  static getPuzzleImageIndex(doorNumber: number): number {
    return doorNumber + 1000;
  }

  static async savePuzzleData(doorNumber: number, filename: string): Promise<boolean> {
    try {
      const mediumContent = fsSync.existsSync(paths.mediumJsonPath)
        ? await fs.readFile(paths.mediumJsonPath, 'utf8')
        : '{}';
      const medium: MediumData = JSON.parse(mediumContent);

      // Save puzzle marker
      const puzzleMarkerPath = path.join(paths.mediaDir, `${doorNumber}.txt`);
      await fs.writeFile(puzzleMarkerPath, '<[puzzle]>');
      medium[doorNumber] = `${doorNumber}.txt`;

      // Save puzzle image
      const imageIndex = this.getPuzzleImageIndex(doorNumber);
      medium[imageIndex] = filename;

      await fs.writeFile(paths.mediumJsonPath, JSON.stringify(medium, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving puzzle data:', error);
      throw error;
    }
  }

  static async saveIframeContent(doorNumber: number, url: string): Promise<boolean> {
    try {
      const mediumContent = fsSync.existsSync(paths.mediumJsonPath)
        ? await fs.readFile(paths.mediumJsonPath, 'utf8')
        : '{}';
      const medium: MediumData = JSON.parse(mediumContent);

      // Create content file with iframe tag
      const filename = `${doorNumber}.txt`;
      const filePath = path.join(paths.mediaDir, filename);
      await fs.writeFile(filePath, `<[iframe]>${url}<[iframe]>`);

      // Update medium.json
      medium[doorNumber] = filename;
      await fs.writeFile(paths.mediumJsonPath, JSON.stringify(medium, null, 2));

      return true;
    } catch (error) {
      logger.error('Error saving iframe content:', error);
      throw error;
    }
  }

  static async saveCountdownContent(
    doorNumber: number,
    options?: { targetDate?: string; text?: string }
  ): Promise<boolean> {
    try {
      const mediumContent = fsSync.existsSync(paths.mediumJsonPath)
        ? await fs.readFile(paths.mediumJsonPath, 'utf8')
        : '{}';
      const medium: MediumData = JSON.parse(mediumContent);

      const filename = `${doorNumber}.txt`;
      const filePath = path.join(paths.mediaDir, filename);
      const targetDate =
        options?.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(options.targetDate)
          ? options.targetDate
          : '';
      const payload = {
        type: 'countdown',
        targetDate,
        text: options?.text ?? '',
      };
      await fs.writeFile(filePath, JSON.stringify(payload, null, 2));

      medium[doorNumber] = filename;
      await fs.writeFile(paths.mediumJsonPath, JSON.stringify(medium, null, 2));

      return true;
    } catch (error) {
      logger.error('Error saving countdown content:', error);
      throw error;
    }
  }

  static async savePollMarker(doorNumber: number): Promise<boolean> {
    try {
      const mediumContent = fsSync.existsSync(paths.mediumJsonPath)
        ? await fs.readFile(paths.mediumJsonPath, 'utf8')
        : '{}';
      const medium: MediumData = JSON.parse(mediumContent);

      const filename = `${doorNumber}.txt`;
      const filePath = path.join(paths.mediaDir, filename);
      await fs.writeFile(filePath, '<[poll]>');

      medium[doorNumber] = filename;
      await fs.writeFile(paths.mediumJsonPath, JSON.stringify(medium, null, 2));

      return true;
    } catch (error) {
      logger.error('Error saving poll marker:', error);
      throw error;
    }
  }

  static async saveTextContent(doorNumber: number, text: string): Promise<boolean> {
    try {
      const mediumContent = fsSync.existsSync(paths.mediumJsonPath)
        ? await fs.readFile(paths.mediumJsonPath, 'utf8')
        : '{}';
      const medium: MediumData = JSON.parse(mediumContent);

      const filename = `${doorNumber}.txt`;
      const filePath = path.join(paths.mediaDir, filename);
      await fs.writeFile(filePath, text);

      medium[doorNumber] = filename;
      await fs.writeFile(paths.mediumJsonPath, JSON.stringify(medium, null, 2));

      return true;
    } catch (error) {
      logger.error('Error saving text content:', error);
      throw error;
    }
  }

  static async saveMediaFile(doorNumber: number, filename: string): Promise<boolean> {
    try {
      const mediumContent = fsSync.existsSync(paths.mediumJsonPath)
        ? await fs.readFile(paths.mediumJsonPath, 'utf8')
        : '{}';
      const medium: MediumData = JSON.parse(mediumContent);

      medium[doorNumber] = filename;
      await fs.writeFile(paths.mediumJsonPath, JSON.stringify(medium, null, 2));

      return true;
    } catch (error) {
      logger.error('Error saving media file:', error);
      throw error;
    }
  }

  static async deleteContent(doorNumber: number): Promise<boolean> {
    try {
      if (!fsSync.existsSync(paths.mediumJsonPath)) {
        return false;
      }

      const mediumContent = await fs.readFile(paths.mediumJsonPath, 'utf8');
      const medium: MediumData = JSON.parse(mediumContent);

      if (!medium[doorNumber]) {
        return false;
      }

      const filename = medium[doorNumber];
      const filePath = path.join(paths.mediaDir, filename);

      // Check if content is a puzzle
      if (filename.endsWith('.txt') && fsSync.existsSync(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        if (content.trim() === '<[puzzle]>') {
          // Delete associated puzzle image
          const imageIndex = this.getPuzzleImageIndex(doorNumber);
          if (medium[imageIndex]) {
            const puzzleImagePath = path.join(paths.mediaDir, medium[imageIndex]);
            if (fsSync.existsSync(puzzleImagePath)) {
              await FileUtils.deleteFileWithRetry(puzzleImagePath);
            }
            delete medium[imageIndex];
          }
        }
      }

      // Delete the main content file
      if (fsSync.existsSync(filePath)) {
        await FileUtils.deleteFileWithRetry(filePath);
      }

      // Delete associated message if exists
      const messagePath = path.join(paths.messagesDir, `${doorNumber}.txt`);
      if (fsSync.existsSync(messagePath)) {
        await FileUtils.deleteFileWithRetry(messagePath);
      }

      // Delete from medium.json
      delete medium[doorNumber];
      await fs.writeFile(paths.mediumJsonPath, JSON.stringify(medium, null, 2));

      return true;
    } catch (error) {
      logger.error('Error deleting content:', error);
      throw error;
    }
  }

  static async getAllDoors(): Promise<MediumData> {
    try {
      if (!fsSync.existsSync(paths.mediumJsonPath)) {
        return {};
      }
      const content = await fs.readFile(paths.mediumJsonPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error('Error reading all doors:', error);
      return {};
    }
  }

  static initializeMediumJson(): void {
    if (!fsSync.existsSync(paths.mediumJsonPath)) {
      FileUtils.ensureDirectoryExists(paths.dataDir);
      fsSync.writeFileSync(paths.mediumJsonPath, JSON.stringify({}), 'utf8');
    }
  }
}
