require('dotenv').config();

const path = require('path');

const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4321';
const PUBLIC_BACKEND_URL = process.env.PUBLIC_BACKEND_URL || `http://localhost:${PORT}`;

// Maximum MP4 quality allowed by the backend. 4320p = 8K.
const MAX_QUALITY = Math.min(Number(process.env.MAX_QUALITY || 4320), 4320);

const FILE_TTL_MINUTES = Number(process.env.FILE_TTL_MINUTES || 60);
const ALLOW_UNLISTED_SITES = String(process.env.ALLOW_UNLISTED_SITES || 'false') === 'true';
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');

module.exports = {
  PORT,
  FRONTEND_URL,
  PUBLIC_BACKEND_URL,
  MAX_QUALITY,
  FILE_TTL_MINUTES,
  ALLOW_UNLISTED_SITES,
  DOWNLOAD_DIR,
};
