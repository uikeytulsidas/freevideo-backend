const app = require('./app');
const { PORT, PUBLIC_BACKEND_URL } = require('./config');
const { ensureDownloadDir } = require('./utils/file');
const { startCleanupJob } = require('./jobs/cleanup.job');

ensureDownloadDir();
startCleanupJob();

app.listen(PORT, () => {
  console.log(`Backend running on ${PUBLIC_BACKEND_URL}`);
});
