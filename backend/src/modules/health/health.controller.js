'use strict';

const { prisma } = require('../../database/prismaClient');

/**
 * Liveness check: confirma que el proceso de la API responde,
 * sin depender de la base de datos ni exponer configuración interna.
 */
function getLiveness(req, res) {
  res.status(200).json({ status: 'ok' });
}

/**
 * Chequeo de disponibilidad de la base de datos, separado del liveness
 * de la API (docs/architecture.md §10). No expone cadenas de conexión
 * ni detalles del error subyacente, solo el resultado del chequeo.
 */
async function getDatabaseHealth(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({ status: 'unavailable' });
  }
}

module.exports = { getLiveness, getDatabaseHealth };
