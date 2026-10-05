'use strict';

const env = require('../../config/env');
const { findSession, login, logout } = require('./auth.service');
const { SESSION_COOKIE, SESSION_TTL_MS } = require('./session.constants');

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_MS,
    path: '/api/v1',
  });
}

function setNoStore(res) {
  res.set('Cache-Control', 'no-store');
}

async function createSession(req, res) {
  setNoStore(res);
  const result = await login(req.body);
  setSessionCookie(res, result.token);
  res.status(200).json({ data: result.identity });
}

async function getSession(req, res) {
  setNoStore(res);
  const identity = await findSession(req.cookies[SESSION_COOKIE]);
  return res.status(200).json({ data: identity });
}

async function destroySession(req, res) {
  setNoStore(res);
  await logout(req.cookies[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/v1',
  });
  return res.status(204).end();
}

module.exports = { createSession, destroySession, getSession };
