/**
 * @fileoverview /backend/services/pollService.js
 * Umfrage-Service
 * 
 * Dieser Service verwaltet die Umfragefunktionalität des Adventskalenders.
 * Er behandelt das Speichern und Abrufen von Umfragedaten sowie die Verarbeitung von Abstimmungen.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const paths = require('../config/paths');

class PollService {
  // Definiere wichtige Verzeichnisse und Dateipfade
  static pollsDir = path.join(paths.rootDir, 'polls');
  static pollDataFile = path.join(this.pollsDir, 'pollData.json');
  static pollVotesFile = path.join(this.pollsDir, 'pollVotes.json');

  /**
   * Initialisiert die notwendige Verzeichnisstruktur für Umfragen
   */
  static initializePolls() {
    // Erstelle das Umfrageverzeichnis falls es nicht existiert
    if (!fs.existsSync(this.pollsDir)) {
      fs.mkdirSync(this.pollsDir, { recursive: true });
    }
    
    // Erstelle die Umfragedatendatei falls sie nicht existiert
    if (!fs.existsSync(this.pollDataFile)) {
      fs.writeFileSync(this.pollDataFile, JSON.stringify({}));
    }

    // Erstelle die Abstimmungsdatei falls sie nicht existiert
    if (!fs.existsSync(this.pollVotesFile)) {
      fs.writeFileSync(this.pollVotesFile, JSON.stringify({}));
    }
  }

  /**
   * Lädt die Umfragedaten für ein bestimmtes Türchen
   * @param {number} doorNumber - Die Türchennummer
   * @returns {Promise<Object|null>} Die Umfragedaten oder null
   */
  static async getPollData(doorNumber) {
    try {
      const pollData = JSON.parse(fs.readFileSync(this.pollDataFile, 'utf8'));
      return pollData[doorNumber] || null;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Umfragedaten:', error);
      return null;
    }
  }

  /**
   * Speichert eine Abstimmung für eine Umfrage
   * @param {number} doorNumber - Die Türchennummer
   * @param {string} option - Die gewählte Option
   * @param {string} userId - Die ID des abstimmenden Benutzers
   * @returns {Promise<Object>} Das Ergebnis der Abstimmung
   */
  static async vote(doorNumber, option, userId) {
    try {
      const votes = JSON.parse(fs.readFileSync(this.pollVotesFile, 'utf8'));
      
      // Prüfe ob der Benutzer bereits abgestimmt hat
      if (votes[doorNumber]?.voters?.[userId]) {
        return { success: false, message: 'Bereits abgestimmt' };
      }

      // Initialisiere die Datenstruktur für diese Umfrage falls nötig
      if (!votes[doorNumber]) {
        votes[doorNumber] = { options: {}, voters: {} };
      }

      // Initialisiere den Zähler für diese Option falls nötig
      if (!votes[doorNumber].options[option]) {
        votes[doorNumber].options[option] = 0;
      }

      // Erfasse die Abstimmung
      votes[doorNumber].options[option]++;
      votes[doorNumber].voters[userId] = option;

      // Speichere die aktualisierten Abstimmungsdaten
      fs.writeFileSync(this.pollVotesFile, JSON.stringify(votes, null, 2));

      return { 
        success: true, 
        results: votes[doorNumber].options,
        userVote: option
      };
    } catch (error) {
      logger.error('Fehler beim Erfassen der Abstimmung:', error);
      return { success: false, message: 'Fehler beim Erfassen der Abstimmung' };
    }
  }

  /**
   * Ruft die Abstimmungsergebnisse für ein Türchen ab
   * @param {number} doorNumber - Die Türchennummer
   * @returns {Promise<Object>} Die Abstimmungsergebnisse
   */
  static async getVotes(doorNumber) {
    try {
      const votes = JSON.parse(fs.readFileSync(this.pollVotesFile, 'utf8'));
      return votes[doorNumber]?.options || {};
    } catch (error) {
      logger.error('Fehler beim Abrufen der Abstimmungen:', error);
      return {};
    }
  }

  /**
   * Prüft die Abstimmung eines bestimmten Benutzers
   * @param {number} doorNumber - Die Türchennummer
   * @param {string} userId - Die Benutzer-ID
   * @returns {Promise<string|null>} Die gewählte Option oder null
   */
  static async getUserVote(doorNumber, userId) {
    try {
      const votes = JSON.parse(fs.readFileSync(this.pollVotesFile, 'utf8'));
      return votes[doorNumber]?.voters?.[userId] || null;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Benutzerabstimmung:', error);
      return null;
    }
  }
}

module.exports = PollService;