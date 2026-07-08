// require('dotenv').config();

// const path = require('path');

// const PORT = Number(process.env.PORT || 5000);
// const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4321';
// const PUBLIC_BACKEND_URL = process.env.PUBLIC_BACKEND_URL || `http://localhost:${PORT}`;

// // Maximum MP4 quality allowed by the backend. 4320p = 8K.
// const MAX_QUALITY = Math.min(Number(process.env.MAX_QUALITY || 4320), 4320);

// const FILE_TTL_MINUTES = Number(process.env.FILE_TTL_MINUTES || 60);
// const ALLOW_UNLISTED_SITES = String(process.env.ALLOW_UNLISTED_SITES || 'false') === 'true';
// const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');

// module.exports = {
//   PORT,
//   FRONTEND_URL,
//   PUBLIC_BACKEND_URL,
//   MAX_QUALITY,
//   FILE_TTL_MINUTES,
//   ALLOW_UNLISTED_SITES,
//   DOWNLOAD_DIR,
// };


require('dotenv').config();

const path = require('path');

const PORT = Number(process.env.PORT || 5000);

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  'http://localhost:4321';

const PUBLIC_BACKEND_URL =
  process.env.PUBLIC_BACKEND_URL ||
  `http://localhost:${PORT}`;

const PUBLIC_API_URL =
  process.env.PUBLIC_API_URL ||
  PUBLIC_BACKEND_URL;

const MAX_QUALITY = Math.min(Number(process.env.MAX_QUALITY || 4320), 4320);
const FILE_TTL_MINUTES = Number(process.env.FILE_TTL_MINUTES || 60);
const ALLOW_UNLISTED_SITES = String(process.env.ALLOW_UNLISTED_SITES || 'false') === 'true';

const API_RATE_LIMIT = Number(process.env.API_RATE_LIMIT || 80);
const DOWNLOAD_RATE_LIMIT = Number(process.env.DOWNLOAD_RATE_LIMIT || 15);
const MAX_URL_LENGTH = Number(process.env.MAX_URL_LENGTH || 2048);

const YTDLP_BIN = process.env.YTDLP_BIN || '';
const YTDLP_TIMEOUT_MS = Number(process.env.YTDLP_TIMEOUT_MS || 600000);
const YTDLP_DEBUG = String(process.env.YTDLP_DEBUG || 'false') === 'true';

const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');

module.exports = {
  PORT,
  FRONTEND_URL,
  PUBLIC_BACKEND_URL,
  PUBLIC_API_URL,
  MAX_QUALITY,
  FILE_TTL_MINUTES,
  ALLOW_UNLISTED_SITES,
  API_RATE_LIMIT,
  DOWNLOAD_RATE_LIMIT,
  MAX_URL_LENGTH,
  YTDLP_BIN,
  YTDLP_TIMEOUT_MS,
  YTDLP_DEBUG,
  DOWNLOAD_DIR,
};