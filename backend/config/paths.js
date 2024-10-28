/**
 * @fileoverview /backend/config/paths.js
 * Zentrale Pfad-Konfigurationsdatei
 * 
 * Diese Datei verwaltet alle wichtigen Dateipfade der Anwendung zentral.
 * Durch die Verwendung von path.resolve werden absolute Pfade generiert,
 * was Probleme mit relativen Pfaden vermeidet.
 */

const path = require('path');

// Definition der Basis-Verzeichnispfade
// rootDir: Hauptverzeichnis der Anwendung (ein Verzeichnis über config/)
const rootDir = path.resolve(__dirname, '..');

// mediaDir: Verzeichnis für alle hochgeladenen Medieninhalte
// Hier werden Bilder, Videos, GIFs und andere Mediendateien gespeichert
const mediaDir = path.join(rootDir, 'media');

// thumbnailsDir: Verzeichnis für generierte Vorschaubilder
// Hier werden automatisch erstellte Thumbnails für Medieninhalte gespeichert
const thumbnailsDir = path.join(rootDir, 'thumbnails');

// messagesDir: Verzeichnis für zusätzliche Nachrichtendateien
// Hier werden begleitende Texte zu den Medieninhalten gespeichert
const messagesDir = path.join(rootDir, 'messages');

// Exportiere alle definierten Pfade für die Verwendung in anderen Modulen
module.exports = {
  rootDir,
  mediaDir,
  thumbnailsDir,
  messagesDir
};