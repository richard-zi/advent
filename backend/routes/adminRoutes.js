const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const util = require('util');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const AuthService = require('../services/authService');
const MediaService = require('../services/mediaService');
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/authMiddleware');
const paths = require('../config/paths');
const cacheService = require('../services/cacheService');

const router = express.Router();

// Configure multer for file uploads with size limit from environment variables
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paths.mediaDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB default
  }
});

// Helper Functions
async function deleteFileWithRetry(filePath, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }
      return true;
    } catch (error) {
      logger.warn(`Attempt ${attempt} failed to delete ${filePath}:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function safeReadJson(filePath) {
  try {
    if (!fsSync.existsSync(filePath)) {
      return null;
    }
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logger.error(`Error reading JSON file ${filePath}:`, error);
    return null;
  }
}

async function safeWriteJson(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    logger.error(`Error writing JSON file ${filePath}:`, error);
    throw error;
  }
}

// Routes
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const isValid = await AuthService.validateCredentials(username, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = AuthService.generateToken(username);
    res.json({ token });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true });
});

router.get('/api/doors', authMiddleware, async (req, res) => {
  try {
    const medium = await safeReadJson(path.join(paths.rootDir, 'medium.json'));
    res.json(medium || {});
  } catch (error) {
    logger.error('Error fetching doors:', error);
    res.status(500).json({ error: 'Error fetching doors' });
  }
});

router.get('/api/polls', authMiddleware, async (req, res) => {
  try {
    const pollsDir = path.join(paths.rootDir, 'polls');
    const pollDataPath = path.join(pollsDir, 'pollData.json');
    
    if (!fsSync.existsSync(pollDataPath)) {
      return res.json({});
    }

    const pollData = await safeReadJson(pollDataPath);
    res.json(pollData || {});
  } catch (error) {
    logger.error('Error fetching poll data:', error);
    res.status(500).json({ error: 'Error fetching poll data' });
  }
});

router.post('/api/upload/:doorNumber', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const doorNumber = parseInt(req.params.doorNumber);
    const { type, content, message } = req.body;
    
    if (!type || (!content && !req.file && type !== 'countdown')) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Read current medium.json
    const mediumPath = path.join(paths.rootDir, 'medium.json');
    const medium = await safeReadJson(mediumPath) || {};

    // Delete old files if they exist
    if (medium[doorNumber]) {
      const oldFilePath = path.join(paths.mediaDir, medium[doorNumber]);
      if (fsSync.existsSync(oldFilePath)) {
        await deleteFileWithRetry(oldFilePath);
      }

      const oldThumbnailPath = path.join(paths.thumbnailsDir, `thumb_${medium[doorNumber].split('.')[0]}.jpg`);
      if (fsSync.existsSync(oldThumbnailPath)) {
        await deleteFileWithRetry(oldThumbnailPath);
      }
    }

    try {
      if (type === 'iframe') {
        // Handle iframe content specifically
        const fileName = `${doorNumber}.txt`;
        const filePath = path.join(paths.mediaDir, fileName);
        await fs.writeFile(filePath, `<[iframe]>${content}<[iframe]>`);
        medium[doorNumber] = fileName;
      } else if (type === 'puzzle' && req.file) {
        await MediaService.savePuzzleData(doorNumber, req.file);
      } else if (type === 'text' || type === 'poll') {
        const fileName = `${doorNumber}.txt`;
        const filePath = path.join(paths.mediaDir, fileName);
        
        if (type === 'poll') {
          let pollData;
          try {
            pollData = JSON.parse(content);
            if (!pollData.question || !Array.isArray(pollData.options) || pollData.options.length === 0) {
              throw new Error('Invalid poll data format');
            }
          } catch (error) {
            return res.status(400).json({ error: 'Invalid poll data format' });
          }

          await MediaService.savePollData(doorNumber, pollData);
          await fs.writeFile(filePath, '<[poll]>');
        } else {
          await fs.writeFile(filePath, content);
        }
        
        medium[doorNumber] = fileName;
      } else if (type === 'countdown') {
        const fileName = `${doorNumber}.txt`;
        const filePath = path.join(paths.mediaDir, fileName);
        await fs.writeFile(filePath, '<[countdown]>');
        medium[doorNumber] = fileName;
      } else if (req.file) {
        medium[doorNumber] = req.file.filename;
      }

      // Handle additional message
      const messagePath = path.join(paths.messagesDir, `${doorNumber}.txt`);
      if (message) {
        await fs.writeFile(messagePath, message);
      } else if (fsSync.existsSync(messagePath)) {
        await deleteFileWithRetry(messagePath);
      }

      // Only save medium.json if we're not handling a puzzle (it's handled in savePuzzleData)
      if (type !== 'puzzle') {
        await safeWriteJson(mediumPath, medium);
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Error during content upload:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

router.delete('/api/content/:doorNumber', authMiddleware, async (req, res) => {
  const doorNumber = parseInt(req.params.doorNumber);
  const mediumPath = path.join(paths.rootDir, 'medium.json');
  
  try {
    const medium = await safeReadJson(mediumPath);
    if (!medium) {
      return res.status(500).json({ error: 'Error reading medium.json' });
    }

    const filename = medium[doorNumber];
    if (!filename) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const deletionPromises = [];

    // Delete the media file
    const mediaPath = path.join(paths.mediaDir, filename);
    if (fsSync.existsSync(mediaPath)) {
      deletionPromises.push(deleteFileWithRetry(mediaPath));
    }

    // Delete message file if exists
    const messagePath = path.join(paths.messagesDir, `${doorNumber}.txt`);
    if (fsSync.existsSync(messagePath)) {
      deletionPromises.push(deleteFileWithRetry(messagePath));
    }

    // Delete thumbnail if exists
    const thumbnailPath = path.join(paths.thumbnailsDir, `thumb_${filename.split('.')[0]}.jpg`);
    if (fsSync.existsSync(thumbnailPath)) {
      deletionPromises.push(deleteFileWithRetry(thumbnailPath));
    }

    // Wait for all deletions to complete
    await Promise.all(deletionPromises);

    // Update medium.json
    delete medium[doorNumber];
    await safeWriteJson(mediumPath, medium);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error in deletion process:', error);
    res.status(500).json({ error: 'Deletion failed: ' + error.message });
  }
});

router.post('/api/clear-cache', authMiddleware, async (req, res) => {
  try {
    const newTimestamp = cacheService.invalidateCache();
    res.json({ 
      success: true, 
      timestamp: newTimestamp,
      message: 'Cache successfully invalidated'
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

router.get('/api/cache-timestamp', async (req, res) => {
  try {
    const timestamp = cacheService.getLastResetTimestamp();
    res.json({ timestamp });
  } catch (error) {
    logger.error('Error getting cache timestamp:', error);
    res.status(500).json({ error: 'Failed to get cache timestamp' });
  }
});

module.exports = router;