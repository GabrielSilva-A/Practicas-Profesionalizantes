class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor. Revisá que la API esté activa.', {
      cause: error,
    });
  }

  if (response.status === 204) {
    return null;
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error('El servidor devolvió una respuesta inesperada.', {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || 'No se pudo completar la solicitud.',
      response.status,
      payload?.error?.code || 'ERROR_SOLICITUD',
    );
  }

  if (!payload || !Object.hasOwn(payload, 'data')) {
    throw new Error('La respuesta del servidor no tiene el formato esperado.');
  }

  return payload.data;
}

async function healthRequest(path) {
  const response = await fetch(`/api/v1${path}`, { credentials: 'same-origin' });
  const body = await response.json();
  return { ok: response.ok, status: response.status, body };
}

export function getHealth() {
  return healthRequest('/health');
}

export function getDatabaseHealth() {
  return healthRequest('/health/db');
}

export function login(identificador, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { identificador, password },
  });
}

export function getSession() {
  return request('/auth/me');
}

export function logout() {
  return request('/auth/logout', { method: 'POST', body: {} });
}

export function getSeccionales() {
  return request('/seccionales');
}

export function registerSeccional(form) {
  return request('/seccionales', { method: 'POST', body: form });
}

export function registerEmpresa(form) {
  return request('/empresas/registro', { method: 'POST', body: form });
}

export { ApiError };
