const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const paths = require('../config/paths');

class FileUtils {
  static getFileType(filename) {
    const extension = path.extname(filename).toLowerCase();
    switch (extension) {
      case '.png':
      case '.jpg':
      case '.jpeg':
        return 'image';
      case '.gif':
        return 'gif';
      case '.mp4':
      case '.m4a':
      case '.mov':
        return 'video';
      case '.mp3':
      case '.ogg':
      case '.wav':
        return 'audio';
      case '.txt':
      case '.md':
        return 'text';
      default:
        return 'unknown';
    }
  }

  static cleanupTempFiles() {
    if (fs.existsSync(paths.thumbnailsDir)) {
      try {
        const files = fs.readdirSync(paths.thumbnailsDir);
        files.forEach(file => {
          if (file.includes('_temp')) {
            try {
              fs.unlinkSync(path.join(paths.thumbnailsDir, file));
              logger.info('Deleted temporary file:', file);
            } catch (error) {
              logger.warn('Could not delete temporary file:', file);
            }
          }
        });
      } catch (error) {
        logger.error('Error cleaning up temporary files:', error);
      }
    }
  }

  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

module.exports = FileUtils;