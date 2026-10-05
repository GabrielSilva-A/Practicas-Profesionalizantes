# AGENTS.md — Sistema UATRE

## Qué es este proyecto
Sistema web multiseccional para gestionar solicitud y asignación de personal
eventual en seccionales de UATRE. Monolito modular: Express + Prisma +
PostgreSQL en `backend/`, Vite + React en `frontend/`.

## Estado actual
- Fase 7 EN CONSOLIDACIÓN; Fase 8 EN PROCESO.
- Implementado: healthchecks, login/logout EMPRESA/SECCIONAL, registros
  públicos de seccionales y empresas.
- Pendiente: motor de nombramiento, asistencia, pedidos, designaciones,
  pizarrón e historial.
- Bloqueadores activos: ver `docs/execution-plan.md`.

## Comandos esenciales
- `cd backend && npm run dev` — API Express.
- `cd backend && npx prisma migrate dev` — migraciones.
- `cd frontend && npm run dev` — cliente Vite.
- `node --test` — runner nativo de pruebas.

## Fuentes de verdad
| Área | Documento |
|---|---|
| Reglas de negocio | `docs/business-rules.md` |
| Requerimientos | `docs/requirements.md` |
| Casos de uso | `docs/uc-uatre.md`, `docs/uc-empresa.md`, `docs/uc-trabajador.md` |
| Modelo de dominio | `docs/modelo-dominio.md` |
| Esquema SQL | `BD/bd_uatre.sql` |
| Diseño de API | `docs/api-design.md` y `docs/openapi.yaml` |
| Decisiones | `docs/decisiones-pendientes.md` |
| Plan de ejecución | `docs/execution-plan.md` |

## Reglas obligatorias para el agente
1. Antes de implementar, leer `docs/decisiones-pendientes.md`.
2. No implementar suposiciones sobre dudas abiertas (D-34, D-36).
3. No duplicar efectos ya aplicados en SQL (triggers, funciones).
4. No modificar reglas de negocio para simplificar código.
5. Señalar contradicciones documentales antes de avanzar.
6. No adelantar decisiones de fases posteriores (frontend, deployment).

## Skills disponibles
- `uatre-domain-rules` — reglas de negocio y elegibilidad.
- `uatre-api-contracts` — contratos HTTP y OpenAPI.
- `uatre-database-schema` — esquema SQL, migraciones y Prisma.
- `uatre-motor-flow` — flujo del motor de nombramiento.
- `uatre-consolidation` — alinear documentos y resolver contradicciones.

Usar la skill cuando la tarea lo requiera; no cargar todo el contexto.