import { FileUtils } from '../utils/fileUtils';
import { paths } from '../config/paths';
import { validateEnv } from '../config/env';
import { AuthService } from './authService';
import { PollService } from './pollService';
import { MediaService } from './mediaService';
import { logger } from '../utils/logger';

export class InitService {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing application...');

      // Ensure critical environment variables are set
      validateEnv();

      // Ensure all directories exist
      FileUtils.ensureDirectoryExists(paths.dataDir);
      FileUtils.ensureDirectoryExists(paths.mediaDir);
      FileUtils.ensureDirectoryExists(paths.thumbnailsDir);
      FileUtils.ensureDirectoryExists(paths.publicThumbnailsDir);
      FileUtils.ensureDirectoryExists(paths.messagesDir);
      FileUtils.ensureDirectoryExists(paths.pollsDir);
      FileUtils.ensureDirectoryExists(paths.assetDir);

      // Initialize medium.json
      MediaService.initializeMediumJson();

      // Initialize admin credentials
      await AuthService.initializeAdmin();

      // Initialize polls
      PollService.initializePolls();

      // Cleanup temporary files
      FileUtils.cleanupTempFiles();

      this.initialized = true;
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Error initializing application:', error);
      throw error;
    }
  }
}
