import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { paths } from '../config/paths';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { FileUtils } from '../utils/fileUtils';
import type { AdminCredentials } from '../types';

const SALT_ROUNDS = env.nodeEnv === 'production' ? 12 : 10;

export class AuthService {
  static async initializeAdmin(): Promise<void> {
    FileUtils.ensureDirectoryExists(paths.dataDir);

    if (!fs.existsSync(paths.adminCredentialsPath)) {
      const hashedPassword = await bcrypt.hash(env.adminPassword, SALT_ROUNDS);
      const credentials: AdminCredentials = {
        username: env.adminUsername,
        password: hashedPassword,
      };
      fs.writeFileSync(
        paths.adminCredentialsPath,
        JSON.stringify(credentials, null, 2)
      );
      logger.info('Admin credentials initialized');
    }
  }

  static async validateCredentials(
    username: string,
    password: string
  ): Promise<boolean> {
    try {
      if (!fs.existsSync(paths.adminCredentialsPath)) {
        await this.initializeAdmin();
      }

      const content = fs.readFileSync(paths.adminCredentialsPath, 'utf8');
      const credentials: AdminCredentials = JSON.parse(content);

      if (credentials.username !== username) {
        return false;
      }

      return await bcrypt.compare(password, credentials.password);
    } catch (error) {
      logger.error('Error validating credentials:', error);
      return false;
    }
  }

  static generateToken(username: string): string {
    return jwt.sign({ username }, env.jwtSecret, { expiresIn: '24h' });
  }

  static verifyToken(token: string): { username: string } | null {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { username: string };
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error);
      return null;
    }
  }
}
