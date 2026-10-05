'use strict';

process.env.NODE_ENV = 'test';
process.env.WEB_ORIGINS = 'http://localhost:5173';

const { once } = require('node:events');
const { afterEach, test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const createApp = require('../src/app');
const { prisma } = require('../src/database/prismaClient');

const originalPrismaMethods = {
  queryRaw: prisma.$queryRaw,
  transaction: prisma.$transaction,
  usuarioFindFirst: prisma.usuario.findFirst,
  sesionCreate: prisma.sesion.create,
  sesionDeleteMany: prisma.sesion.deleteMany,
};

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        ...headers,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    return {
      status: response.status,
      headers: response.headers,
      body: response.status === 204 ? null : await response.json(),
    };
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function restorePrisma() {
  prisma.$queryRaw = originalPrismaMethods.queryRaw;
  prisma.$transaction = originalPrismaMethods.transaction;
  prisma.usuario.findFirst = originalPrismaMethods.usuarioFindFirst;
  prisma.sesion.create = originalPrismaMethods.sesionCreate;
  prisma.sesion.deleteMany = originalPrismaMethods.sesionDeleteMany;
}

afterEach(restorePrisma);

test('reports API liveness without accessing PostgreSQL', async () => {
  prisma.$queryRaw = async () => {
    throw new Error('The liveness endpoint must not query the database');
  };

  const response = await request('/api/v1/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('reports database availability and unavailability without exposing errors', async () => {
  prisma.$queryRaw = async () => 1;
  const available = await request('/api/v1/health/db');

  prisma.$queryRaw = async () => {
    throw new Error('connection refused');
  };
  const unavailable = await request('/api/v1/health/db');

  assert.equal(available.status, 200);
  assert.deepEqual(available.body, { status: 'ok' });
  assert.equal(unavailable.status, 503);
  assert.deepEqual(unavailable.body, { status: 'unavailable' });
});

test('rejects mutable requests without an allowed origin', async () => {
  const response = await request('/api/v1/auth/logout', {
    method: 'POST',
    body: {},
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'ORIGEN_NO_PERMITIDO');
});

test('validates login input before accessing the database', async () => {
  prisma.usuario.findFirst = async () => {
    throw new Error('Validation must occur before querying the database');
  };

  const response = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173' },
    body: { identificador: 'cuenta@example.com' },
  });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDACION');
});

test('creates a seccional after validating its public registration', async () => {
  const executedStatements = [];
  const transactionClient = {
    seccional: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: 7, ...data }),
    },
    usuario: {
      findFirst: async () => null,
      create: async () => ({ id: 12 }),
    },
    $executeRaw: async (statement) => {
      executedStatements.push(statement);
      return 1;
    },
  };
  prisma.$transaction = async (callback) => callback(transactionClient);

  const response = await request('/api/v1/seccionales', {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173' },
    body: {
      numero: 10,
      localidad: 'Rafaela',
      provincia: 'Santa Fe',
      email: 'seccional@example.com',
      password: 'password-de-prueba',
      cantidad_numeros: 3,
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(response.body.data, {
    id: 7,
    numero: 10,
    localidad: 'Rafaela',
    provincia: 'Santa Fe',
    cantidad_numeros: 3,
    punto_rotacion: 1,
    activo: true,
  });
  assert.equal(executedStatements.length, 2);
});

test('creates an opaque session for valid company credentials', async () => {
  const passwordHash = await bcrypt.hash('password-de-prueba', 4);
  let savedSession;
  prisma.usuario.findFirst = async () => ({
    id: 3,
    email: 'empresa@example.com',
    passwordHash,
    tipo: 'EMPRESA',
    activo: true,
  });
  prisma.sesion.deleteMany = async () => ({ count: 0 });
  prisma.sesion.create = async ({ data }) => {
    savedSession = data;
    return { id: 1, ...data };
  };
  prisma.$transaction = async (operations) => Promise.all(operations);

  const response = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173' },
    body: {
      identificador: 'empresa@example.com',
      password: 'password-de-prueba',
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, {
    usuario_id: 3,
    tipo: 'EMPRESA',
    primera_vez_login: false,
  });
  assert.match(response.headers.get('set-cookie'), /uatre_session=/);
  assert.match(savedSession.tokenHash, /^[a-f0-9]{64}$/);
  assert.ok(savedSession.fechaExpiracion > new Date());
});

test('returns a safe database-unavailable error for login', async () => {
  prisma.usuario.findFirst = async () => {
    const error = new Error('database host is unreachable');
    error.code = 'P1001';
    throw error;
  };

  const response = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173' },
    body: {
      identificador: 'empresa@example.com',
      password: 'password-de-prueba',
    },
  });

  assert.equal(response.status, 503);
  assert.equal(response.body.error.code, 'SERVICIO_NO_DISPONIBLE');
  assert.equal(
    response.body.error.message,
    'La base de datos no está disponible temporalmente',
  );
});

test('returns no identity without a session and logs out idempotently', async () => {
  const session = await request('/api/v1/auth/me');
  const logout = await request('/api/v1/auth/logout', {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173' },
    body: {},
  });

  assert.equal(session.status, 200);
  assert.deepEqual(session.body, { data: null });
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('set-cookie'), /uatre_session=/);
});
