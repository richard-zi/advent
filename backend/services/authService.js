const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const CREDENTIALS_FILE = path.join(__dirname, '../config/admin-credentials.json');

class AuthService {
  static async validateCredentials(username, password) {
    try {
      // Read credentials from file
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
      
      if (credentials.username !== username) {
        return false;
      }

      return await bcrypt.compare(password, credentials.password);
    } catch (error) {
      logger.error('Error validating credentials:', error);
      return false;
    }
  }

  static generateToken(username) {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  }

  static async initializeAdmin(username, password) {
    try {
      // Only initialize if credentials file doesn't exist
      if (!fs.existsSync(CREDENTIALS_FILE)) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const credentials = {
          username,
          password: hashedPassword
        };

        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
        logger.info('Admin credentials initialized');
      }
    } catch (error) {
      logger.error('Error initializing admin credentials:', error);
      throw error;
    }
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;