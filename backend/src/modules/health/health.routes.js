'use strict';

const { Router } = require('express');
const { getLiveness, getDatabaseHealth } = require('./health.controller');

const router = Router();

router.get('/health', getLiveness);
router.get('/health/db', getDatabaseHealth);

module.exports = router;
