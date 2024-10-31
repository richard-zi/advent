/**
 * @fileoverview /backend/config/ffmpeg.js
 * FFmpeg Konfigurationsdatei
 * 
 * Diese Datei enthält die grundlegende Konfiguration für FFmpeg, welches für die
 * Verarbeitung von Video- und GIF-Dateien im Adventskalender verwendet wird.
 */

const ffmpeg = require('fluent-ffmpeg');

// Definition der Pfade zu den FFmpeg-Binärdateien
// WICHTIG: Diese Pfade müssen an das jeweilige Betriebssystem und die Installation angepasst werden
const ffmpegPath = 'C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe';
const ffprobePath = '"C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe"';

// Konfiguriere FFmpeg mit den definierten Pfaden
// Diese Konfiguration ist notwendig, damit die Anwendung die FFmpeg-Binärdateien finden und nutzen kann
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Exportiere die konfigurierten FFmpeg-Instanzen und Pfade
// Dies ermöglicht anderen Modulen den Zugriff auf die FFmpeg-Funktionalität
module.exports = {
  ffmpeg,
  ffmpegPath,
  ffprobePath
};