const ffmpeg = require('fluent-ffmpeg');

const ffmpegPath = 'C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe';
const ffprobePath = 'C:/Users/admin/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

module.exports = {
  ffmpeg,
  ffmpegPath,
  ffprobePath
};