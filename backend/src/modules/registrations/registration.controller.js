'use strict';

const {
  createEmpresa,
  createSeccional,
  getSeccionalesActivas,
} = require('./registration.service');

async function getSeccionales(req, res) {
  res.set('Cache-Control', 'no-store');
  const data = await getSeccionalesActivas();
  return res.status(200).json({ data });
}

async function postSeccional(req, res) {
  res.set('Cache-Control', 'no-store');
  const data = await createSeccional(req.body);
  return res.status(201).json({ data });
}

async function postEmpresa(req, res) {
  res.set('Cache-Control', 'no-store');
  const data = await createEmpresa(req.body);
  return res.status(201).json({ data });
}

module.exports = { getSeccionales, postEmpresa, postSeccional };
