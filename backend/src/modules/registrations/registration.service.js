'use strict';

const bcrypt = require('bcrypt');
const { prisma } = require('../../database/prismaClient');
const { httpError } = require('../../utils/httpError');
const {
  getObjectBody,
  requiredEmail,
  requiredInteger,
  requiredPassword,
  requiredText,
} = require('../../utils/requestValidation');

const BCRYPT_ROUNDS = 12;
const SECCIONAL_FIELDS = [
  'numero',
  'localidad',
  'provincia',
  'email',
  'password',
  'cantidad_numeros',
];
const EMPRESA_FIELDS = [
  'nombre',
  'localidad',
  'provincia',
  'seccional_id',
  'email',
  'password',
];

function throwDuplicateError(error, kind) {
  if (error.code !== 'P2002') {
    throw error;
  }

  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.join(' ')
    : String(error.meta?.target || '');

  if (kind === 'seccional' && target.includes('numero')) {
    throw httpError(
      409,
      'SECCIONAL_DUPLICADA',
      'El número de seccional ya está registrado',
    );
  }

  throw httpError(409, 'EMAIL_EN_USO', 'El correo electrónico ya está en uso');
}

async function getSeccionalesActivas() {
  const seccionales = await prisma.seccional.findMany({
    where: { activo: true },
    orderBy: { numero: 'asc' },
    select: {
      id: true,
      numero: true,
      localidad: true,
      provincia: true,
    },
  });

  return seccionales.map((seccional) => ({
    id: seccional.id,
    numero: seccional.numero,
    localidad: seccional.localidad,
    provincia: seccional.provincia,
  }));
}

async function createSeccional(body) {
  const input = getObjectBody(body, SECCIONAL_FIELDS);
  const numero = requiredInteger(input.numero, 'numero');
  const cantidadNumeros = requiredInteger(
    input.cantidad_numeros,
    'cantidad_numeros',
  );
  const localidad = requiredText(input.localidad, 'localidad', 100);
  const provincia = requiredText(input.provincia, 'provincia', 100);
  const email = requiredEmail(input.email);
  const password = requiredPassword(input.password);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const [existingSeccional, existingUser] = await Promise.all([
          tx.seccional.findUnique({ where: { numero }, select: { id: true } }),
          tx.usuario.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select: { id: true },
          }),
        ]);

        if (existingSeccional) {
          throw httpError(
            409,
            'SECCIONAL_DUPLICADA',
            'El número de seccional ya está registrado',
          );
        }
        if (existingUser) {
          throw httpError(409, 'EMAIL_EN_USO', 'El correo electrónico ya está en uso');
        }

        const seccional = await tx.seccional.create({
          data: {
            numero,
            localidad,
            provincia,
            puntoRotacion: 1,
            cantidadNumeros,
            activo: true,
          },
        });

        await tx.$executeRaw`SET LOCAL statement_timeout = '15000ms'`;
        await tx.$executeRaw`
          INSERT INTO lista_rotacion (seccional_id, numero, trabajador_id, activo)
          SELECT ${seccional.id}, posiciones.numero, NULL, TRUE
          FROM generate_series(1, ${cantidadNumeros}) AS posiciones(numero)
        `;

        await tx.usuario.create({
          data: {
            email,
            passwordHash,
            tipo: 'SECCIONAL',
            seccionalId: seccional.id,
            activo: true,
          },
        });

        return {
          id: seccional.id,
          numero: seccional.numero,
          localidad: seccional.localidad,
          provincia: seccional.provincia,
          cantidad_numeros: seccional.cantidadNumeros,
          punto_rotacion: seccional.puntoRotacion,
          activo: seccional.activo,
        };
      },
      { maxWait: 5000, timeout: 20000 },
    );
  } catch (error) {
    throwDuplicateError(error, 'seccional');
  }
}

async function createEmpresa(body) {
  const input = getObjectBody(body, EMPRESA_FIELDS);
  const nombre = requiredText(input.nombre, 'nombre', 200);
  const localidad = requiredText(input.localidad, 'localidad', 100);
  const provincia = requiredText(input.provincia, 'provincia', 100);
  const seccionalId = requiredInteger(input.seccional_id, 'seccional_id');
  const email = requiredEmail(input.email);
  const password = requiredPassword(input.password);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    return await prisma.$transaction(async (tx) => {
      const [seccional, existingUser] = await Promise.all([
        tx.seccional.findFirst({
          where: { id: seccionalId, activo: true },
          select: { id: true },
        }),
        tx.usuario.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          select: { id: true },
        }),
      ]);

      if (!seccional) {
        throw httpError(
          422,
          'SECCIONAL_NO_DISPONIBLE',
          'La seccional seleccionada no está disponible',
        );
      }
      if (existingUser) {
        throw httpError(409, 'EMAIL_EN_USO', 'El correo electrónico ya está en uso');
      }

      const empresa = await tx.empresa.create({
        data: {
          nombre,
          localidad,
          provincia,
          seccionalId,
          activa: true,
        },
      });

      await tx.usuario.create({
        data: {
          email,
          passwordHash,
          tipo: 'EMPRESA',
          empresaId: empresa.id,
          activo: true,
        },
      });

      return {
        id: empresa.id,
        nombre: empresa.nombre,
        localidad: empresa.localidad,
        provincia: empresa.provincia,
        seccional_id: empresa.seccionalId,
        activa: empresa.activa,
      };
    });
  } catch (error) {
    throwDuplicateError(error, 'empresa');
  }
}

module.exports = {
  createEmpresa,
  createSeccional,
  getSeccionalesActivas,
};
