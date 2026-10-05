'use strict';

const env = require('./config/env');
const createApp = require('./app');
const { disconnect } = require('./database/prismaClient');

const app = createApp();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API escuchando en el puerto ${env.port} (${env.nodeEnv})`);
});

/**
 * Cierre ordenado: deja de aceptar conexiones nuevas, espera a que
 * terminen las activas y cierra el cliente Prisma antes de salir.
 */
async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Señal ${signal} recibida, cerrando servidor...`);

  server.close(async (err) => {
    await disconnect();
    if (err) {
      process.exitCode = 1;
    }
    process.exit();
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
