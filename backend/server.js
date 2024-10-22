/**
 * @fileoverview /backend/server.js
 * Express Server
 * 
 * Hauptdatei des Backend-Servers.
 * Konfiguriert und startet den Express-Server, definiert Routen
 * und verbindet alle Komponenten der Anwendung.
 */

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

// Initialisierung: Aufräumen und Verzeichnisse vorbereiten
FileUtils.cleanupTempFiles();
FileUtils.ensureDirectoryExists(paths.thumbnailsDir);

// Middleware-Konfiguration
app.use(corsMiddleware);
app.use('/thumbnails', express.static(paths.thumbnailsDir));
app.use('/media', express.static(paths.mediaDir));

/**
 * GET / - Basis-Route
 * Zeigt an, dass der Server läuft
 */
app.get('/', (req, res) => {
  res.send('Hallo Welt!');
});

/**
 * GET /media/:index - Medien-Route
 * Liefert eine spezifische Mediendatei aus
 */
app.get('^\/media\/[0-9]+$', async (req, res) => {
  try {
    const index = parseInt(req.path.split("/").pop());
    
    // Prüfe ob das Türchen schon geöffnet werden darf
    if (!TimingService.dateCheck(index)) {
      return res.status(423).send("File is not available yet");
    }

    const filePath = await MediaService.getMediaFile(index);
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).send('File not found.');
  }
});

/**
 * POST /api/invalidate-cache - Cache-Invalidierung
 * Leert den Thumbnail-Cache
 */
app.post('/api/invalidate-cache', (req, res) => {
  ThumbnailService.clearCache();
  res.status(200).send('Cache successfully cleared');
});

/**
 * GET /api - Haupt-API-Route
 * Liefert alle verfügbaren Medieninhalte mit Metadaten
 */
app.get('/api', async (req, res) => {
  try {
    const allDataEntries = await Promise.all(
      Object.entries(medium).map(async ([key, value]) => {
        const index = parseInt(key);
        
        // Prüfe ob das Türchen verfügbar ist
        if (!TimingService.dateCheck(index)) {
          return [key, { type: "not available yet" }];
        }

        const filePath = path.join(paths.mediaDir, value);
        const fileType = FileUtils.getFileType(value);
        let data = `${req.protocol}://${req.get('host')}/media/${index}`;
        let thumbnailUrl = null;
        
        // Generiere Thumbnails nur für unterstützte Medientypen
        if (['video', 'image', 'gif'].includes(fileType)) {
          const thumbnail = await ThumbnailService.generateThumbnail(filePath, fileType);
          if (thumbnail) {
            thumbnailUrl = `${req.protocol}://${req.get('host')}/thumbnails/${path.basename(thumbnail)}`;
          }
        }

        // Spezialbehandlung für Textdateien
        if (fileType === 'text') {
          data = fs.readFileSync(filePath, 'utf8').toString();
        }

        // Lade zusätzliche Nachricht, falls vorhanden
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

// Globale Fehlerbehandlung
app.use(errorHandler);

// Graceful Shutdown Handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing server...');
  app.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

// Server starten
app.listen(port, () => {
  logger.info(`Server läuft auf http://localhost:${port}`);
});