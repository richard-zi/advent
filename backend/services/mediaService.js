/**
 * @fileoverview /backend/services/mediaService.js
 * Medien-Service
 * 
 * Dieser Service ist für die Verwaltung und Verarbeitung von Mediendateien zuständig.
 * Er bietet Funktionen zum Abrufen, Überprüfen und Vorbereiten von Medieninhalten.
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
      // Überprüfe ob der Index gültig ist und die Datei existiert
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
   * Prüft ob die Datei ein Puzzle ist.
   * @param {string} filePath - Pfad zur Datei
   * @returns {boolean} True wenn es sich um einen Puzzle handelt
   */
  static isPuzzle(filePath){
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
   * Übersetzt den Puzzleindex in einen weiteren Medienindex für das Hintergrundbild
   * @param {int} index - Index zu dem Puzzle
   * @returns {int} Index zu dem verknüpften Medium (ein Bild)
   */
  static getPuzzleImageIndex(index){
    return index + timingService.loopAround
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
   * @returns {Object} Der aufbereitete Medieninhalt
   */
  static prepareMediaContent(filePath, fileType) {
    // Prüfe auf spezielle Inhaltstypen
    if (fileType === 'text' && this.isCountdown(filePath)) {
      return { type: 'countdown', data: null };
    }

    if (fileType === 'text' && this.isPoll(filePath)) {
      return { type: 'poll', data: null };
    }

    if (fileType === 'text' && this.isPuzzle(filePath)) {
      return {
        type: 'puzzle',
        data: null
      };
    }

    let data = '';
    if (fileType === 'text') {
      data = fs.readFileSync(filePath, 'utf8').toString();
    }

    return { type: fileType, data };
  }
}

module.exports = MediaService;