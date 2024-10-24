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

  static isPoll(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8').toString().trim();
      return content === '<[poll]>';
    } catch (error) {
      logger.error('Error checking poll:', error);
      return false;
    }
  }

  static isCountdown(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8').toString().trim();
      return content === '<[countdown]>';
    } catch (error) {
      logger.error('Error checking countdown:', error);
      return false;
    }
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

  static async savePollData(doorNumber, pollData) {
    try {
      const pollsDir = path.join(paths.rootDir, 'polls');
      const pollDataPath = path.join(pollsDir, 'pollData.json');
      
      // Ensure polls directory exists
      if (!fs.existsSync(pollsDir)) {
        fs.mkdirSync(pollsDir, { recursive: true });
      }

      // Read existing poll data or create new object
      let allPollData = {};
      if (fs.existsSync(pollDataPath)) {
        allPollData = JSON.parse(fs.readFileSync(pollDataPath, 'utf8'));
      }

      // Update poll data for this door
      allPollData[doorNumber] = {
        question: pollData.question,
        options: pollData.options
      };

      // Save updated poll data
      fs.writeFileSync(pollDataPath, JSON.stringify(allPollData, null, 2));
      
      // Initialize votes file if it doesn't exist
      const pollVotesPath = path.join(pollsDir, 'pollVotes.json');
      if (!fs.existsSync(pollVotesPath)) {
        fs.writeFileSync(pollVotesPath, JSON.stringify({}));
      }

      return true;
    } catch (error) {
      logger.error('Error saving poll data:', error);
      throw error;
    }
  }

  static prepareMediaContent(filePath, fileType) {
    if (fileType === 'text' && this.isCountdown(filePath)) {
      return {
        type: 'countdown',
        data: null
      };
    }

    if (fileType === 'text' && this.isPoll(filePath)) {
      return {
        type: 'poll',
        data: null
      };
    }

    let data = '';
    if (fileType === 'text') {
      data = fs.readFileSync(filePath, 'utf8').toString();
    }

    return {
      type: fileType,
      data
    };
  }
}

module.exports = MediaService;