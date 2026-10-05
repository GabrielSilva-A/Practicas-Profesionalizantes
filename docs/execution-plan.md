# Plan de ejecucion — UATRE

**Fecha:** 2026-10-01  
**Estado:** Activo; no acredita el cierre de fases.

## Estado comprobado

| Estado | Alcance |
| --- | --- |
| Implementado | Healthchecks, registros publicos iniciales, sesion de EMPRESA/SECCIONAL y cliente inicial. |
| Diseñado y pendiente | Administracion autenticada, catalogos, asistencia, disponibilidad y sus contratos OpenAPI `planned`. |
| Pendiente de diseno | Recuperacion de contrasena por email (D-34) y vinculacion de identidad Google de trabajador (D-36). |
| Bloqueado | El SQL del motor y varios documentos conservan reglas reemplazadas por D-06 a D-35. |
| Fuera de alcance inmediato | Notificaciones, autenticacion Google de trabajadores, recuperacion por email, hosting y despliegue. |

## Etapas y criterios

| Etapa | Objetivo | Dependencias | Entregables | Riesgo | Criterio de finalizacion |
| --- | --- | --- | --- | --- | --- |
| 0. Consolidacion | Alinear RN, REQ, UC, diseno API y OpenAPI con decisiones aprobadas. | D-06 a D-35. | Fuentes sin contradicciones, contratos trazables y `planned` correctos. | Implementar sobre reglas obsoletas. | Revision cruzada de fuentes y OpenAPI valido. |
| 1. Persistencia | Incorporar campos aprobados y retirar efectos SQL contradictorios. | Etapa 0. | Migraciones de `primera_vez_login` y `asistencia.verificado`; trigger de apertura revisado. | Duplicar efectos entre SQL y servicios. | Esquema reproducible desde cero y pruebas de migracion. |
| 2. Acceso y administracion | Habilitar administracion autenticada segura. | Etapa 1. | Password inicial, sesion restringida, actividad explicita, seccional, empresas, trabajadores y lista. | Fuga entre seccionales o actores. | Pruebas de autorizacion y aislamiento. |
| 3. Catalogos | Gestionar establecimientos y tareas. | Etapa 2. | Rutas y vistas de catalogos con proteccion de referencias futuras. | Desactivar datos usados por pedidos. | Operaciones transaccionales y 409 documentado/probado. |
| 4. Asistencia | Registrar jornada y disponibilidad. | Etapas 1 y 2. | Abrir, verificar y cerrar asistencia despues de 07:40. | Flags inconsistentes o doble cierre. | Pruebas de cierre, concurrencia y sincronizacion atomica. |
| 5. Pedidos y designaciones | Implementar pedido, rotacion y cobertura manual. | Etapas 3 y 4; SQL revisado. | Pedidos, cancelacion, reproceso manual, motor ordinario y cobertura excepcional manual. | Designaciones o descuentos duplicados. | Pruebas transaccionales de RN-041 a RN-119. |
| 6. Pizarron e historial | Exponer informacion filtrada y preservar resultados finales. | Etapa 5. | Pizarron dinamico e historial final por jornada. | Exponer identidad o rotacion a EMPRESA. | Pruebas de privacidad por actor. |
| 7. Frontend | Implementar UX movil por actor. | Rutas backend de cada modulo. | Pantallas UATRE/EMPRESA; trabajador solo despues de Google. | Cliente invocando contratos `planned`. | Cada vista consume una ruta implementada y protegida. |
| 8. Jobs, calidad y operacion | Automatizar ciclos temporales y preparar operacion. | Etapas 5 a 7. | Jobs idempotentes, integracion PostgreSQL, backups, HTTPS y despliegue. | Reejecuciones tras reinicio. | Pruebas de recuperacion, concurrencia y restauracion. |

## Iteraciones ejecutables

### I0 — Consolidacion documental

- **Fuentes:** RN-041/042/045/074/081/086–090/093/099/118–119/128/144/150/167–169; REQ-UATRE-004, REQ-EMPRESA-001 a 004 y REQ-SISTEMA-003 a 005; UC de acceso, pedidos y pizarron.
- **Cambios:** propagar D-06 a D-35; alinear pedido vencido, pizarron dinamico, estados empresariales, acceso de trabajador y actividad de sesion.
- **No resolver:** D-34 y D-36.

### I1 — Fundacion de acceso y persistencia

- **Rutas:** `PATCH /auth/password`, endpoint de actividad de sesion a disenar, administracion `planned`.
- **Datos:** `usuarios.primera_vez_login` y `asistencia.verificado` (ambos ya en SQL); alinear su documentación en `base_datos.md`.
- **Pruebas:** migracion, password inicial, sesion restringida, entidad inactiva y aislamiento.

### I2 — Catalogos y asistencia

- **Rutas:** establecimientos, tareas y las tres rutas `/asistencia/hoy/*` `planned`.
- **Datos:** establecimientos, tareas_empresa, asistencia y trabajadores.
- **Pruebas:** catalogo referenciado por pedido futuro, cierre temprano, registros no verificados y doble cierre.

### I3 — Pedidos, motor y designaciones

- **Rutas:** se agregan solo despues de completar contratos OpenAPI revisados.
- **Datos:** pedidos, cola_pedidos, designaciones, atrasos, sanciones, inhabilitaciones y lista_rotacion.
- **Reglas:** cobertura excepcional manual, reproceso manual hasta ingreso, `NO_CUBIERTO` vencido, bloqueo total por designacion futura y redesignacion posterior a cancelacion.

### I4 — Pizarron, historial y jobs

- **Rutas:** pizarron e historial a disenar y formalizar.
- **Datos:** pedidos, pedido_historial y designaciones.
- **Procesos:** cola, inicio y fin automatico de trabajo, cambio de jornada; no dependen del polling.

## Bloqueadores antes de implementar

1. ~~El trigger `trg_reset_presente_hoy` contradice A-28.~~ **RESUELTO (2026-10-02):** eliminado de `base_datos.md`, `diagrama-asistencia.md` y `business-rules.md`; no existe en el SQL ni en las migraciones vigentes.
2. `fn_ejecutar_motor` realiza cobertura excepcional automatica, en contra de D-06.
3. REQ-SISTEMA-003 y REQ-SISTEMA-005 conservan transferencia/congelamiento que
   difieren de D-09 y D-15; los documentos están **señalizados** (2026-10-02)
   pero sin reescribir — confirmar la reescritura antes de implementar esas rutas.
4. Los contratos de administracion, catalogos y asistencia son `planned`; no se exponen desde el cliente hasta implementar y probar sus rutas.
5. Antes del motor se define concurrencia por seccional, aislamiento de transacciones e idempotencia de reintentos/jobs.

## Decisiones pendientes que no bloquean

- **D-34:** recuperacion de contrasena por email.
- **D-36:** vinculacion de la cuenta Google con el trabajador registrado por UATRE.

Google sera el unico acceso de trabajador cuando se implemente; hasta entonces no se habilita login local de trabajador.
