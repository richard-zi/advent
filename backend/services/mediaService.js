const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { getFileType } = require('../utils/fileUtils');
const paths = require('../config/paths');
const medium = require('../medium.json');

class MediaService {
  static async getMediaFile(index) {
    try {
      if (isNaN(index) || medium[index] === undefined) {
        throw new Error('File not found');
      }
      
      const filePath = path.join(paths.mediaDir, medium[index]);
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }
      
      return filePath;
    } catch (error) {
      logger.error('Error getting media file:', error);
      throw error;
    }
  }

  static getMediaType(filename) {
    return getFileType(filename);
  }

  static async getMediaMessage(index) {
    try {
      const messagePath = path.join(paths.messagesDir, `${index}.txt`);
      if (fs.existsSync(messagePath)) {
        return fs.readFileSync(messagePath, 'utf8').toString();
      }
      return null;
    } catch (error) {
      logger.error('Error reading message file:', error);
      return null;
    }
  }
}

module.exports = MediaService;