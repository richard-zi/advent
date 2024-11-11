/**
 * @fileoverview /backend/server.js
 * Main Server File
 * 
 * This is the central server file of the application.
 * It initializes the Express server, loads all middleware, and defines the routes.
 * Updated to handle reverse proxy setup and HTTPS properly.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const timingMiddleware = require('./middleware/timingMiddleware')
const adminRoutes = require('./routes/adminRoutes');
const MediaService = require('./services/mediaService');
const PollService = require('./services/pollService');
const ThumbnailService = require('./services/thumbnailService');
const TimingService = require('./services/timingService');
const AuthService = require('./services/authService');
const FileUtils = require('./utils/fileUtils');
const logger = require('./utils/logger');
const paths = require('./config/paths');

// Initialize Express app and set port from environment variables
const app = express();
const port = process.env.PORT || 5000;

// Trust proxy settings when behind reverse proxy
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Ensure medium.json exists
const mediumPath = path.join(__dirname, 'medium.json');
if (!fs.existsSync(mediumPath)) {
  fs.writeFileSync(mediumPath, JSON.stringify({}), 'utf8');
}

// Initialize admin credentials from environment variables
AuthService.initializeAdmin().catch(error => {
  logger.error('Error initializing admin credentials:', error);
  process.exit(1);
});

// Middleware to handle HTTPS redirect when behind reverse proxy
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Middleware Configuration
app.use(corsMiddleware);
app.use(express.json());
app.use('/api/thumbnails', timingMiddleware, express.static(paths.thumbnailsDir));
app.use('/api/media', timingMiddleware, express.static(paths.mediaDir));

// Initialize required directories and systems
FileUtils.ensureDirectoryExists(paths.mediaDir);
FileUtils.ensureDirectoryExists(paths.thumbnailsDir);
FileUtils.ensureDirectoryExists(paths.messagesDir);
FileUtils.cleanupTempFiles();
PollService.initializePolls();

// Helper function to generate full URLs considering reverse proxy
function getFullUrl(req, path) {
  return `${req.protocol}://${req.get('host')}${path}`;
}

// Register Admin Routes
app.use('/api/admin', adminRoutes);

/**
 * Base route for server check
 */
app.get('/api', (req, res) => {
  res.send('Server is running!');
});

/**
 * Route for fetching media files
 * Checks temporal availability and sends the requested file
 */
app.get('/api/media/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    if (!TimingService.dateCheck(index)) {
      return res.status(423).send("File is not available yet");
    }

    const filePath = await MediaService.getMediaFile(index);
    res.sendFile(filePath);
  } catch (error) {
    logger.error('Error serving media file:', error);
    res.status(404).send('File not found.');
  }
});

/**
 * Route for fetching poll data
 * Delivers poll information and voting results
 */
app.get('/api/poll/:doorNumber', async (req, res) => {
  try {
    const doorNumber = parseInt(req.params.doorNumber);
    
    if (!TimingService.dateCheck(doorNumber)) {
      return res.status(423).json({ error: 'Poll is not available yet' });
    }

    const pollData = await PollService.getPollData(doorNumber);
    if (!pollData) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const votes = await PollService.getVotes(doorNumber);
    const userVote = await PollService.getUserVote(doorNumber, req.query.userId);

    res.json({
      pollData,
      votes,
      userVote
    });
  } catch (error) {
    logger.error('Error fetching poll data:', error);
    res.status(500).json({ error: 'Error fetching poll data' });
  }
});

/**
 * Route for submitting poll votes
 * Processes user votes and updates results
 */
app.post('/api/poll/:doorNumber/vote', async (req, res) => {
  try {
    const doorNumber = parseInt(req.params.doorNumber);
    const { option, userId } = req.body;

    if (!option || !userId) {
      return res.status(400).json({ error: 'Option or userId missing' });
    }

    if (!TimingService.dateCheck(doorNumber)) {
      return res.status(423).json({ error: 'Poll is not available yet' });
    }

    const pollData = await PollService.getPollData(doorNumber);
    if (!pollData) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!pollData.options.includes(option)) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    const result = await PollService.vote(doorNumber, option, userId);
    res.json(result);
  } catch (error) {
    logger.error('Error processing vote:', error);
    res.status(500).json({ error: 'Error processing vote' });
  }
});

/**
 * Main API route
 * Delivers all available content with metadata
 */
app.get('/api/content', async (req, res) => {
  try {
    const mediumContent = fs.readFileSync(mediumPath, 'utf8');
    const medium = JSON.parse(mediumContent);
    const doorStates = req.query.doorStates ? JSON.parse(req.query.doorStates) : {};

    const allDataEntries = await Promise.all(
      Object.entries(medium).map(async ([key, value]) => {
        const index = parseInt(key);
        
        if (!TimingService.dateCheck(index)) {
          return [key, { type: "not available yet" }];
        }

        const filePath = path.join(paths.mediaDir, value);
        const fileType = FileUtils.getFileType(value);
        let thumbnailUrl = null;
        
        if (['video', 'image', 'gif'].includes(fileType)) {
          const thumbnail = await ThumbnailService.generateThumbnail(filePath, fileType);
          if (thumbnail) {
            thumbnailUrl = getFullUrl(req, `/thumbnails/${path.basename(thumbnail)}`);
          }
        }

        const mediaContent = MediaService.prepareMediaContent(filePath, fileType, doorStates, index);
        let data;
        
        switch(mediaContent.type) {
          case 'countdown':
          case 'poll': 
            data = null;
            break;
          case 'text':
            data = mediaContent.data;
            break;
          case 'puzzle':
            const puzzleImageIndex = MediaService.getPuzzleImageIndex(index);
            data = getFullUrl(req, `/media/${puzzleImageIndex}`);
            
            if (doorStates[index]?.win) {
              thumbnailUrl = data;
            }
            break;
          default:
            data = getFullUrl(req, `/media/${index}`);
        }

        const message = await MediaService.getMediaMessage(index);

        return [key, {
          data: TimingService.dateCheck(index) ? data : null,
          type: TimingService.dateCheck(index) ? mediaContent.type : "not available yet",
          text: TimingService.dateCheck(index) ? message : null,
          thumbnail: TimingService.dateCheck(index) ? thumbnailUrl : null,
          isSolved: mediaContent.type === 'puzzle' ? doorStates[index]?.win || false : undefined
        }];
      })
    );

    return res.status(200).json(Object.fromEntries(allDataEntries));
  } catch (error) {
    logger.error('Error processing API request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register Error Handler
app.use(errorHandler);

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM Signal received. Server shutting down...');
  app.close(() => {
    logger.info('Server terminated.');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Perform clean shutdown
  app.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

// Start the server
app.listen(port, '127.0.0.1', () => {
  logger.info(`Server running on http://127.0.0.1:${port}`);
});