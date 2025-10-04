import { env } from '../config/env';

class Logger {
  info(...args: unknown[]): void {
    console.log('[INFO]', new Date().toISOString(), ...args);
  }

  error(...args: unknown[]): void {
    console.error('[ERROR]', new Date().toISOString(), ...args);
  }

  warn(...args: unknown[]): void {
    console.warn('[WARN]', new Date().toISOString(), ...args);
  }

  debug(...args: unknown[]): void {
    if (env.nodeEnv === 'development') {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  }
}

export const logger = new Logger();
