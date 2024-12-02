const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const logger = require('./logger');
const { promisify } = require('util');
const glob = promisify(require('glob'));

class FileUtils {
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static getFileType(filename) {
    if (!filename) return 'unknown';
    
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.txt':
      case '.md':
        return 'text';
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.webp':
        return 'image';
      case '.mp4':
      case '.webm':
      case '.mov':
        return 'video';
      case '.gif':
        return 'gif';
      case '.mp3':
      case '.wav':
      case '.ogg':
        return 'audio';
      default:
        return 'unknown';
    }
  }

  static async cleanupTempFiles() {
    try {
      const tempFiles = await glob('*.tmp', { cwd: process.cwd() });
      await Promise.all(tempFiles.map(file => fs.unlink(file)));
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
    }
  }

  static async readTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      logger.error(`Error reading text file ${filePath}:`, error);
      return null;
    }
  }

  static parseIframeUrl(content) {
    try {
      const match = content.match(/<\[iframe\]>(.*?)<\[iframe\]>/);
      return match ? match[1] : null;
    } catch (error) {
      logger.error('Error parsing iframe URL:', error);
      return null;
    }
  }
}

module.exports = FileUtils;