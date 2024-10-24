const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;  // Promises version of fs
const fsSync = require('fs');       // Synchronous version of fs
const util = require('util');
const sleep = util.promisify(setTimeout);
const AuthService = require('../services/authService');
const MediaService = require('../services/mediaService');
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/authMiddleware');
const paths = require('../config/paths');

const router = express.Router();

// Configure multer for file uploads
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
    fileSize: 50 * 1024 * 1024, // 50MB limit
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
      
      await sleep(delayMs);
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

    // Handle different content types
    if (type === 'text' || type === 'poll') {
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

    // Save medium.json
    await safeWriteJson(mediumPath, medium);

    // Handle additional message
    const messagePath = path.join(paths.messagesDir, `${doorNumber}.txt`);
    if (message) {
      await fs.writeFile(messagePath, message);
    } else if (fsSync.existsSync(messagePath)) {
      await deleteFileWithRetry(messagePath);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.delete('/api/content/:doorNumber', authMiddleware, async (req, res) => {
  const doorNumber = parseInt(req.params.doorNumber);
  const mediumPath = path.join(paths.rootDir, 'medium.json');
  
  try {
    // Read medium.json
    const medium = await safeReadJson(mediumPath);
    if (!medium) {
      return res.status(500).json({ error: 'Error reading medium.json' });
    }

    const filename = medium[doorNumber];
    if (!filename) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const deletionPromises = [];

    // 1. Handle media file
    const mediaPath = path.join(paths.mediaDir, filename);
    if (fsSync.existsSync(mediaPath)) {
      // Check for poll content
      if (filename.endsWith('.txt')) {
        try {
          const content = await fs.readFile(mediaPath, 'utf8');
          if (content.trim() === '<[poll]>') {
            // Delete poll data
            const pollsDir = path.join(paths.rootDir, 'polls');
            const pollDataPath = path.join(pollsDir, 'pollData.json');
            const pollVotesPath = path.join(pollsDir, 'pollVotes.json');

            if (fsSync.existsSync(pollDataPath)) {
              const pollData = await safeReadJson(pollDataPath);
              if (pollData) {
                delete pollData[doorNumber];
                deletionPromises.push(safeWriteJson(pollDataPath, pollData));
              }
            }

            if (fsSync.existsSync(pollVotesPath)) {
              const pollVotes = await safeReadJson(pollVotesPath);
              if (pollVotes) {
                delete pollVotes[doorNumber];
                deletionPromises.push(safeWriteJson(pollVotesPath, pollVotes));
              }
            }
          }
        } catch (error) {
          logger.error('Error checking poll content:', error);
        }
      }
      
      // Delete the media file
      deletionPromises.push(deleteFileWithRetry(mediaPath));
    }

    // 2. Delete message file
    const messagePath = path.join(paths.messagesDir, `${doorNumber}.txt`);
    if (fsSync.existsSync(messagePath)) {
      deletionPromises.push(deleteFileWithRetry(messagePath));
    }

    // 3. Delete thumbnail
    const thumbnailPath = path.join(paths.thumbnailsDir, `thumb_${filename.split('.')[0]}.jpg`);
    if (fsSync.existsSync(thumbnailPath)) {
      deletionPromises.push(deleteFileWithRetry(thumbnailPath));
    }

    // Wait for all deletion operations
    await Promise.all(deletionPromises);

    // 4. Update medium.json
    delete medium[doorNumber];
    await safeWriteJson(mediumPath, medium);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error in deletion process:', error);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Deletion failed: ${error.message}`
      : 'Failed to delete content';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;