import path from 'path';

export const paths = {
  rootDir: process.cwd(),
  publicDir: path.join(process.cwd(), 'public'),
  dataDir: path.join(process.cwd(), 'data'),
  mediaDir: path.join(process.cwd(), 'public', 'media'),
  thumbnailsDir: path.join(process.cwd(), 'public', 'thumbnails'),
  messagesDir: path.join(process.cwd(), 'data', 'messages'),
  pollsDir: path.join(process.cwd(), 'data', 'polls'),
  mediumJsonPath: path.join(process.cwd(), 'data', 'medium.json'),
  adminCredentialsPath: path.join(process.cwd(), 'data', 'admin-credentials.json'),
  pollDataPath: path.join(process.cwd(), 'data', 'polls', 'pollData.json'),
  pollVotesPath: path.join(process.cwd(), 'data', 'polls', 'pollVotes.json'),
  assetDir: path.join(process.cwd(), 'public', 'assets'),
} as const;
