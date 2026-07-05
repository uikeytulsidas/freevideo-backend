const express = require('express');
const { downloadLimiter } = require('../middleware/rateLimit.middleware');
const {
  healthCheck,
  analyzeVideo,
  prepareDownload,
  downloadFile,
} = require('../controllers/video.controller');

const router = express.Router();

router.get('/health', healthCheck);
router.post('/info', analyzeVideo);
router.post('/download', downloadLimiter, prepareDownload);
router.get('/file/:filename', downloadFile);

module.exports = router;
