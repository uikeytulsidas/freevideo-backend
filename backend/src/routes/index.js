const express = require('express');
const videoRoutes = require('./video.routes');

const router = express.Router();

router.use('/', videoRoutes);

module.exports = router;
