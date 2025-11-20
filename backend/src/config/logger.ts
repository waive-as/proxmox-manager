import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Environment variables with defaults
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || './logs';
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '10m';
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '30d';
const LOG_PRETTY_PRINT = process.env.LOG_PRETTY_PRINT === 'true';

/**
 * Custom log format for production (JSON)
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

/**
 * Custom log format for development (pretty printed)
 */
const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

/**
 * Create transports based on environment
 */
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: LOG_PRETTY_PRINT ? prettyFormat : jsonFormat,
  }),
];

// File transports (only in production or if LOG_FILE_PATH is set)
if (NODE_ENV === 'production' || LOG_FILE_PATH) {
  // Combined log file (all logs)
  transports.push(
    new DailyRotateFile({
      filename: path.join(LOG_FILE_PATH, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      format: jsonFormat,
    })
  );

  // Error log file (errors only)
  transports.push(
    new DailyRotateFile({
      level: 'error',
      filename: path.join(LOG_FILE_PATH, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      format: jsonFormat,
    })
  );

  // HTTP log file (http requests only)
  transports.push(
    new DailyRotateFile({
      level: 'http',
      filename: path.join(LOG_FILE_PATH, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      format: jsonFormat,
    })
  );
}

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
});

/**
 * Stream for Morgan HTTP logger middleware
 */
export const httpLoggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Log levels:
 * - error: 0
 * - warn: 1
 * - info: 2
 * - http: 3
 * - verbose: 4
 * - debug: 5
 * - silly: 6
 */

// Log initialization
logger.info('Logger initialized', {
  environment: NODE_ENV,
  level: LOG_LEVEL,
  transports: transports.map((t) => t.constructor.name),
  fileLogging: NODE_ENV === 'production' || !!LOG_FILE_PATH,
});

export default logger;
