/**
 * @fileoverview /backend/services/mediaService.js
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { getFileType } = require('../utils/fileUtils');
const paths = require('../config/paths');
const medium = require('../medium.json');
const timingService = require('./timingService');

class MediaService {
  /**
   * Holt eine Mediendatei anhand ihres Index
   * @param {number} index - Der Index der Mediendatei
   * @returns {Promise<string>} Der Dateipfad der Mediendatei
   */
  static async getMediaFile(index) {
    try {
      if (isNaN(index) || medium[index] === undefined) {
        throw new Error('Datei nicht gefunden');
      }
      
      const filePath = path.join(paths.mediaDir, medium[index]);
      if (!fs.existsSync(filePath)) {
        throw new Error('Datei nicht gefunden');
      }
      
      return filePath;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Mediendatei:', error);
      throw error;
    }
  }

  /**
   * Speichert die Daten für ein Puzzle
   * @param {number} doorNumber - Die Türnummer
   * @param {Object} data - Die Puzzledaten
   * @returns {Promise<void>}
   */
  /**
   * Speichert die Daten für ein Puzzle
   * @param {number} doorNumber - Die Türnummer
   * @param {Object} puzzleFile - Die hochgeladene Bilddatei
   * @returns {Promise<void>}
   */
  static async savePuzzleData(doorNumber, puzzleFile) {
    try {
      const mediumPath = path.join(paths.rootDir, 'medium.json');
      const mediumContent = JSON.parse(await fs.promises.readFile(mediumPath, 'utf8'));

      // 1. Speichere den Puzzle-Marker
      const puzzleMarkerFile = `${doorNumber}.txt`;
      const puzzleMarkerPath = path.join(paths.mediaDir, puzzleMarkerFile);
      await fs.promises.writeFile(puzzleMarkerPath, '<[puzzle]>');
      mediumContent[doorNumber] = puzzleMarkerFile;

      // 2. Speichere das Puzzle-Bild
      const imageIndex = this.getPuzzleImageIndex(doorNumber);
      const imageExt = path.extname(puzzleFile.originalname);
      const imageFilename = `${imageIndex}${imageExt}`;
      const imagePath = path.join(paths.mediaDir, imageFilename);

      // Verschiebe das hochgeladene Bild
      await fs.promises.rename(puzzleFile.path, imagePath);
      mediumContent[imageIndex] = imageFilename;

      // Speichere die aktualisierte medium.json
      await fs.promises.writeFile(mediumPath, JSON.stringify(mediumContent, null, 2));
    } catch (error) {
      logger.error('Fehler beim Speichern der Puzzle-Daten:', error);
      throw error;
    }
  }


  /**
   * Prüft ob eine Datei eine Umfrage enthält
   * @param {string} filePath - Der zu prüfende Dateipfad
   * @returns {boolean} True wenn es sich um eine Umfrage handelt
   */
  static isPoll(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8').toString().trim();
      return content === '<[poll]>';
    } catch (error) {
      logger.error('Fehler bei der Umfrageüberprüfung:', error);
      return false;
    }
  }

  /**
   * Prüft ob eine Datei einen Countdown enthält
   * @param {string} filePath - Der zu prüfende Dateipfad
   * @returns {boolean} True wenn es sich um einen Countdown handelt
   */
  static isCountdown(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8').toString().trim();
      return content === '<[countdown]>';
    } catch (error) {
      logger.error('Fehler bei der Countdown-Überprüfung:', error);
      return false;
    }
  }

  /**
   * Prüft ob die Datei ein Puzzle ist
   * @param {string} filePath - Pfad zur Datei
   * @returns {boolean} True wenn es sich um ein Puzzle handelt
   */
  static isPuzzle(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8').toString().trim();
      return content === '<[puzzle]>';
    } catch (error) {
      logger.error('Error checking puzzle:', error);
      return false;
    }
  }

  /**
   * Übersetzt den Puzzle-Index in einen weiteren Medienindex für das Hintergrundbild
   * @param {number} index - Index zu dem Puzzle
   * @returns {number} Index zu dem verknüpften Medium (ein Bild)
   */
  static getPuzzleImageIndex(index) {
    return index + timingService.loopAround;
  }

  /**
   * Holt eine zusätzliche Nachricht zu einer Mediendatei
   * @param {number} index - Der Index der Mediendatei
   * @returns {Promise<string|null>} Die zugehörige Nachricht oder null
   */
  static async getMediaMessage(index) {
    try {
      const messagePath = path.join(paths.messagesDir, `${index}.txt`);
      if (fs.existsSync(messagePath)) {
        return fs.readFileSync(messagePath, 'utf8').toString();
      }
      return null;
    } catch (error) {
      logger.error('Fehler beim Lesen der Nachrichtendatei:', error);
      return null;
    }
  }

  /**
   * Bereitet den Medieninhalt für die Auslieferung vor
   * @param {string} filePath - Der Dateipfad der Mediendatei
   * @param {string} fileType - Der Typ der Mediendatei
   * @param {Object} doorStates - Der Status der Türen
   * @param {number} doorNumber - Die Türchennummer
   * @returns {Object} Der aufbereitete Medieninhalt
   */
  static prepareMediaContent(filePath, fileType, doorStates = {}, doorNumber) {
    if (fileType === 'text' && this.isPuzzle(filePath)) {
      const imageIndex = this.getPuzzleImageIndex(doorNumber);
      const imageFilename = medium[imageIndex];
      let imageUrl = null;
      
      if (imageFilename) {
        imageUrl = `/media/${imageIndex}`;
      }

      return {
        type: 'puzzle',
        data: imageUrl,
        isSolved: doorStates[doorNumber]?.win || false
      };
    }

    // Andere Inhaltstypen wie bisher...
    if (fileType === 'text' && this.isCountdown(filePath)) {
      return { type: 'countdown', data: null };
    }

    if (fileType === 'text' && this.isPoll(filePath)) {
      return { type: 'poll', data: null };
    }

    let data = '';
    if (fileType === 'text') {
      data = fs.readFileSync(filePath, 'utf8').toString();
    }

    return { type: fileType, data };
  }
}

module.exports = MediaService;