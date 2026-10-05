---
name: uatre-api-contracts
description: >
  Contratos HTTP, códigos de error, convenciones de respuesta y estado de
  implementación de la API UATRE. Usar cuando se implemente, modifique o
  pruebe un endpoint, o cuando se necesite saber si una ruta es `planned`
  o está implementada. NO usar para decisiones de negocio.
---

# Contratos API UATRE

## Fuente de verdad
`docs/api-design.md` describe convenciones y contratos iniciales.
`docs/openapi.yaml` formaliza el contrato parcial. Prefijo `/api/v1`.

## Convenciones
- Recursos en español, plural, sin acentos.
- JSON `snake_case`; IDs enteros positivos.
- Respuesta individual: `{ "data": { ... } }`.
- Error: `{ "error": { "code", "message", "details?" } }`.
- `Cache-Control: no-store` en respuestas con credenciales o sesión.
- Mutaciones requieren `Origin` permitido y `Content-Type: application/json`.
- `WEB_ORIGINS` configura orígenes por entorno.

## Estados de implementación
- **Implementado**: `GET /health`, `GET /health/db`, `POST /auth/login`,
  `GET /auth/me`, `POST /auth/logout`, `POST /seccionales`,
  `GET /seccionales`, `POST /empresas/registro`.
- **`planned`**: todo lo demás en OpenAPI.
- No invocar rutas `planned` desde el cliente hasta que se implementen.

## Códigos de error estables
- 400 JSON mal formado.
- 401 credenciales inválidas / sesión inválida.
- 403 actor no autorizado / cambio de contraseña requerido.
- 404 recurso inexistente o fuera de ámbito (sin revelar existencia).
- 409 conflicto de unicidad o estado operativo.
- 422 validación.
- 500 / 503 errores internos o indisponibilidad.

## Advertencias
- `api-design.md` dice que el login de trabajador permite nombre o email;
  D-33 consolidó email exclusivamente. Alinear antes de implementar.
- D-35 define Google como único acceso futuro de trabajadores; el login
  local de trabajador no debe habilitarse.
- D-29 (renovación de sesión por actividad) sigue abierta; no implementar
  polling como renovación.