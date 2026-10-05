'use strict';

require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const defaultWebOrigins =
  nodeEnv === 'development'
    ? ['http://localhost:5173', 'http://127.0.0.1:5173']
    : [];

/**
 * Configuración centralizada leída desde variables de entorno.
 * No se expone este módulo completo hacia afuera de la API; los
 * endpoints públicos (p. ej. /health) solo devuelven derivados seguros.
 */
const env = {
  nodeEnv,
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL || null,
  timezone: process.env.TZ || 'America/Argentina/Buenos_Aires',
  webOrigins: (process.env.WEB_ORIGINS || defaultWebOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

module.exports = env;
