# Contradicciones documentales conocidas — UATRE

**Uso:** cargar solo cuando `uatre-consolidation` lo indique.
**Fuente primaria:** `docs/decisiones-pendientes.md` sección "Correcciones documentales y de diseño".
**Última revisión:** 2026-10-02.

Este archivo registra las contradicciones activas entre documentos del proyecto.
No reemplaza `decisiones-pendientes.md`; lo resume para consulta rápida del agente.

## Cómo usar este archivo

1. Identificar el ID de la contradicción que afecta la tarea.
2. Leer la fila completa: documentos afectados, tratamiento y estado.
3. Si la contradicción sigue **ABIERTA**, no implementar hasta resolverla.
4. Si está **CONSOLIDADA**, aplicar el tratamiento indicado.
5. Si una contradicción nueva no figura aquí, registrarla en `decisiones-pendientes.md`
   antes de avanzar.

## Estados

| Estado | Significado |
|---|---|
| ABIERTA | Documentos siguen contradictorios; no implementar. |
| EN CONSOLIDACIÓN | Tratamiento acordado, propagación pendiente. |
| CONSOLIDADA | Todos los documentos alineados; se puede implementar. |

---

## Contradicciones activas

### C-01 — Socios vs. changas y FIFO de atrasados

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA en reglas; revisar diagramas al diseñar motor |
| Documentos afectados | `PROJECT_GUIDE.md`, `project-roadmap.md`, `diagrama-motor.md` |
| Reglas vigentes | RN-005 (única categoría SOCIO), RN-054 (una lista de socios), RN-103/104 (orden por cantidad DESC y fecha ASC) |
| Tratamiento | Donde diga "changa" como categoría operativa, reemplazar por "socio". Donde diga "FIFO de atrasados", reemplazar por orden cantidad DESC, fecha ASC. FIFO aplica solo a `cola_pedidos.orden` (RN-067). |
| Pendiente | Revisar diagramas de motor al consolidar Fase 7. |

### C-02 — `architecture.md` citado sin existir

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA |
| Documentos afectados | `PROJECT_GUIDE.md`, `project-roadmap.md` |
| Tratamiento | Se creó `docs/architecture.md` con arquitectura mínima. Fase 7 pasó a EN CONSOLIDACIÓN. El cierre previo no se presume comprobado. |
| Pendiente | Completar pendientes de sesiones, concurrencia, jobs y despliegue antes de cerrar Fase 7. |

### C-03 — Triggers temporales vs. jobs

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA en RN-167 |
| Documentos afectados | `REQ-SISTEMA-001`, `REQ-SISTEMA-002`, `UC-TRABAJADOR-004` |
| Regla vigente | RN-167: PostgreSQL no ejecuta triggers por paso del tiempo. El motor se invoca desde servicio o worker. |
| Tratamiento | Los cambios DESIGNADO → TRABAJANDO y liberación a las 12 h se ejecutan por job o manualmente desde UATRE. |
| Pendiente | Seleccionar biblioteca de jobs y diseñar recuperación tras reinicio. |

### C-04 — `diagrama-motor.md` incompleto

| Campo | Detalle |
|---|---|
| Estado | ABIERTA |
| Documentos afectados | `docs/diagrama-motor.md` |
| Contradicción | El diagrama omite el efecto de ANOTADO y sanciones en algunos filtros; su matriz de condiciones no refleja RN-034 (ANOTADO al llegar la rotación), RN-041 (descuento de sanción) ni RN-045 (ATRASADO + sanción). |
| Tratamiento | Contrastar con `business-rules.md` secciones 10, 12, 22, 23 y con `BD/bd_uatre.sql` antes de implementar el motor. |
| Acción requerida | Reescribir la matriz de condiciones del diagrama para alinear con las reglas vigentes. |

### C-05 — `business-rules.md` sección 33 desactualizada

