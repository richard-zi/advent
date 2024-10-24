/**
 * @fileoverview /backend/services/pollService.js
 * Poll Service
 * 
 * Verwaltet die Umfragefunktionalität des Adventskalenders.
 * Behandelt das Speichern und Abrufen von Umfragedaten und Abstimmungen.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const paths = require('../config/paths');

class PollService {
  static pollsDir = path.join(paths.rootDir, 'polls');
  static pollDataFile = path.join(this.pollsDir, 'pollData.json');
  static pollVotesFile = path.join(this.pollsDir, 'pollVotes.json');

  /**
   * Initialisiert die notwendigen Verzeichnisse und Dateien für Polls
   */
  static initializePolls() {
    if (!fs.existsSync(this.pollsDir)) {
      fs.mkdirSync(this.pollsDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.pollDataFile)) {
      fs.writeFileSync(this.pollDataFile, JSON.stringify({}));
    }

    if (!fs.existsSync(this.pollVotesFile)) {
      fs.writeFileSync(this.pollVotesFile, JSON.stringify({}));
    }
  }

  /**
   * Lädt die Umfragedaten für ein bestimmtes Türchen
   * @param {number} doorNumber - Nummer des Türchens
   * @returns {Promise<Object|null>} Die Umfragedaten oder null
   */
  static async getPollData(doorNumber) {
    try {
      const pollData = JSON.parse(fs.readFileSync(this.pollDataFile, 'utf8'));
      return pollData[doorNumber] || null;
    } catch (error) {
      logger.error('Error getting poll data:', error);
      return null;
    }
  }

  /**
   * Speichert neue Umfragedaten für ein Türchen
   * @param {number} doorNumber - Nummer des Türchens
   * @param {Object} data - Die zu speichernden Umfragedaten
   * @returns {Promise<boolean>} True wenn erfolgreich gespeichert
   */
  static async setPollData(doorNumber, data) {
    try {
      const pollData = JSON.parse(fs.readFileSync(this.pollDataFile, 'utf8'));
      pollData[doorNumber] = data;
      fs.writeFileSync(this.pollDataFile, JSON.stringify(pollData, null, 2));
      return true;
    } catch (error) {
      logger.error('Error setting poll data:', error);
      return false;
    }
  }

  /**
   * Speichert eine neue Abstimmung
   * @param {number} doorNumber - Nummer des Türchens
   * @param {string} option - Die gewählte Option
   * @param {string} userId - ID des abstimmenden Users
   * @returns {Promise<Object>} Ergebnis der Abstimmung
   */
  static async vote(doorNumber, option, userId) {
    try {
      const votes = JSON.parse(fs.readFileSync(this.pollVotesFile, 'utf8'));
      
      // Prüfe ob User bereits abgestimmt hat
      if (votes[doorNumber]?.voters?.[userId]) {
        return { success: false, message: 'Already voted' };
      }

      // Initialisiere Türchen wenn noch nicht vorhanden
      if (!votes[doorNumber]) {
        votes[doorNumber] = { options: {}, voters: {} };
      }

      // Initialisiere Option wenn noch nicht vorhanden
      if (!votes[doorNumber].options[option]) {
        votes[doorNumber].options[option] = 0;
      }

      // Speichere Abstimmung
      votes[doorNumber].options[option]++;
      votes[doorNumber].voters[userId] = option;

      fs.writeFileSync(this.pollVotesFile, JSON.stringify(votes, null, 2));

      return { 
        success: true, 
        results: votes[doorNumber].options,
        userVote: option
      };
    } catch (error) {
      logger.error('Error recording vote:', error);
      return { success: false, message: 'Error recording vote' };
    }
  }

  /**
   * Lädt alle Abstimmungen für ein Türchen
   * @param {number} doorNumber - Nummer des Türchens
   * @returns {Promise<Object>} Die Abstimmungsergebnisse
   */
  static async getVotes(doorNumber) {
    try {
      const votes = JSON.parse(fs.readFileSync(this.pollVotesFile, 'utf8'));
      return votes[doorNumber]?.options || {};
    } catch (error) {
      logger.error('Error getting votes:', error);
      return {};
    }
  }

  /**
   * Prüft ob und wie ein User bereits abgestimmt hat
   * @param {number} doorNumber - Nummer des Türchens
   * @param {string} userId - ID des Users
   * @returns {Promise<string|null>} Die gewählte Option oder null
   */
  static async getUserVote(doorNumber, userId) {
    try {
      const votes = JSON.parse(fs.readFileSync(this.pollVotesFile, 'utf8'));
      return votes[doorNumber]?.voters?.[userId] || null;
    } catch (error) {
      logger.error('Error getting user vote:', error);
      return null;
    }
  }
}

module.exports = PollService;