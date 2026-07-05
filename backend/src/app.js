const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { FRONTEND_URL } = require('./config');
const apiRoutes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: FRONTEND_URL, credentials: false }));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Video downloader backend is running.',
    endpoints: ['/api/health', '/api/info', '/api/download'],
  });
});

app.use('/api', apiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
