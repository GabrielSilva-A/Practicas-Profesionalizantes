'use strict';

const { PrismaClient } = require('@prisma/client');

/**
 * Cliente Prisma único por proceso (no uno por petición), según lo
 * definido en docs/architecture.md §4. Los módulos de negocio deben
 * importar esta instancia en lugar de instanciar PrismaClient por su cuenta.
 */
const prisma = new PrismaClient();

/**
 * Cierra la conexión del cliente Prisma de forma ordenada.
 * Debe invocarse durante el apagado del proceso (ver src/server.js).
 */
async function disconnect() {
  await prisma.$disconnect();
}

module.exports = { prisma, disconnect };
