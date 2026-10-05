'use strict';

const env = require('../config/env');

/**
 * Middleware de manejo de errores centralizado. No expone detalles
 * internos (stack, configuración, mensajes de Prisma/Postgres) en
 * ninguna respuesta; en desarrollo los registra en consola para depurar.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (
    env.nodeEnv !== 'test' &&
    (!Number.isInteger(err.status) || err.status >= 500)
  ) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const parserError = {
    'entity.parse.failed': {
      status: 400,
      code: 'JSON_INVALIDO',
      message: 'El cuerpo de la solicitud no contiene JSON válido',
    },
    'entity.too.large': {
      status: 413,
      code: 'SOLICITUD_DEMASIADO_GRANDE',
      message: 'El cuerpo de la solicitud supera el tamaño permitido',
    },
    'request.aborted': {
      status: 400,
      code: 'SOLICITUD_INCOMPLETA',
      message: 'La solicitud se interrumpió antes de completarse',
    },
  }[err.type];
  const databaseUnavailable = ['P1001', 'P1002', 'P2024'].includes(err.code);
  const status = databaseUnavailable
    ? 503
    : parserError?.status || (Number.isInteger(err.status) ? err.status : 500);
  res.status(status).json({
    error: {
      code: parserError
        ? parserError.code
        : databaseUnavailable
          ? 'SERVICIO_NO_DISPONIBLE'
          : status >= 500
            ? 'ERROR_INTERNO'
            : err.code || 'ERROR_SOLICITUD',
      message:
        parserError?.message ||
        (status === 500
          ? 'Error interno del servidor'
          : databaseUnavailable
            ? 'La base de datos no está disponible temporalmente'
            : err.message),
      ...(!parserError && err.details ? { details: err.details } : {}),
    },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'RECURSO_NO_ENCONTRADO', message: 'Recurso no encontrado' },
  });
}

module.exports = { errorHandler, notFoundHandler };
