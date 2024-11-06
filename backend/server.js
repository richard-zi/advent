/**
 * @fileoverview /backend/server.js
 * Hauptserver-Datei
 * 
 * Dies ist die zentrale Serverdatei der Anwendung.
 * Sie initialisiert den Express-Server, lädt alle Middleware und definiert die Routen.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
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

// Initialisiere Express-App und setze den Port
const app = express();
const port = process.env.PORT || 5000;

// Stelle sicher, dass medium.json existiert
const mediumPath = path.join(__dirname, 'medium.json');
if (!fs.existsSync(mediumPath)) {
  fs.writeFileSync(mediumPath, JSON.stringify({}), 'utf8');
}

// Initialisiere Admin-Anmeldedaten
// WICHTIG: In der Produktion sollten diese Werte sicher konfiguriert werden
AuthService.initializeAdmin('admin', 'changeme123').catch(error => {
  logger.error('Fehler bei der Initialisierung der Admin-Anmeldedaten:', error);
  process.exit(1);
});

// Middleware-Konfiguration
app.use(corsMiddleware);
app.use(express.json());
app.use('/thumbnails', timingMiddleware, express.static(paths.thumbnailsDir));
app.use('/media', timingMiddleware, express.static(paths.mediaDir));

// Initialisiere benötigte Verzeichnisse und Systeme
FileUtils.ensureDirectoryExists(paths.mediaDir);
FileUtils.ensureDirectoryExists(paths.thumbnailsDir);
FileUtils.ensureDirectoryExists(paths.messagesDir);
FileUtils.cleanupTempFiles();
PollService.initializePolls();

// Registriere Admin-Routen
app.use('/admin', adminRoutes);

/**
 * Basis-Route zur Serverüberprüfung
 */
app.get('/', (req, res) => {
  res.send('Server läuft!');
});

/**
 * Route zum Abrufen von Mediendateien
 * Prüft die zeitliche Verfügbarkeit und sendet die angeforderte Datei
 */
app.get('/media/:index', async (req, res) => {
  try {
    const index = parseInt(req.path.split("/").pop());
    
    // Prüfe ob das Türchen schon geöffnet werden darf
    if (!TimingService.dateCheck(index)) {
      return res.status(423).send("Datei ist noch nicht verfügbar");
    }

    const filePath = await MediaService.getMediaFile(index);
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).send('Datei nicht gefunden.');
  }
});

/**
 * Route zum Abrufen von Umfragedaten
 * Liefert Umfrageinformationen und Abstimmungsergebnisse
 */
app.get('/api/poll/:doorNumber', async (req, res) => {
  try {
    const doorNumber = parseInt(req.params.doorNumber);
    
    if (!TimingService.dateCheck(doorNumber)) {
      return res.status(423).json({ error: 'Umfrage ist noch nicht verfügbar' });
    }

    const pollData = await PollService.getPollData(doorNumber);
    if (!pollData) {
      return res.status(404).json({ error: 'Umfrage nicht gefunden' });
    }

    const votes = await PollService.getVotes(doorNumber);
    const userVote = await PollService.getUserVote(doorNumber, req.query.userId);

    res.json({
      pollData,
      votes,
      userVote
    });
  } catch (error) {
    logger.error('Fehler beim Abrufen der Umfragedaten:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Umfragedaten' });
  }
});

/**
 * Route zum Abstimmen bei Umfragen
 * Verarbeitet Benutzerabstimmungen und aktualisiert die Ergebnisse
 */
app.post('/api/poll/:doorNumber/vote', async (req, res) => {
  try {
    const doorNumber = parseInt(req.params.doorNumber);
    const { option, userId } = req.body;

    // Validiere Eingabedaten
    if (!option || !userId) {
      return res.status(400).json({ error: 'Option oder userId fehlt' });
    }

    if (!TimingService.dateCheck(doorNumber)) {
      return res.status(423).json({ error: 'Umfrage ist noch nicht verfügbar' });
    }

    const pollData = await PollService.getPollData(doorNumber);
    if (!pollData) {
      return res.status(404).json({ error: 'Umfrage nicht gefunden' });
    }

    if (!pollData.options.includes(option)) {
      return res.status(400).json({ error: 'Ungültige Option' });
    }

    const result = await PollService.vote(doorNumber, option, userId);
    res.json(result);
  } catch (error) {
    logger.error('Fehler beim Erfassen der Abstimmung:', error);
    res.status(500).json({ error: 'Fehler beim Erfassen der Abstimmung' });
  }
});


/**
 * Hauptroute der API
 * Liefert alle verfügbaren Inhalte mit Metadaten
 */
app.get('/api', async (req, res) => {
  try {
    // Lade aktuelle Daten aus medium.json
    const mediumContent = fs.readFileSync(mediumPath, 'utf8');
    const medium = JSON.parse(mediumContent);
    
    // Extrahiere doorStates aus dem Query-Parameter
    const doorStates = req.query.doorStates ? JSON.parse(req.query.doorStates) : {};

    // Verarbeite alle Einträge
    const allDataEntries = await Promise.all(
      Object.entries(medium).map(async ([key, value]) => {
        const index = parseInt(key);
        
        // Prüfe zeitliche Verfügbarkeit
        if (!TimingService.dateCheck(index)) {
          return [key, { type: "not available yet" }];
        }

        const filePath = path.join(paths.mediaDir, value);
        const fileType = FileUtils.getFileType(value);
        let thumbnailUrl = null;
        
        // Generiere Thumbnails für visuelle Medien
        if (['video', 'image', 'gif'].includes(fileType)) {
          const thumbnail = await ThumbnailService.generateThumbnail(filePath, fileType);
          if (thumbnail) {
            thumbnailUrl = `${req.protocol}://${req.get('host')}/thumbnails/${path.basename(thumbnail)}`;
          }
        }

        // Bereite Medieninhalt vor
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
            data = `${req.protocol}://${req.get('host')}/media/${puzzleImageIndex}`;
            
            if (doorStates[index]?.win) {
              thumbnailUrl = data;
            }
            break;
          default:
            data = `${req.protocol}://${req.get('host')}/media/${index}`;
        }

        // Lade zusätzliche Nachricht, falls vorhanden
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
    logger.error('Fehler bei der Verarbeitung der API-Anfrage:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Registriere Error-Handler
app.use(errorHandler);

// Behandle Prozessbeendigung
process.on('SIGTERM', () => {
  logger.info('SIGTERM Signal empfangen. Server wird beendet...');
  app.close(() => {
    logger.info('Server beendet.');
    process.exit(0);
  });
});

// Starte den Server
app.listen(port, () => {
  logger.info(`Server läuft auf http://localhost:${port}`);
});