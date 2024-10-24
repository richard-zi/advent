const express = require('express');
const fs = require('fs');
const path = require('path');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const adminRoutes = require('./routes/adminRoutes');
const MediaService = require('./services/mediaService');
const PollService = require('./services/pollService');
const ThumbnailService = require('./services/thumbnailService');
const TimingService = require('./services/timingService');
const AuthService = require('./services/authService');
const FileUtils = require('./utils/fileUtils');
const logger = require('./utils/logger');
const paths = require('./config/paths');

const app = express();
const port = process.env.PORT || 5000;

// Ensure medium.json exists
const mediumPath = path.join(__dirname, 'medium.json');
if (!fs.existsSync(mediumPath)) {
  fs.writeFileSync(mediumPath, JSON.stringify({}), 'utf8');
}

// Initialize admin credentials if not exists
AuthService.initializeAdmin('admin', 'changeme123').catch(error => {
  logger.error('Failed to initialize admin credentials:', error);
  process.exit(1);
});

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use('/thumbnails', express.static(paths.thumbnailsDir));
app.use('/media', express.static(paths.mediaDir));

// Initialize required directories
FileUtils.ensureDirectoryExists(paths.mediaDir);
FileUtils.ensureDirectoryExists(paths.thumbnailsDir);
FileUtils.ensureDirectoryExists(paths.messagesDir);
FileUtils.cleanupTempFiles();
PollService.initializePolls();

// Admin routes
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

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

app.post('/api/poll/:doorNumber/vote', async (req, res) => {
  try {
    const doorNumber = parseInt(req.params.doorNumber);
    const { option, userId } = req.body;

    if (!option || !userId) {
      return res.status(400).json({ error: 'Missing option or userId' });
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
    logger.error('Error recording vote:', error);
    res.status(500).json({ error: 'Error recording vote' });
  }
});

app.get('/api', async (req, res) => {
  try {
    // Read medium.json for each request to get the latest data
    const mediumContent = fs.readFileSync(mediumPath, 'utf8');
    const medium = JSON.parse(mediumContent);

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
            thumbnailUrl = `${req.protocol}://${req.get('host')}/thumbnails/${path.basename(thumbnail)}`;
          }
        }

        const mediaContent = MediaService.prepareMediaContent(filePath, fileType);
        const data = mediaContent.type === 'countdown' || mediaContent.type === 'poll' ? null : 
          (mediaContent.type === 'text' ? mediaContent.data : 
          `${req.protocol}://${req.get('host')}/media/${index}`);

        const message = await MediaService.getMediaMessage(index);

        return [key, {
          data,
          type: mediaContent.type,
          text: message,
          thumbnail: thumbnailUrl
        }];
      })
    );

    return res.status(200).json(Object.fromEntries(allDataEntries));
  } catch (error) {
    logger.error('Error processing API request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(errorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing server...');
  app.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

app.listen(port, () => {
  logger.info(`Server läuft auf http://localhost:${port}`);
});