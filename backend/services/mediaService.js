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
   * Ermittelt den Typ einer Mediendatei
   * @param {string} filename - Der Dateiname
   * @returns {string} Der Medientyp
   */
  static getMediaType(filename) {
    return getFileType(filename);
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
}

module.exports = MediaService;