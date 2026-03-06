/**
 * Centralized logging service.
 * Replaces console.error throughout the application.
 * 
 * Features:
 * - Environment-aware logging (dev vs prod)
 * - Structured logging with context
 * - Error categorization
 * - Optional remote logging integration (Sentry, LogRocket, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  bookingId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
}

/**
 * Logger service with environment-aware behavior.
 */
class Logger {
  private isDevelopment: boolean;
  private remoteEndpoint?: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Configure remote logging endpoint (optional)
   */
  configure(options: { remoteEndpoint?: string }) {
    this.remoteEndpoint = options.remoteEndpoint;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log error - always shown, even in production
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, { ...context, error: error?.message, stack: error?.stack });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // Always log errors, log all in development
    if (level === 'error' || this.isDevelopment) {
      const prefix = `[${level.toUpperCase()}]`;
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      
      switch (level) {
        case 'debug':
          console.debug(`${prefix} ${message}${contextStr}`);
          break;
        case 'info':
          console.info(`${prefix} ${message}${contextStr}`);
          break;
        case 'warn':
          console.warn(`${prefix} ${message}${contextStr}`);
          break;
        case 'error':
          console.error(`${prefix} ${message}${contextStr}`);
          break;
      }
    }

    // Send to remote endpoint if configured
    if (this.remoteEndpoint && (level === 'error' || level === 'warn')) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Send log to remote service (async, non-blocking)
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.remoteEndpoint) return;

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      // Silently fail - don't crash the app for logging
    }
  }

  /**
   * Helper for Supabase errors
   */
  logSupabaseError(error: Error, context?: LogContext): void {
    const supabaseError = error as { code?: string; details?: string };
    
    this.error(`Supabase Error: ${supabaseError.code || 'UNKNOWN'}`, error, {
      ...context,
      supabaseDetails: supabaseError.details,
    });
  }

  /**
   * Helper for validation errors
   */
  logValidationError(errors: string[], context?: LogContext): void {
    this.warn(`Validation failed: ${errors.join(', ')}`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, error?: Error, context?: LogContext) => 
  logger.error(message, error, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

export const logSupabaseError = (error: Error, context?: LogContext) => 
  logger.logSupabaseError(error, context);
