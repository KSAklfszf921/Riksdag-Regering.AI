/**
 * Centralized logging utility
 *
 * Används för konsekvent logging genom hela MCP-servern
 */

export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
}

/**
 * Simple console logger
 */
class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    console.info(this.formatMessage('INFO', message, meta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(this.formatMessage('ERROR', message, meta));
  }
}

export const logger = new ConsoleLogger();
