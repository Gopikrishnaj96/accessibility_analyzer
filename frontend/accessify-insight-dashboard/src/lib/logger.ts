/**
 * A simple logger utility to provide consistent log formatting and error handling
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

// Configure the minimum log level (can be adjusted based on environment)
const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// Store recent logs in memory for debugging
const recentLogs: { level: string; message: string; data?: any; timestamp: string }[] = [];
const MAX_LOGS = 100;

/**
 * Add a timestamped entry to the recent logs array
 */
const addToRecentLogs = (level: string, message: string, data?: any) => {
  const logEntry = {
    level,
    message,
    data: data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined,
    timestamp: new Date().toISOString(),
  };
  
  recentLogs.unshift(logEntry);
  
  // Keep array at reasonable size
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }
  
  // Store in session storage for persistence across page reloads
  try {
    sessionStorage.setItem('debug_logs', JSON.stringify(recentLogs.slice(0, 20)));
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Format and log a message with optional data
 */
const log = (level: keyof typeof LOG_LEVELS, message: string, data?: any) => {
  if (LOG_LEVELS[level] < MIN_LOG_LEVEL) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  if (data !== undefined) {
    // Safely stringify data, handling circular references
    let dataString = '';
    try {
      dataString = JSON.stringify(data, null, 2);
    } catch (e) {
      dataString = String(data);
    }
    
    console[level.toLowerCase() as 'log' | 'info' | 'warn' | 'error'](
      `${prefix} ${message}`,
      data
    );
  } else {
    console[level.toLowerCase() as 'log' | 'info' | 'warn' | 'error'](
      `${prefix} ${message}`
    );
  }
  
  addToRecentLogs(level, message, data);
};

/**
 * Logger implementation with methods for each log level
 */
export const logger = {
  debug: (message: string, data?: any) => log('DEBUG', message, data),
  info: (message: string, data?: any) => log('INFO', message, data),
  warn: (message: string, data?: any) => log('WARN', message, data),
  error: (message: string, data?: any) => log('ERROR', message, data),
  
  /**
   * Log error with stack trace and additional context
   */
  logError: (error: unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log('ERROR', context ? `${context}: ${errorMessage}` : errorMessage, {
      error,
      stack: errorStack,
      context
    });
  },
  
  /**
   * Get recent logs for debugging
   */
  getRecentLogs: () => [...recentLogs],
  
  /**
   * Clear recent logs
   */
  clearLogs: () => {
    recentLogs.length = 0;
    try {
      sessionStorage.removeItem('debug_logs');
    } catch (e) {
      // Ignore storage errors
    }
  }
};

// Setup global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
      stack: event.reason?.stack
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
}

export default logger; 