| Campo | Detalle |
|---|---|
| Estado | SUBSANADA (2026-10-02) |
| Documentos afectados | `docs/business-rules.md` sección 33 |
| Contradicción | La sección 33 mostraba 13 tablas y campos de texto (`tarea VARCHAR`, `establecimiento VARCHAR`) en `PEDIDOS`. |
| Resolución | §33.1 lista las 15 tablas; §33.2 usa `tarea_id`/`establecimiento_id` FK, `primera_vez_login` y `verificado`. Fuente del esquema físico: `BD/bd_uatre.sql`. |

### C-06 — `primera_vez_login` ausente de SQL

| Campo | Detalle |
|---|---|
| Estado | SUBSANADA (2026-10-02) |
| Documentos afectados | `base_datos.md`, `business-rules.md` §33, `BD/bd_uatre.sql` |
| Decisión aprobada | A-06: agregar `usuarios.primera_vez_login BOOLEAN NOT NULL DEFAULT FALSE`. A-23: extenderlo a cuentas EMPRESA creadas manualmente. |
| Resolución | La columna existe en `BD/bd_uatre.sql` y `schema.prisma` (migración `20261001204500`) y ya está documentada en `base_datos.md` (USUARIOS) y `business-rules.md` §33. |

### D-06 — Cobertura excepcional automática en SQL

| Campo | Detalle |
|---|---|
| Estado | ABIERTA — bloqueador crítico |
| Documentos afectados | `BD/bd_uatre.sql` (`fn_ejecutar_motor`), `diagrama-motor.md`, `base_datos.md` |
| Decisión aprobada | D-06: la cobertura excepcional es manual; UATRE la autoriza. El motor automático debe detenerse tras la rotación ordinaria. |
| Contradicción | `fn_ejecutar_motor` ejecuta las 3 etapas excepcionales automáticamente e incluso inserta sanciones. |
| Riesgo | Designar sancionados o ausentes sin intervención humana; aplicar sanciones no autorizadas. |
| Acción requerida | Refactorizar `fn_ejecutar_motor` para que solo ejecute Fase 1 y Fase 2. La Fase 3 debe ser una función separada invocada por UATRE. |
| Documentos a actualizar | `BD/bd_uatre.sql` y el código del motor (pendientes). Avisos ya agregados en `base_datos.md`, `diagrama-motor.md`, `diagrama-asistencia.md` y `requirements.md` (REQ-UATRE-004). |

### D-09 vs. REQ-SISTEMA-003 — Pedidos no cubiertos

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA; docs **señalizados** (2026-10-02), reescritura pendiente de confirmación |
| Documentos afectados | `requirements.md` (REQ-SISTEMA-003), `uc-trabajador.md` (UC-002), `uc-uatre.md` (UC-008) |
| Decisión aprobada | D-09: los puestos de un pedido vencido se cierran como `NO_CUBIERTO` y no se designan después. Los pedidos no vencidos conservan la transferencia de RN-119. |
| Contradicción | REQ-SISTEMA-003 dice que los pedidos sin cubrir se transfieren al nuevo día. |
| Señalización aplicada | Aviso ⚠️ D-09 agregado en `requirements.md`, `uc-trabajador.md` y `uc-uatre.md`. Reescribir solo con confirmación explícita. |

### D-15 vs. REQ-SISTEMA-005 — Pizarrón dinámico vs. congelado

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA; docs **señalizados** (2026-10-02), reescritura pendiente de confirmación |
| Documentos afectados | `requirements.md` (REQ-SISTEMA-005), `uc-trabajador.md` (UC-002), `uc-uatre.md` (UC-008) |
| Decisión aprobada | D-15: el pizarrón muestra disponibilidad dinámica y refleja designaciones y LIBERAR posteriores al cierre de asistencia. |
| Contradicción | REQ-SISTEMA-005 dice que el pizarrón se congela después de las 07:40; UC-002 dice que las consultas quedan estáticas. |
| Señalización aplicada | Aviso ⚠️ D-15 agregado en `requirements.md` y `uc-trabajador.md`. Reescribir solo con confirmación explícita. |

