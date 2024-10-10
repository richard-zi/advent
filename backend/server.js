const express = require('express');
const fs = require('fs');
const path = require('path');
const timing =require('./timing');
const medium = require('./medium.json');
const app = express();
const port = 5000;

const baseDate = new Date(); // change to December

app.get('/', (req, res) => {
  res.send('Hallo Welt!');
});

app.get('^\/media\/[0-9]+$', (req, res) => {
  const index = parseInt(req.path.split("/").pop()) 
  if(isNaN(index) || medium[index] === undefined){
    return res.status(404).send('File not found.') // Falls Index keine Zahl oder Zahl nicht ist, existiert das Medium nicht
  }
  if(timing.dateCheck(index)) { // Bestimme, ob das angefragte Medium verfügbar ist
    const filePath = path.join(__dirname, 'media', medium[index]);
    res.sendFile(filePath, (err) => {
      if (err){
        return res.status(404).send('File not found.');
      }
    });
  } else {
  return res.status(423).send("File is not available yet")
  }
});

app.get('^\/api\/[0-9]+$', (req, res) => {
  const index = parseInt(req.path.split("/").pop()) 
  if(isNaN(index) || medium[index] === undefined){
    return res.status(404).send('File not found.') // Falls Index keine Zahl oder Zahl nicht ist, existiert das Medium nicht
  }
  if(timing.dateCheck(index)) { // Bestimme, ob das angefragte Medium verfügbar ist
    var data = req.protocol + '://' + req.get('host') + "/media/" + String(index);
    fs.readFile("./messages/" + String(index) + '.txt', 'utf8', (err, msg) => {
      let message;
      if(!err){
        message = msg.toString();
      }
      const extension = medium[index].split('.').pop().toLowerCase(); // Bestimme Datentyp
      let ft;
      switch(extension) { // quick WIP
        case 'png':
        case 'jpg':
        case 'jpeg':
          ft = 'image';
          break; 
        case 'mp4':
        case 'm4a':
        case 'mov':
          ft = 'video';
          break;
        case 'mp3':
        case 'ogg':
        case 'wav':
          ft = 'audio';
          break;
        case 'txt':
          ft = 'text';
          const buff = fs.readFileSync(path.join(__dirname, 'media', medium[index]), 'utf8');
          data = buff.toString()
          break;
        default:
          ft = 'unknown';
      }
      const response = {
        data : data,
        type : ft,
        text : message
      };
      res.status(200).json(response);
    });
  } else {
  return res.status(423).send("File is not available yet")
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});