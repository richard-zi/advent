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

// Trust proxy settings for working behind reverse proxy
app.enable('trust proxy');

// Helper function to get the full URL considering the X-Forwarded headers
const getFullUrl = (req) => {
  // Get protocol from X-Forwarded-Proto header or default to the request protocol
  const protocol = req.get('X-Forwarded-Proto') || req.protocol;
  // Get host from X-Forwarded-Host header or default to the request host
  const host = req.get('X-Forwarded-Host') || req.get('host');
  return `${protocol}://${host}`;
};

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

// Middleware configuration
app.use(corsMiddleware);
app.use(express.json());
app.use('/thumbnails', timingMiddleware, express.static(paths.thumbnailsDir));
app.use('/media', timingMiddleware, express.static(paths.mediaDir));

// Initialize required directories and systems
FileUtils.ensureDirectoryExists(paths.mediaDir);
FileUtils.ensureDirectoryExists(paths.thumbnailsDir);
FileUtils.ensureDirectoryExists(paths.messagesDir);
FileUtils.cleanupTempFiles();
PollService.initializePolls();

// Register admin routes
app.use('/admin', adminRoutes);

// Base route for server check
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Route for fetching media files
app.get('/media/:index', async (req, res) => {
  try {
    const index = parseInt(req.path.split("/").pop());
    
    if (!TimingService.dateCheck(index)) {
      return res.status(423).send("File is not available yet");
    }

    const filePath = await MediaService.getMediaFile(index);
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).send('File not found.');
  }
});

// Route for fetching poll data
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

// Route for voting in polls
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

// Main API route
app.get('/api', async (req, res) => {
  try {
    const mediumContent = fs.readFileSync(mediumPath, 'utf8');
    const medium = JSON.parse(mediumContent);
    const doorStates = req.query.doorStates ? JSON.parse(req.query.doorStates) : {};
    const baseUrl = getFullUrl(req);

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
            thumbnailUrl = `${baseUrl}/thumbnails/${path.basename(thumbnail)}`;
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
            const puzzleImagePath = path.join(paths.mediaDir, medium[puzzleImageIndex]);
            data = `${baseUrl}/media/${puzzleImageIndex}`;
            
            if (doorStates[index]?.win) {
              thumbnailUrl = data;
            }
            break;
          default:
            data = `${baseUrl}/media/${index}`;
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Register error handler
app.use(errorHandler);

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM Signal received. Shutting down server...');
  app.close(() => {
    logger.info('Server shut down.');
    process.exit(0);
  });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});