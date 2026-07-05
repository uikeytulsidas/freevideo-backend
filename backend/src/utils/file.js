const path = require('path');
const fs = require('fs-extra');
const { DOWNLOAD_DIR } = require('../config');

function ensureDownloadDir() {
  fs.ensureDirSync(DOWNLOAD_DIR);
}

function removeUnsafeFilenameChars(value) {
  return String(value || 'video')
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeFileName(value, maxLength = 140) {
  const clean = removeUnsafeFilenameChars(value)
    .replace(/\.+$/g, '')
    .slice(0, maxLength)
    .trim();

  return clean || 'video';
}

function removeKnownExtension(value) {
  return String(value || '').replace(/\.(mp4|mp3|m4a|webm|mov|mkv|aac|opus)$/i, '');
}

function normalizeExtension(value, fallback = 'mp4') {
  const ext = String(value || fallback).replace(/^\./, '').toLowerCase();
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : fallback;
}

function buildDownloadFileName(title, qualityTag = 'video', ext = 'mp4') {
  const extension = normalizeExtension(ext, ext === 'mp3' ? 'mp3' : 'mp4');
  const cleanTitle = safeFileName(removeKnownExtension(title), 150);
  const cleanQuality = safeFileName(qualityTag || 'video', 24).replace(/\s+/g, '');

  return `${cleanTitle}_${cleanQuality}.${extension}`;
}

function stripInternalPrefix(filename) {
  return String(filename || '').replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '');
}

function getDownloadDisplayName(internalFilename, requestedName = '') {
  const internalExt = normalizeExtension(path.extname(internalFilename), 'mp4');
  const cleanedRequested = safeFileName(requestedName || stripInternalPrefix(internalFilename), 180);
  const requestedWithoutExt = removeKnownExtension(cleanedRequested);

  return `${requestedWithoutExt}.${internalExt}`;
}

async function findDownloadedFile(prefix) {
  const files = await fs.readdir(DOWNLOAD_DIR);
  const match = files.find((file) => file.startsWith(prefix));

  if (!match) return null;
  return path.join(DOWNLOAD_DIR, match);
}

async function fileExists(filePath) {
  return fs.pathExists(filePath);
}

module.exports = {
  ensureDownloadDir,
  safeFileName,
  buildDownloadFileName,
  stripInternalPrefix,
  getDownloadDisplayName,
  findDownloadedFile,
  fileExists,
};
