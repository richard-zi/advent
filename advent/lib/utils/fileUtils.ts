import fs from 'fs';
import path from 'path';
import { paths } from '../config/paths';

export type FileType = 'text' | 'image' | 'video' | 'gif' | 'audio' | 'unknown';

export class FileUtils {
  static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  static getFileType(filename: string): FileType {
    const ext = path.extname(filename).toLowerCase();
    const typeMap: Record<string, FileType> = {
      '.txt': 'text',
      '.md': 'text',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.webp': 'image',
      '.mp4': 'video',
      '.webm': 'video',
      '.mov': 'video',
      '.gif': 'gif',
      '.mp3': 'audio',
      '.wav': 'audio',
      '.ogg': 'audio',
    };
    return typeMap[ext] || 'unknown';
  }

  static cleanupTempFiles(): void {
    const dirs = [paths.mediaDir, paths.thumbnailsDir];
    dirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files
          .filter((file) => file.endsWith('.tmp'))
          .forEach((file) => {
            try {
              fs.unlinkSync(path.join(dir, file));
            } catch (error) {
              // Ignore errors
            }
          });
      }
    });
  }

  static readTextFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf8');
  }

  static parseIframeUrl(content: string): string | null {
    const iframeMarker = '<[iframe]>';
    if (content.includes(iframeMarker)) {
      const parts = content.split(iframeMarker);
      return parts[1] || null;
    }
    return null;
  }

  static async deleteFileWithRetry(
    filePath: string,
    maxRetries = 3,
    delay = 100
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
