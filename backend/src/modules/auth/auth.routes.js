'use strict';

const { Router } = require('express');
const { requireSameOrigin } = require('../../middlewares/requireSameOrigin');
const {
  createSession,
  destroySession,
  getSession,
} = require('./auth.controller');

const router = Router();

router.post('/login', requireSameOrigin, createSession);
router.get('/me', getSession);
router.post('/logout', requireSameOrigin, destroySession);

module.exports = router;
