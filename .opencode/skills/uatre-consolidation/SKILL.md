---
name: uatre-consolidation
description: >
  Contradicciones documentales conocidas, decisiones aprobadas pendientes
  de propagar y bloqueadores de consolidación del proyecto UATRE. Usar
  cuando se detecte una inconsistencia entre documentos, cuando se trabaje
  en Fase 7 u 8, cuando se necesite saber qué está pendiente antes de
  implementar, o cuando una tarea toque un área con decisión abierta.
  NO usar para reglas de negocio directas ni para contratos HTTP;
  consultar las skills específicas.
---

# Consolidación documental UATRE

## Fuente de verdad

`docs/decisiones-pendientes.md` registra decisiones aprobadas, dudas
abiertas y correcciones documentales. `docs/execution-plan.md` define
bloqueadores antes de implementar. `docs/project-roadmap.md` describe el
estado de cada fase.

## Referencias

- `references/contradicciones-conocidas.md` — detalle de C-01 a C-06,
  bloqueadores D-06 / D-09 / D-15 / D-27 / D-33 / A-28, matriz de
  contradicciones activas con estado, documentos afectados, tratamiento y
  acción requerida. Cargar cuando la tarea toque un área con contradicción
  documental o cuando se necesite saber si una decisión ya fue propagada.

## Estado de fases

- **Fase 7 — Arquitectura:** EN CONSOLIDACIÓN. Base mínima documentada y
  scaffolding creado; pendientes de sesiones, concurrencia, jobs y
  despliegue.
- **Fase 8 — Diseño de API:** EN PROCESO. Contratos iniciales y OpenAPI
  parcial; no acredita cierre.
- **Fases 9 a 14:** PENDIENTES. No adelantar decisiones.

## Contradicciones activas (resumen)

| ID | Tema | Estado |
|---|---|---|
| C-01 | Chagas/FIFO en guías vs. RN-005/RN-054/RN-103 | Consolidada en reglas |
| C-04 | `diagrama-motor.md` omite ANOTADO y sanciones | ABIERTA |
| C-05 | `business-rules.md` sección 33 con 13 tablas | SUBSANADA (2026-10-02) |
| C-06 | `primera_vez_login` ausente en `BD/bd_uatre.sql` | SUBSANADA (columna en SQL, Prisma y docs) |
| D-06 | Motor SQL hace cobertura excepcional automática | ABIERTA — bloqueador crítico |
| D-09 | Pedidos vencidos vs. REQ-SISTEMA-003 | CONSOLIDADA; docs señalizados, propagación pendiente |
| D-15 | Pizarrón dinámico vs. congelado (REQ-SISTEMA-005) | CONSOLIDADA; docs señalizados, propagación pendiente |
| D-27 | Estados visibles (REQ-EMPRESA-004) | CONSOLIDADA; docs señalizados, propagación pendiente |
| D-33 | Login trabajador: nombre vs. email | CONSOLIDADA y propagada (2026-10-02) |
| D-26 | Sin notificaciones en esta etapa | CONSOLIDADA y propagada (2026-10-02) |
| A-28 | `trg_reset_presente_hoy` contradice A-28 | CONSOLIDADA y propagada (2026-10-02) |

Detalle completo, con documentos afectados, tratamiento y acción requerida,
en `references/contradicciones-conocidas.md`.

## Bloqueadores antes de implementar

1. **Refactorizar `fn_ejecutar_motor`** para que la cobertura excepcional
   sea manual (D-06). No ejecutar el motor actual.
2. **Resolver D-09, D-15 y D-27** en `requirements.md` y UC (decisiones
   consolidadas cuya propagación está pendiente de confirmación).

## Dudas abiertas que no bloquean

- **D-34:** recuperación de contraseña por email (diseño futuro, sin
  endpoint definido).
- **D-36:** vinculación de identidad Google con trabajador registrado por
  UATRE. El alta por UATRE sigue vigente.

## Cómo actuar ante una contradicción

Cuando una tarea toque un área con contradicción **ABIERTA**:

1. Detenerse.
2. Señalar la contradicción con su ID (por ejemplo, "D-06").
3. Citar los documentos afectados.
4. Proponer el tratamiento alineado con la decisión aprobada.
5. Esperar confirmación antes de implementar.

No elegir silenciosamente una interpretación. No modificar reglas de
negocio para simplificar código (regla obligatoria del `AGENTS.md`).

## Cuándo NO usar esta skill

- Si la tarea requiere una regla de negocio concreta →
  `uatre-domain-rules`.
- Si la tarea requiere un contrato HTTP → `uatre-api-contracts`.
- Si la tarea requiere el esquema físico → `uatre-database-schema`.
- Si la tarea requiere el flujo del motor → `uatre-motor-flow`.