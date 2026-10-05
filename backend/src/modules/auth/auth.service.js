'use strict';

const { createHash, randomBytes } = require('node:crypto');
const bcrypt = require('bcrypt');
const { prisma } = require('../../database/prismaClient');
const { httpError } = require('../../utils/httpError');
const {
  getObjectBody,
  requiredEmail,
  requiredPassword,
} = require('../../utils/requestValidation');
const { SESSION_TTL_MS } = require('./session.constants');

const SUPPORTED_TYPES = new Set(['SECCIONAL', 'EMPRESA']);
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  'not-a-valid-uatre-account-password',
  12,
);

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function sessionIdentity(usuario) {
  return {
    usuario_id: usuario.id,
    tipo: usuario.tipo,
    primera_vez_login: false,
  };
}

async function login(body) {
  const input = getObjectBody(body, ['identificador', 'password']);
  const email = requiredEmail(input.identificador);
  const password = requiredPassword(input.password);

  const usuario = await prisma.usuario.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      tipo: true,
      activo: true,
    },
  });

  const passwordMatches = await bcrypt.compare(
    password,
    usuario?.passwordHash || DUMMY_PASSWORD_HASH,
  );

  if (!usuario || !SUPPORTED_TYPES.has(usuario.tipo) || !passwordMatches) {
    throw httpError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos');
  }

  if (!usuario.activo) {
    throw httpError(403, 'CUENTA_INACTIVA', 'La cuenta está inactiva');
  }

  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const tokenHash = hashToken(token);

  await prisma.$transaction([
    prisma.sesion.deleteMany({ where: { fechaExpiracion: { lte: now } } }),
    prisma.sesion.create({
      data: {
        tokenHash,
        usuarioId: usuario.id,
        fechaExpiracion: expiresAt,
      },
    }),
  ]);

  return { token, identity: sessionIdentity(usuario) };
}

async function findSession(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.sesion.findUnique({
    where: { tokenHash },
    include: {
      usuario: {
        select: {
          id: true,
          tipo: true,
          activo: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (
    session.fechaExpiracion <= new Date() ||
    !session.usuario.activo ||
    !SUPPORTED_TYPES.has(session.usuario.tipo)
  ) {
    await prisma.sesion.deleteMany({ where: { id: session.id } });
    return null;
  }

  return sessionIdentity(session.usuario);
}

async function logout(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return;
  }
  await prisma.sesion.deleteMany({ where: { tokenHash: hashToken(token) } });
}

module.exports = { findSession, login, logout };
