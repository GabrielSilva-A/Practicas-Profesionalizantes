'use strict';

const { httpError } = require('../../utils/httpError');
const { findSession } = require('./auth.service');
const { SESSION_COOKIE } = require('./session.constants');

async function requireSession(req, res, next) {
  const identity = await findSession(req.cookies[SESSION_COOKIE]);
  if (!identity) {
    return next(httpError(401, 'SESION_INVALIDA', 'La sesión no es válida o expiró'));
  }

  req.auth = identity;
  return next();
}

module.exports = { requireSession };
