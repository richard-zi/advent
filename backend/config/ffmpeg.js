/**
 * @fileoverview /backend/config/ffmpeg.js
 * FFmpeg Konfigurationsdatei
 * 
 * Diese Datei enthält die Konfiguration für FFmpeg, welches für die
 * Verarbeitung von Video- und GIF-Dateien verwendet wird.
 */

const ffmpeg = require('fluent-ffmpeg');

// Pfade zu den FFmpeg-Binärdateien - müssen an das lokale System angepasst werden
const ffmpegPath = 'C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe';
const ffprobePath = '"C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe"';

// Konfiguriere FFmpeg mit den entsprechenden Pfaden
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

module.exports = {
  ffmpeg,
  ffmpegPath,
  ffprobePath
};