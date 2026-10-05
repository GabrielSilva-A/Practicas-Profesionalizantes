'use strict';

const env = require('../config/env');
const { httpError } = require('../utils/httpError');

const allowedOrigins = new Set(
  env.webOrigins.map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return '';
    }
  }),
);

function requireSameOrigin(req, res, next) {
  const requestOrigin = req.get('origin');
  let normalizedOrigin = '';

  try {
    normalizedOrigin = requestOrigin ? new URL(requestOrigin).origin : '';
  } catch {
    normalizedOrigin = '';
  }

  if (
    !requestOrigin ||
    normalizedOrigin !== requestOrigin ||
    !allowedOrigins.has(normalizedOrigin) ||
    !req.is('application/json')
  ) {
    return next(
      httpError(
        403,
        'ORIGEN_NO_PERMITIDO',
        'Solicitud rechazada: se requiere un origen permitido y contenido JSON',
      ),
    );
  }

  return next();
}

module.exports = { requireSameOrigin };
