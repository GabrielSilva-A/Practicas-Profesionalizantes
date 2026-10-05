---
name: uatre-database-schema
description: >
  Esquema PostgreSQL, 15 tablas, 7 vistas, 9 triggers, 3 funciones y
  migraciones Prisma del sistema UATRE. Usar cuando se trabaje con
  persistencia, migraciones, integridad, triggers, índices o el esquema
  físico. Usar también cuando se necesite verificar columnas, constraints
  o FKs antes de escribir SQL o Prisma. NO usar para decisiones de negocio
  ni para contratos HTTP; consultar las skills específicas.
---

# Esquema de base de datos UATRE

## Fuente de verdad

`BD/bd_uatre.sql` es el DDL completo y actualizado (15 tablas, 7
vistas, 9 triggers, 3 funciones). `docs/base_datos.md` documenta la
estructura pero **omite `asistencia.verificado`** y describe un trigger
obsoleto. `backend/prisma/schema.prisma` refleja el esquema para Prisma.

Ante discrepancia entre `BD/bd_uatre.sql` y `base_datos.md`, prevalecer el
SQL y registrar la corrección en `decisiones-pendientes.md`.

## Referencias

- `references/tablas-y-triggers.md` — detalle de las 15 tablas, 7 vistas,
  9 triggers, 3 funciones, índices críticos, migraciones pendientes y reglas
  de escritura SQL/Prisma. Cargar cuando la tarea requiera el esquema físico
  completo o verificar una columna, constraint o trigger puntual.

## Tablas core (resumen)

- **Estructura:** `seccionales`, `empresas`, `establecimientos`,
  `tareas_empresa`, `trabajadores`, `usuarios`, `lista_rotacion`.
- **Condiciones:** `asistencia`, `atrasos`, `sanciones`, `inhabilitaciones`.
- **Operación:** `pedidos`, `cola_pedidos`, `designaciones`,
  `pedido_historial`.

## Triggers críticos (resumen)

- `trg_sync_presente_flags`: sincroniza flags al cerrar asistencia.
- `trg_crear_atraso_inicial`: crea registro de atrasos al insertar
  trabajador.
- `trg_descontar_atraso_al_designar`: descuenta 1 atraso al designar.
- `trg_descuento_atraso_ausencia`: descuenta atraso si AUSENTE al cerrar.

Detalle completo en `references/tablas-y-triggers.md`.

## Pendientes

- Refactor de `fn_ejecutar_motor` (D-06): pendiente, ver skill
  `uatre-consolidation`.

## Advertencias

- `fn_ejecutar_motor` incluye cobertura excepcional automática;
  contradice D-06. No ejecutar sin refactorizar. Ver skill
  `uatre-motor-flow`.
- La documentación del esquema ya está alineada (2026-10-02):
  `base_datos.md` incluye `verificado` y `primera_vez_login`;
  `business-rules.md` §33 lista las 15 tablas con FKs; `trg_reset_presente_hoy`
  fue eliminado de los documentos (A-28).

## Reglas al escribir SQL o Prisma

1. No agregar columnas sin actualizar `BD/bd_uatre.sql` y `base_datos.md`.
2. Usar las vistas existentes antes de escribir consultas complejas.
3. Confiar en los triggers para sincronización de flags y estados; no
   duplicar en JS.
4. No duplicar la lógica del motor en el backend (RN-167).
5. Usar índices parciales en las consultas del motor.
6. Validar con los CHECK existentes antes de insertar.
7. Documentar cualquier cambio estructural en ambos documentos.

## Cuándo NO usar esta skill

- Si la tarea es decidir elegibilidad o prioridad → `uatre-domain-rules`.
- Si la tarea es definir o modificar un endpoint → `uatre-api-contracts`.
- Si la tarea es entender el flujo de asignación → `uatre-motor-flow`.
- Si la tarea es resolver una contradicción documental →
  `uatre-consolidation`.