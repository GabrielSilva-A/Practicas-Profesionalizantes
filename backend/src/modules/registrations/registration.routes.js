'use strict';

const { Router } = require('express');
const { requireSameOrigin } = require('../../middlewares/requireSameOrigin');
const {
  getSeccionales,
  postEmpresa,
  postSeccional,
} = require('./registration.controller');

const router = Router();

router.get('/seccionales', getSeccionales);
router.post('/seccionales', requireSameOrigin, postSeccional);
router.post('/empresas/registro', requireSameOrigin, postEmpresa);

module.exports = router;