### D-27 vs. REQ-EMPRESA-004 — Estados visibles

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA; docs **señalizados** (2026-10-02), reescritura pendiente de confirmación |
| Documentos afectados | `requirements.md` (REQ-EMPRESA-004), `uc-empresa.md` |
| Decisión aprobada | D-27 y RN-075: la empresa ve Pendiente, En proceso, Completo, Sin cobertura y Cancelado. |
| Contradicción | REQ-EMPRESA-004 menciona `COMPLETADO`, que no es un estado persistido. |
| Señalización aplicada | Aviso ⚠️ D-27 agregado en `requirements.md` y `uc-empresa.md`. Reescribir solo con confirmación explícita. |

### D-33 vs. UC-001 y api-design — Login de trabajador

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA y propagada (2026-10-02) |
| Documentos afectados | `uc-trabajador.md` (UC-001), `api-design.md`, `PROJECT_GUIDE.md` |
| Decisión aprobada | D-33: el acceso de trabajador usa exclusivamente email como identificador. D-35: Google será el único acceso de trabajadores; hasta entonces no se habilita login local. |
| Resolución | UC-001, `api-design.md` y `PROJECT_GUIDE.md` actualizados: email exclusivo, sin login local de trabajador, sin auditoría de login (D-30). |

### A-28 vs. `trg_reset_presente_hoy`

| Campo | Detalle |
|---|---|
| Estado | CONSOLIDADA (2026-10-02: documentación alineada) |
| Documentos afectados | `base_datos.md`, `diagrama-asistencia.md`, `BD/bd_uatre.sql` |
| Decisión aprobada | A-28: los flags `presente_hoy` / `presente_ayer` no se resetean al abrir asistencia; se sincronizan solo al cierre. |
| Contradicción | `base_datos.md` y `diagrama-asistencia.md` describían un trigger que resetea `presente_hoy = FALSE` al crear asistencia. |
| Resolución | Trigger eliminado de `base_datos.md`, `diagrama-asistencia.md` y `business-rules.md` sección 33.4. No existe en `BD/bd_uatre.sql` ni en las migraciones vigentes. |

### `asistencia.verificado` — Documentación inconsistente

| Campo | Detalle |
|---|---|
| Estado | SUBSANADA (2026-10-02) |
| Documentos afectados | `base_datos.md`, `BD/bd_uatre.sql`, `openapi.yaml` |
| Resolución | `base_datos.md` documenta `verificado BOOLEAN NOT NULL DEFAULT FALSE` con su ciclo; `diagrama-asistencia.md` valida `verificado = TRUE` (D-01/A-28). |

---

## Orden de resolución recomendado

1. **D-06** (cobertura excepcional automática) — bloqueador crítico del motor. *Pendiente.*
2. ~~**A-28** (`trg_reset_presente_hoy`)~~ — resuelto (2026-10-02).
3. ~~**`asistencia.verificado`**~~ — subsanado (2026-10-02).
4. ~~**D-33 / D-35** (login de trabajador)~~ — consolidado y propagado (2026-10-02).
5. **D-09 / D-15 / D-27** — señalizados; reescritura pendiente de confirmación.
6. ~~**C-05** (sección 33 de `business-rules.md`)~~ — subsanado (2026-10-02).
7. ~~**C-06** (`primera_vez_login`)~~ — subsanado (2026-10-02).
8. **C-04** (matriz del motor) — documentación del motor. *Pendiente.*

---

## Regla final

Si una tarea toca un área con contradicción **ABIERTA**, el agente debe:

1. Detenerse.
2. Señalar la contradicción con su ID.
3. Proponer el tratamiento alineado con la decisión aprobada.
4. Esperar confirmación antes de implementar.