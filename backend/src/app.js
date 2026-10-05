'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const registrationRoutes = require('./modules/registrations/registration.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

/**
 * Configura la aplicación Express sin abrir ningún puerto.
 * El arranque del servidor HTTP vive en src/server.js, según
 * docs/architecture.md §4, para poder testear `app` sin escuchar.
 */
function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieParser());

  app.use('/api/v1', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1', registrationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
