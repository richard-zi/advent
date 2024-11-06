/**
 * @fileoverview /backend/config/ffmpeg.js
 * FFmpeg Konfigurationsdatei
 * 
 * Diese Datei enthält die grundlegende Konfiguration für FFmpeg, welches für die
 * Verarbeitung von Video- und GIF-Dateien im Adventskalender verwendet wird.
 */

const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

// Definition der Pfade zu den FFmpeg-Binärdateien
const ffmpegPath = process.env.FFMPEG_PATH;
const ffprobePath = process.env.FFPROBE_PATH;

// Konfiguriere FFmpeg mit den definierten Pfaden
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Exportiere die konfigurierten FFmpeg-Instanzen und Pfade
module.exports = {
  ffmpeg,
  ffmpegPath,
  ffprobePath
};