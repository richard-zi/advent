const express = require('express');
const fs = require('fs');
const path = require('path');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const MediaService = require('./services/mediaService');
const ThumbnailService = require('./services/thumbnailService');
const TimingService = require('./services/timingService');
const FileUtils = require('./utils/fileUtils');
const logger = require('./utils/logger');
const paths = require('./config/paths');
const medium = require('./medium.json');

const app = express();
const port = 5000;

// Cleanup on startup
FileUtils.cleanupTempFiles();
FileUtils.ensureDirectoryExists(paths.thumbnailsDir);

// Middleware
app.use(corsMiddleware);
app.use('/thumbnails', express.static(paths.thumbnailsDir));
app.use('/media', express.static(paths.mediaDir));

// Routes
app.get('/', (req, res) => {
  res.send('Hallo Welt!');
});

app.get('^\/media\/[0-9]+$', async (req, res) => {
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

app.post('/api/invalidate-cache', (req, res) => {
  ThumbnailService.clearCache();
  res.status(200).send('Cache successfully cleared');
});

app.get('/api', async (req, res) => {
  try {
    const allDataEntries = await Promise.all(
      Object.entries(medium).map(async ([key, value]) => {
        const index = parseInt(key);
        
        if (!TimingService.dateCheck(index)) {
          return [key, { type: "not available yet" }];
        }

        const filePath = path.join(paths.mediaDir, value);
        const fileType = FileUtils.getFileType(value);
        let data = `${req.protocol}://${req.get('host')}/media/${index}`;
        let thumbnailUrl = null;
        
        // Generate thumbnail only for media types that support it
        if (['video', 'image', 'gif'].includes(fileType)) {
          const thumbnail = await ThumbnailService.generateThumbnail(filePath, fileType);
          if (thumbnail) {
            thumbnailUrl = `${req.protocol}://${req.get('host')}/thumbnails/${path.basename(thumbnail)}`;
          }
        }

        // Handle text content
        if (fileType === 'text') {
          data = fs.readFileSync(filePath, 'utf8').toString();
        }

        // Get additional message
        const message = await MediaService.getMediaMessage(index);

        return [key, {
          data,
          type: fileType,
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

// Error handling
app.use(errorHandler);

// Graceful shutdown
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