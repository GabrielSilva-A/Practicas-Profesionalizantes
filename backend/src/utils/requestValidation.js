'use strict';

const { httpError } = require('./httpError');

function getObjectBody(body, allowedFields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw httpError(422, 'VALIDACION', 'Revisá los datos ingresados');
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  );
  if (unknownFields.length > 0) {
    throw httpError(422, 'VALIDACION', 'La solicitud contiene campos no permitidos');
  }

  return body;
}

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw httpError(422, 'VALIDACION', `El campo ${field} es obligatorio`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw httpError(422, 'VALIDACION', `El campo ${field} supera el largo permitido`);
  }

  return normalized;
}

function requiredInteger(value, field, minimum = 1) {
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > 2_147_483_647
  ) {
    throw httpError(
      422,
      'VALIDACION',
      `El campo ${field} debe ser un número entero válido`,
    );
  }

  return value;
}

function requiredEmail(value) {
  const email = requiredText(value, 'email', 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(422, 'VALIDACION', 'Ingresá un correo electrónico válido');
  }
  return email;
}

function requiredPassword(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw httpError(422, 'VALIDACION', 'La contraseña es obligatoria');
  }

  if (Buffer.byteLength(value, 'utf8') > 72) {
    throw httpError(
      422,
      'VALIDACION',
      'La contraseña no puede superar los 72 bytes',
    );
  }

  return value;
}

module.exports = {
  getObjectBody,
  requiredEmail,
  requiredInteger,
  requiredPassword,
  requiredText,
};
