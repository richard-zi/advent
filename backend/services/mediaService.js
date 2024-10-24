/**
 * @fileoverview /backend/services/mediaService.js
 * Media Service
 * 
 * Verwaltet alle Operationen im Zusammenhang mit Mediendateien.
 * Behandelt das Laden und Verarbeiten von Medieninhalten.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { getFileType } = require('../utils/fileUtils');
const paths = require('../config/paths');
const medium = require('../medium.json');

class MediaService {
  /**
   * Lädt eine Mediendatei anhand des Index
   * @param {number} index - Der Index der Mediendatei
   * @returns {Promise<string>} Der Pfad zur Mediendatei
   * @throws {Error} Wenn die Datei nicht gefunden wird
   */
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

  /**
   * Prüft ob die Datei eine Poll ist
   * @param {string} filePath - Pfad zur Datei
   * @returns {boolean} True wenn es sich um eine Poll handelt
   */
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

  /**
   * Prüft ob die Datei ein reiner Countdown ist
   * @param {string} filePath - Pfad zur Datei
   * @returns {boolean} True wenn es sich um einen Countdown handelt
   */
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

  /**
   * Lädt die zugehörige Nachrichtendatei für einen Index
   * @param {number} index - Der Index der Mediendatei
   * @returns {Promise<string|null>} Der Nachrichtentext oder null
   */
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

  /**
   * Bereitet die Medieninhalte für die API vor
   * @param {string} filePath - Pfad zur Mediendatei
   * @param {string} fileType - Typ der Datei
   * @returns {Object} Die aufbereiteten Medieninhalte
   */
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