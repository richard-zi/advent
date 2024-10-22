const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const mediaDir = path.join(rootDir, 'media');
const thumbnailsDir = path.join(rootDir, 'thumbnails');
const messagesDir = path.join(rootDir, 'messages');

module.exports = {
  rootDir,
  mediaDir,
  thumbnailsDir,
  messagesDir
};