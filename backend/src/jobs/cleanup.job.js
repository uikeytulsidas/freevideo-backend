const path = require('path');
const fs = require('fs-extra');
const { DOWNLOAD_DIR, FILE_TTL_MINUTES } = require('../config');

async function cleanupOldFiles() {
  const ttlMs = FILE_TTL_MINUTES * 60 * 1000;
  const now = Date.now();
  const files = await fs.readdir(DOWNLOAD_DIR);

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(DOWNLOAD_DIR, file);
      const stat = await fs.stat(filePath);

      if (now - stat.mtimeMs > ttlMs) {
        await fs.remove(filePath);
      }
    })
  );
}

function startCleanupJob() {
  setInterval(() => {
    cleanupOldFiles().catch(() => {});
  }, 10 * 60 * 1000);
}

module.exports = {
  cleanupOldFiles,
  startCleanupJob,
};
