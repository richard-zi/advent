/**
 * @fileoverview /backend/middleware/timingMiddleware.js
 * Timing Check Middleware
 * 
 * Überprüft ob Medieninhalte zeitlich bereits verfügbar sind
 * basierend auf der Zuordnung in medium.json
 */

const path = require('path');
const fs = require('fs');
const TimingService = require('../services/timingService');
const logger = require('../utils/logger');

const timingMiddleware = (req, res, next) => {
  try {
    // Hole den angefragten Dateinamen
    const requestedFile = path.basename(req.path);
    
    // Für Thumbnails den Original-Dateinamen extrahieren
    const originalFilename = requestedFile.startsWith('thumb_') 
      ? requestedFile.replace('thumb_', '').split('.')[0]
      : requestedFile;

    // Lese medium.json
    const mediumPath = path.join(__dirname, '..', 'medium.json');
    const mediumContent = JSON.parse(fs.readFileSync(mediumPath, 'utf8'));

    // Finde das Türchen für die angefragte Datei
    let doorNumber = null;
    for (const [door, filename] of Object.entries(mediumContent)) {
      // Prüfe sowohl den exakten Dateinamen als auch den Dateinamen ohne Erweiterung
      // für Thumbnail-Zuordnung
      if (filename === requestedFile || filename.split('.')[0] === originalFilename) {
        doorNumber = parseInt(door);
        break;
      }
    }

    // Wenn die Datei nicht in medium.json gefunden wurde, erlaube den Zugriff
    // (könnte eine Admin-Ressource oder andere statische Datei sein)
    if (doorNumber === null) {
      return next();
    }

    // Prüfe ob das Türchen bereits geöffnet werden darf
    if (!TimingService.dateCheck(doorNumber)) {
      logger.info(`Access denied to content for door ${doorNumber} - not available yet`);
      return res.status(423).send("Content is not available yet");
    }

    next();
  } catch (error) {
    logger.error('Error in timing middleware:', error);
    // Bei Fehlern (z.B. medium.json nicht lesbar) blocken wir sicherheitshalber den Zugriff
    return res.status(423).send("Content is not available");
  }
};

module.exports = timingMiddleware;