const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../utils/logger');
const FileUtils = require('../utils/fileUtils');
const paths = require('../config/paths');
const TimingService = require('./timingService');

class MediaService {
  static async getMediaFile(index) {
    try {
      const mediumContent = await fs.readFile(path.join(paths.rootDir, 'medium.json'), 'utf8');
      const medium = JSON.parse(mediumContent);
      
      if (!medium[index]) {
        throw new Error('File not found');
      }
      
      return path.join(paths.mediaDir, medium[index]);
    } catch (error) {
      logger.error('Error reading media file:', error);
      throw error;
    }
  }

  static async getMediaMessage(index) {
    try {
      const messagePath = path.join(paths.messagesDir, `${index}.txt`);
      const exists = await FileUtils.fileExists(messagePath);
      
      if (!exists) {
        return null;
      }
      
      return await fs.readFile(messagePath, 'utf8');
    } catch (error) {
      logger.error('Error reading message file:', error);
      return null;
    }
  }

  static async updateMessage(index, message) {
    try {
      const messagePath = path.join(paths.messagesDir, `${index}.txt`);
      await fs.writeFile(messagePath, message);
      return true;
    } catch (error) {
      logger.error('Error updating message file:', error);
      return false;
    }
  }

  static async validateAudioFile(filePath) {
    try {
      const { stdout } = await execPromise(`ffprobe -i "${filePath}" -show_format -v quiet`);
      return stdout.includes('format_name=mp3') || 
             stdout.includes('format_name=wav') || 
             stdout.includes('format_name=ogg');
    } catch (error) {
      logger.error('Error validating audio file:', error);
      return false;
    }
  }

  static async processAudioFile(originalPath, destinationPath) {
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
      await execPromise(`ffmpeg -i "${originalPath}" -vn -ar 44100 -ac 2 -b:a 192k "${destinationPath}"`);
      return true;
    } catch (error) {
      logger.error('Error processing audio file:', error);
      throw new Error('Failed to process audio file');
    }
  }

  static async handleAudioUpload(file, doorNumber) {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const newFilename = `${doorNumber}${ext}`;
      const destinationPath = path.join(paths.mediaDir, newFilename);

      // Process the audio file
      await this.processAudioFile(file.path, destinationPath);

      // Update medium.json
      const mediumPath = path.join(paths.rootDir, 'medium.json');
      const medium = JSON.parse(await fs.readFile(mediumPath, 'utf8'));
      medium[doorNumber] = newFilename;
      await fs.writeFile(mediumPath, JSON.stringify(medium, null, 2));

      // Clean up the temporary file
      await fs.unlink(file.path);

      return newFilename;
    } catch (error) {
      logger.error('Error handling audio upload:', error);
      throw error;
    }
  }

  static prepareMediaContent(filePath, fileType, doorStates, index) {
    try {
      switch (fileType) {
        case 'text': {
          const content = fsSync.readFileSync(filePath, 'utf8');
          
          // Check for special content markers
          if (content.trim() === '<[countdown]>') {
            return { type: 'countdown' };
          }
          if (content.trim() === '<[poll]>') {
            return { type: 'poll' };
          }
          if (content.trim() === '<[puzzle]>') {
            return { type: 'puzzle' };
          }
          
          // Check for iframe content
          const iframeMatch = content.match(/<\[iframe\]>(.*?)<\[iframe\]>/);
          if (iframeMatch) {
            return { 
              type: 'iframe',
              data: iframeMatch[1].trim()
            };
          }

          // Return regular text content
          return { type: 'text', data: content };
        }
        case 'audio': {
          // Verify the audio file exists and is readable
          if (!fsSync.existsSync(filePath)) {
            logger.error(`Audio file not found: ${filePath}`);
            return { type: 'error', error: 'Audio file not found' };
          }

          try {
            fsSync.accessSync(filePath, fsSync.constants.R_OK);
            return { type: 'audio' };
          } catch (error) {
            logger.error(`Audio file not readable: ${filePath}`, error);
            return { type: 'error', error: 'Audio file not accessible' };
          }
        }
        case 'video':
          return { type: 'video' };
        case 'image':
          return { type: 'image' };
        case 'gif':
          return { type: 'gif' };
        default:
          return { type: 'unknown' };
      }
    } catch (error) {
      logger.error('Error preparing media content:', error);
      return { type: 'error', error: 'Failed to prepare media content' };
    }
  }

  static getPuzzleImageIndex(doorNumber) {
    return doorNumber + TimingService.loopAround;
  }

  static async savePuzzleData(doorNumber, file) {
    try {
      const mediumPath = path.join(paths.rootDir, 'medium.json');
      const medium = JSON.parse(await fs.readFile(mediumPath, 'utf8'));
      
      // Save puzzle marker
      const puzzleMarkerPath = path.join(paths.mediaDir, `${doorNumber}.txt`);
      await fs.writeFile(puzzleMarkerPath, '<[puzzle]>');
      medium[doorNumber] = `${doorNumber}.txt`;

      // Save puzzle image
      const imageIndex = this.getPuzzleImageIndex(doorNumber);
      medium[imageIndex] = file.filename;
      
      await fs.writeFile(mediumPath, JSON.stringify(medium, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving puzzle data:', error);
      throw error;
    }
  }

  static async saveIframeContent(doorNumber, url, message = null) {
    try {
      const mediumPath = path.join(paths.rootDir, 'medium.json');
      const medium = JSON.parse(await fs.readFile(mediumPath, 'utf8'));

      // Create content file with iframe tag
      const filename = `${doorNumber}.txt`;
      const filePath = path.join(paths.mediaDir, filename);
      await fs.writeFile(filePath, `<[iframe]>${url}<[iframe]>`);

      // Update medium.json
      medium[doorNumber] = filename;
      await fs.writeFile(mediumPath, JSON.stringify(medium, null, 2));

      // Save additional message if provided
      if (message) {
        await this.updateMessage(doorNumber, message);
      }

      return true;
    } catch (error) {
      logger.error('Error saving iframe content:', error);
      throw error;
    }
  }

  static async deleteContent(doorNumber) {
    try {
      const mediumPath = path.join(paths.rootDir, 'medium.json');
      const medium = JSON.parse(await fs.readFile(mediumPath, 'utf8'));

      if (!medium[doorNumber]) {
        return false;
      }

      const filename = medium[doorNumber];
      const filePath = path.join(paths.mediaDir, filename);
      
      // Check if content is a puzzle
      if (filename.endsWith('.txt')) {
        const content = await fs.readFile(filePath, 'utf8');
        if (content.trim() === '<[puzzle]>') {
          // Delete associated puzzle image
          const imageIndex = this.getPuzzleImageIndex(doorNumber);
          if (medium[imageIndex]) {
            const puzzleImagePath = path.join(paths.mediaDir, medium[imageIndex]);
            if (fsSync.existsSync(puzzleImagePath)) {
              await fs.unlink(puzzleImagePath);
            }
            delete medium[imageIndex];
          }
        }
      }

      // Delete the main content file
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }

      // Delete associated message if exists
      const messagePath = path.join(paths.messagesDir, `${doorNumber}.txt`);
      if (fsSync.existsSync(messagePath)) {
        await fs.unlink(messagePath);
      }

      // Delete from medium.json
      delete medium[doorNumber];
      await fs.writeFile(mediumPath, JSON.stringify(medium, null, 2));

      return true;
    } catch (error) {
      logger.error('Error deleting content:', error);
      throw error;
    }
  }
}

module.exports = MediaService;