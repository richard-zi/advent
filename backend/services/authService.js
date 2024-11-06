/**
 * @fileoverview /backend/services/authService.js
 * Authentifizierungs-Service
 * 
 * Dieser Service verwaltet die Benutzerauthentifizierung und Token-Generierung.
 * Er bietet Funktionen zur Überprüfung von Anmeldedaten und zur Verwaltung von JWT-Tokens.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

// Konfigurationskonstanten aus Umgebungsvariablen
const JWT_SECRET = process.env.JWT_SECRET;
const CREDENTIALS_FILE = path.join(__dirname, '../config/admin-credentials.json');

class AuthService {
  /**
   * Überprüft die eingegebenen Anmeldedaten gegen die gespeicherten Credentials
   * @param {string} username - Der eingegebene Benutzername
   * @param {string} password - Das eingegebene Passwort
   * @returns {Promise<boolean>} True wenn die Anmeldedaten gültig sind
   */
  static async validateCredentials(username, password) {
    try {
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
      
      if (credentials.username !== username) {
        return false;
      }

      return await bcrypt.compare(password, credentials.password);
    } catch (error) {
      logger.error('Fehler bei der Validierung der Anmeldedaten:', error);
      return false;
    }
  }

  /**
   * Generiert ein JWT-Token für einen authentifizierten Benutzer
   * @param {string} username - Der Benutzername für den das Token erstellt wird
   * @returns {string} Das generierte JWT-Token
   */
  static generateToken(username) {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  }

  /**
   * Initialisiert die Admin-Anmeldedaten bei der ersten Ausführung
   */
  static async initializeAdmin() {
    try {
      if (!fs.existsSync(CREDENTIALS_FILE)) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        const credentials = {
          username: process.env.ADMIN_USERNAME,
          password: hashedPassword
        };

        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
        logger.info('Admin-Anmeldedaten wurden initialisiert');
      }
    } catch (error) {
      logger.error('Fehler bei der Initialisierung der Admin-Anmeldedaten:', error);
      throw error;
    }
  }

  /**
   * Überprüft ein JWT-Token auf Gültigkeit
   * @param {string} token - Das zu überprüfende JWT-Token
   * @returns {Object|null} Die dekodierten Token-Daten oder null bei Ungültigkeit
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;