const express = require('express');
const fs = require('fs');
const path = require('path');
const timing = require('./timing');
const helper = require('./helper');
const medium = require('./medium.json');
const cors = require('cors');
const app = express();
const port = 5000;

// Cache für bereits überprüfte Thumbnails
const thumbnailCache = new Map();

app.use(cors());
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));
app.use('/media', express.static(path.join(__dirname, 'media')));

app.get('/', (req, res) => {
  res.send('Hallo Welt!');
});

app.get('^\/media\/[0-9]+$', (req, res) => {
  const index = parseInt(req.path.split("/").pop());
  if (isNaN(index) || medium[index] === undefined) {
    return res.status(404).send('File not found.');
  }
  if (timing.dateCheck(index)) {
    const filePath = path.join(__dirname, 'media', medium[index]);
    res.sendFile(filePath, (err) => {
      if (err) {
        return res.status(404).send('File not found.');
      }
    });
  } else {
    return res.status(423).send("File is not available yet");
  }
});

// Hilfsfunktion zum Generieren oder Abrufen eines Thumbnails
async function getOrCreateThumbnail(filePath, fileType, index, req) {
  // Prüfe Cache
  if (thumbnailCache.has(index)) {
    console.log('Verwende gecachtes Thumbnail für Index:', index);
    return thumbnailCache.get(index);
  }

  try {
    if (fileType === 'video' || fileType === 'image' || fileType === 'gif') {
      const thumbnailPath = path.join(__dirname, 'thumbnails', `thumb_${index}.jpg`);
      
      // Prüfe ob Thumbnail existiert
      if (fs.existsSync(thumbnailPath)) {
        const thumbnailUrl = `${req.protocol}://${req.get('host')}/thumbnails/thumb_${index}.jpg`;
        thumbnailCache.set(index, thumbnailUrl);
        console.log('Existierendes Thumbnail gefunden für Index:', index);
        return thumbnailUrl;
      }

      // Wenn nicht, generiere neues Thumbnail
      console.log('Generiere neues Thumbnail für Index:', index);
      await helper.generateThumbnail(filePath, fileType);
      const thumbnailUrl = `${req.protocol}://${req.get('host')}/thumbnails/thumb_${index}.jpg`;
      thumbnailCache.set(index, thumbnailUrl);
      return thumbnailUrl;
    }
    return null;
  } catch (error) {
    console.error('Fehler bei Thumbnail-Verarbeitung:', error);
    return null;
  }
}

app.get('/api', async (req, res) => {
  try {
    const allDataEntries = await Promise.all(
      Object.entries(medium).map(async ([key, value]) => {
        const index = parseInt(key);
        if (timing.dateCheck(index)) {
          const filePath = path.join(__dirname, 'media', value);
          const fileType = helper.getFileType(value);
          let data = req.protocol + '://' + req.get('host') + "/media/" + String(index);
          
          // Thumbnail für Video, Bild und GIF
          const thumbnail = await getOrCreateThumbnail(filePath, fileType, index, req);

          // Handle text content
          if (fileType === 'text') {
            const buff = fs.readFileSync(filePath, 'utf8');
            data = buff.toString();
          }

          // Get additional message if exists
          let message;
          try {
            message = fs.readFileSync(
              path.join(__dirname, "messages", `${index}.txt`),
              'utf8'
            ).toString();
          } catch (error) {}

          return [key, {
            data,
            type: fileType,
            text: message,
            thumbnail
          }];
        } else {
          return [key, { type: "not available yet" }];
        }
      })
    );

    return res.status(200).json(Object.fromEntries(allDataEntries));
  } catch (error) {
    console.error('Error processing API request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});