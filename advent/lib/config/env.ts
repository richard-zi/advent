export const env = {
  // Required
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  ffmpegPath: process.env.FFMPEG_PATH || '',
  ffprobePath: process.env.FFPROBE_PATH || '',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',

  // Optional
  port: process.env.PORT || '3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  thumbnailWidth: parseInt(process.env.THUMBNAIL_WIDTH || '500', 10),
  thumbnailQuality: parseInt(process.env.THUMBNAIL_QUALITY || '85', 10),
  gitlabWebhookSecret: process.env.GITLAB_WEBHOOK_SECRET || '',
} as const;

export function validateEnv(): void {
  const required = ['JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && env.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
