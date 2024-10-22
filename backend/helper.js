const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

// Setze den FFmpeg Pfad - passe diesen an dein System an
const ffmpegPath = 'C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe';
const ffprobePath = '"C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe"';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function getThumbnailPath(filename) {
  const thumbnailDir = await ensureThumbnailDir();
  return path.join(thumbnailDir, `thumb_${filename.split('.')[0]}.jpg`);
}

async function checkExistingThumbnail(thumbnailPath) {
  try {
    if (fs.existsSync(thumbnailPath)) {
      // Prüfe ob die Datei auch wirklich ein Bild ist und nicht beschädigt
      const metadata = await sharp(thumbnailPath).metadata();
      if (metadata.width && metadata.height) {
        console.log('Existierendes Thumbnail gefunden:', thumbnailPath);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log('Thumbnail existiert nicht oder ist beschädigt:', thumbnailPath);
    return false;
  }
}

async function generateThumbnail(filePath, type) {
  try {
    const filename = path.basename(filePath);
    const thumbnailPath = await getThumbnailPath(filename);

    // Prüfe ob ein gültiges Thumbnail bereits existiert
    if (await checkExistingThumbnail(thumbnailPath)) {
      console.log('Verwende existierendes Thumbnail:', thumbnailPath);
      return thumbnailPath;
    }

    console.log('Generiere neues Thumbnail für:', filename);

    if (type === 'video' || type === 'gif') {
      if (!fs.existsSync(ffmpegPath)) {
        console.error('FFmpeg nicht gefunden unter:', ffmpegPath);
        throw new Error('FFmpeg nicht installiert');
      }

      return new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .on('start', (commandLine) => {
            console.log('FFmpeg Befehl:', commandLine);
          })
          .on('error', (err, stdout, stderr) => {
            console.error('FFmpeg Fehler:', err.message);
            console.error('FFmpeg stderr:', stderr);
            reject(err);
          })
          .screenshots({
            timestamps: ['00:00:01.000'],
            filename: `thumb_${filename.split('.')[0]}_temp.jpg`,
            folder: path.dirname(thumbnailPath),
          })
          .on('end', async () => {
            try {
              const tempPath = path.join(path.dirname(thumbnailPath), `thumb_${filename.split('.')[0]}_temp.jpg`);
              
              // Nachbearbeitung des Screenshots
              const metadata = await sharp(tempPath).metadata();
              const targetWidth = 500;
              const targetHeight = Math.round(targetWidth * (metadata.height / metadata.width));
              
              await sharp(tempPath)
                .resize(targetWidth, targetHeight, {
                  fit: 'fill'
                })
                .jpeg({ quality: 85 })
                .toFile(thumbnailPath);
              
              // Temporäre Datei löschen
              fs.unlinkSync(tempPath);
              
              console.log('Neues Thumbnail erfolgreich generiert:', thumbnailPath);
              resolve(thumbnailPath);
            } catch (err) {
              console.error('Fehler bei der Nachbearbeitung:', err);
              reject(err);
            }
          });
      });
    } else if (type === 'image') {
      const metadata = await sharp(filePath).metadata();
      const targetWidth = 500;
      const targetHeight = Math.round(targetWidth * (metadata.height / metadata.width));

      await sharp(filePath)
        .resize(targetWidth, targetHeight, {
          fit: 'fill'
        })
        .jpeg({ quality: 85 })
        .toFile(thumbnailPath);
      
      console.log('Neues Thumbnail erfolgreich generiert:', thumbnailPath);
      return thumbnailPath;
    }
  } catch (error) {
    console.error('Fehler in generateThumbnail:', error);
    return null;
  }
}

async function ensureThumbnailDir() {
  const thumbnailDir = path.join(__dirname, 'thumbnails');
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir);
  }
  return thumbnailDir;
}

function getFileType(filename) {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
    case '.png':
    case '.jpg':
    case '.jpeg':
      return 'image';
    case '.gif':
      return 'gif';
    case '.mp4':
    case '.m4a':
    case '.mov':
      return 'video';
    case '.mp3':
    case '.ogg':
    case '.wav':
      return 'audio';
    case '.txt':
    case '.md':
      return 'text';
    default:
      return 'unknown';
  }
}

module.exports = {
  generateThumbnail,
  ensureThumbnailDir,
  getFileType
};