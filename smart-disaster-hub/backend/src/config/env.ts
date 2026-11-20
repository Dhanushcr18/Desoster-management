import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.trim() === '') {
  if (isProduction) {
    console.error('FATAL: JWT_SECRET environment variable is required in production.');
    console.error('The server refuses to start without a secure JWT_SECRET of at least 32 characters.');
    process.exit(1);
  } else {
    // Generate an ephemeral random 32-byte (64 hex char) secret for development
    jwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '⚠️ [SECURITY WARNING] JWT_SECRET is not set in development. Generated a temporary random secret for this session.'
    );
  }
} else if (isProduction && jwtSecret.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long in production.');
  process.exit(1);
}

export const env = {
  NODE_ENV,
  isProduction,
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OSRM_URL: process.env.OSRM_URL || 'https://router.project-osrm.org',
  AGENT_INTERVAL_MIN: parseFloat(process.env.AGENT_INTERVAL_MIN || '5'),
  SIM_SPEED: parseFloat(process.env.SIM_SPEED || '60'),
  BLOCKED_ROAD_DELAY_MIN: parseInt(process.env.BLOCKED_ROAD_DELAY_MIN || '360', 10),
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_DEFAULT_CHAT_ID: process.env.TELEGRAM_DEFAULT_CHAT_ID || '',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
};

export default env;
