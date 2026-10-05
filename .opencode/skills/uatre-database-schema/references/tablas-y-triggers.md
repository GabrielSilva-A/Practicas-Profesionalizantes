# Tablas, vistas, triggers y funciones — UATRE

**Uso:** cargar solo cuando `uatre-database-schema` lo indique.
**Fuente primaria:** `BD/bd_uatre.sql` (DDL completo y actualizado).
**Complemento:** `docs/base_datos.md` (documentación del esquema, alineada 2026-10-02).
**Última revisión:** 2026-10-02.

Este archivo resume el esquema físico real. No duplica el DDL; lo organiza para
consulta rápida del agente.

## Advertencia de fuentes

- `BD/bd_uatre.sql` es la fuente del esquema físico (15 tablas, `verificado`, `primera_vez_login`).
- Ante discrepancia con cualquier documento, prevalecer `BD/bd_uatre.sql`.
- `base_datos.md`, `business-rules.md` §33 y `diagrama-ER.md` están alineados
  (C-05/C-06/A-28 subsanados); las migraciones de Prisma añaden `sesiones`.

---

## 1. Las 15 tablas

### 1.1 `seccionales`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| numero | INTEGER UNIQUE | Número de seccional |
| localidad | VARCHAR(100) | |
| provincia | VARCHAR(100) | |
| punto_rotacion | INTEGER DEFAULT 1 | Próximo número de rotación |
| cantidad_numeros | INTEGER DEFAULT 0 | CHECK >= 0 |
| activo | BOOLEAN DEFAULT TRUE | |

### 1.2 `empresas`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| seccional_id | INTEGER FK → seccionales | RESTRICT |
| nombre | VARCHAR(200) | |
| localidad | VARCHAR(100) | |
| provincia | VARCHAR(100) | |
| activa | BOOLEAN DEFAULT TRUE | |

### 1.3 `establecimientos`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| empresa_id | INTEGER FK → empresas | RESTRICT |
| nombre | VARCHAR(200) | UNIQUE(empresa_id, nombre) |
| direccion | VARCHAR(300) | |
| localidad | VARCHAR(100) | |
| provincia | VARCHAR(100) | |
| activo | BOOLEAN DEFAULT TRUE | |

### 1.4 `tareas_empresa`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| empresa_id | INTEGER FK → empresas | RESTRICT |
| nombre | VARCHAR(200) | UNIQUE(empresa_id, nombre) |
| activa | BOOLEAN DEFAULT TRUE | |

### 1.5 `trabajadores`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| seccional_id | INTEGER FK → seccionales | RESTRICT |
| nombre | VARCHAR(100) | |
| apellido | VARCHAR(100) | |
| documento | VARCHAR(20) UNIQUE | Único global |
| telefono | VARCHAR(20) | |
| activo | BOOLEAN DEFAULT TRUE | |
| presente_hoy | BOOLEAN DEFAULT FALSE | Flag |
| presente_ayer | BOOLEAN DEFAULT FALSE | Flag |
| anotado | BOOLEAN DEFAULT FALSE | Flag |

### 1.6 `usuarios`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| email | VARCHAR(200) UNIQUE | Único global |
| password_hash | VARCHAR(255) | bcrypt |
| tipo | VARCHAR(20) | CHECK: SECCIONAL, EMPRESA, TRABAJADOR |
| seccional_id | INTEGER FK | NULL según tipo |
| empresa_id | INTEGER FK | NULL según tipo |
| trabajador_id | INTEGER FK | NULL según tipo |
| activo | BOOLEAN DEFAULT TRUE | |
| primera_vez_login | BOOLEAN DEFAULT FALSE | Aprobado A-06; migración pendiente en BD/bd_uatre.sql |
| fecha_creacion | TIMESTAMP | |

Constraint `chk_coherencia_tipo`: cada tipo exige exactamente una FK no nula.

Índice único parcial `uq_usuario_seccional` en `seccional_id WHERE tipo = 'SECCIONAL'` (RN-149).

### 1.7 `lista_rotacion`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| seccional_id | INTEGER FK | |
| numero | INTEGER | CHECK > 0; UNIQUE(seccional_id, numero) |
| trabajador_id | INTEGER FK | NULL = libre |
| activo | BOOLEAN DEFAULT TRUE | |

Estados: libre (`trabajador_id IS NULL`), ocupado (`NOT NULL`), histórico (`activo = FALSE`).

### 1.8 `asistencia`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| trabajador_id | INTEGER FK | |
| fecha | DATE | UNIQUE(trabajador_id, fecha) |
| presente | BOOLEAN DEFAULT FALSE | |
| verificado | BOOLEAN DEFAULT FALSE | **No aparece en `base_datos.md`** |
| cerrado | BOOLEAN DEFAULT FALSE | |

### 1.9 `atrasos`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| trabajador_id | INTEGER UNIQUE | |
| cantidad | INTEGER DEFAULT 0 | CHECK >= 0 |
| fecha_primer_atraso | TIMESTAMP | Gestionado por trigger |

### 1.10 `sanciones`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| trabajador_id | INTEGER UNIQUE | |
| turnos_pendientes | INTEGER DEFAULT 0 | CHECK >= 0 |
| fecha_inicio | TIMESTAMP | |
| fecha_fin | TIMESTAMP | Trigger al llegar a 0 |

Sin campo de motivo (RN-159).

### 1.11 `inhabilitaciones`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| trabajador_id | INTEGER FK | |
| empresa_id | INTEGER FK | |
| fecha_inhabilitacion | TIMESTAMP | |
| | | UNIQUE(trabajador_id, empresa_id) |

Sin campo de motivo (RN-162). Sin historial (RN-163).

### 1.12 `pedidos`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| empresa_id | INTEGER FK | |
| seccional_id | INTEGER FK | |
| fecha | DATE | |
| horario_inicio | TIME | |
| cant_requerida | INTEGER | CHECK > 0 |
| tarea_id | INTEGER FK → tareas_empresa(id, empresa_id) | |
| establecimiento_id | INTEGER FK → establecimientos(id, empresa_id) | NULL |
| estado | VARCHAR(20) | CHECK: PENDIENTE, EN_PROCESO, CUBIERTO, NO_CUBIERTO, CANCELADO |
| fecha_creacion | TIMESTAMP | |

FKs compuestas: `(tarea_id, empresa_id)` y `(establecimiento_id, empresa_id)` garantizan coherencia con la empresa.

### 1.13 `cola_pedidos`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| pedido_id | INTEGER UNIQUE FK | |
| fecha_encolamiento | TIMESTAMP | |
| fecha_procesamiento_programado | TIMESTAMP | |
| orden | BIGSERIAL UNIQUE | FIFO (RN-067) |
| estado | VARCHAR(20) | CHECK: PENDIENTE, PROCESADO, CANCELADO |

### 1.14 `designaciones`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| pedido_id | INTEGER FK | |
| trabajador_id | INTEGER FK | |
| estado | VARCHAR(20) | CHECK: DESIGNADO, TRABAJANDO, FINALIZADO, CANCELADO |
| horario_inicio | TIMESTAMP | |
| horario_fin | TIMESTAMP | |
| es_excepcional | BOOLEAN DEFAULT FALSE | |
| fecha_designacion | TIMESTAMP | |
| | | UNIQUE(pedido_id, trabajador_id) |

Índice único parcial `uq_designacion_activa_trabajador` en `trabajador_id WHERE estado IN ('DESIGNADO', 'TRABAJANDO')`.

### 1.15 `pedido_historial`

| Columna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| pedido_id | INTEGER FK | |
| empresa_id | INTEGER FK | |
| seccional_id | INTEGER FK | |
| fecha | DATE | |
| horario_inicio | TIME | |
| cantidad_requerida | INTEGER | |
| cantidad_designados | INTEGER DEFAULT 0 | |
| tarea | VARCHAR(200) | Texto del snapshot |
| establecimiento | VARCHAR(200) | Texto del snapshot |
| estado_final | VARCHAR(20) | |
| fecha_creacion | TIMESTAMP | |
| fecha_cierre_jornada | TIMESTAMP | |

---

## 2. Las 7 vistas del motor

| Vista | Propósito | Filtro base |
|---|---|---|
| `v_trabajadores_elegibles` | Base del pizarrón y motor | presente_hoy, presente_ayer, no anotado, activo |
| `v_atrasados_elegibles` | Atrasados con prioridad | atrasos > 0, sanciones = 0 |
| `v_rotacion_disponible` | Rotación ordinaria | sin atrasos, sin sanciones |
| `v_excepcional_etapa1` | Cobertura excepcional etapa 1 | presente_hoy, NOT presente_ayer, sin atrasos, sin sanciones |
| `v_excepcional_etapa2` | Cobertura excepcional etapa 2 | presente_hoy, sanciones > 0 |
| `v_excepcional_etapa3` | Cobertura excepcional etapa 3 | NOT presente_hoy |
| `v_estado_trabajador` | Estado completo para UI | todas las condiciones + designación activa |

Todas las vistas de elegibilidad se limitan a `activo = TRUE` y trabajadores con número activo en `lista_rotacion`.

---

## 3. Los 9 triggers

| # | Trigger | Cuándo | Qué hace |
|---|---|---|---|
| 1 | `trg_sync_presente_flags` | AFTER INSERT OR UPDATE OF cerrado ON asistencia | Al cerrar: `presente_ayer = presente_hoy`, `presente_hoy = NEW.presente` |
| 2 | `trg_crear_atraso_inicial` | AFTER INSERT ON trabajadores | INSERT en `atrasos` con cantidad 0 |
| 3 | `trg_gestionar_fecha_primer_atraso` | BEFORE UPDATE ON atrasos | Setea/resetea `fecha_primer_atraso` al cruzar 0 |
| 4 | `trg_descontar_atraso_al_designar` | AFTER INSERT ON designaciones | `cantidad = GREATEST(cantidad - 1, 0)` |
| 5 | `trg_gestionar_sancion_al_llegar_a_cero` | BEFORE UPDATE ON sanciones | Marca `fecha_fin` al llegar a 0 |
| 6 | `trg_paso_a_trabajando` | BEFORE UPDATE ON designaciones | `horario_fin = horario_inicio + 12h` al pasar a TRABAJANDO |
| 7 | `trg_liberar_designacion` | BEFORE UPDATE ON designaciones | Marca `horario_fin = NOW()` al finalizar |
| 8 | `trg_descuento_atraso_ausencia` | AFTER INSERT OR UPDATE OF cerrado ON asistencia | Descuenta 1 atraso si AUSENTE al cerrar |
| 9 | `trg_decidir_procesamiento_pedido` | AFTER INSERT ON pedidos | Decide cola vs. inmediato (RN-063) |

**Nota:** `trg_reset_presente_hoy` fue eliminado de la documentación (A-28,
2026-10-02) y nunca existió en `BD/bd_uatre.sql`. No implementarlo.

---

## 4. Las 3 funciones del motor

### 4.1 `fn_decidir_procesamiento_pedido()`

Trigger `trg_decidir_procesamiento_pedido`. Implementa RN-063.
- `fecha = HOY` y ya pasó 07:40 → INMEDIATO.
- `fecha = HOY` y horario < 07:40 → INMEDIATO.
- `fecha = HOY` y horario >= 07:40 → COLA.
- `fecha = MAÑANA` y horario < 07:40 → INMEDIATO.
- Otro caso → COLA.

**Advertencia:** no consulta si la asistencia del día está cerrada; tras 07:40 asume INMEDIATO aunque el cierre manual no haya ocurrido. Contradice D-03. Revisar antes de usar.

### 4.2 `fn_ejecutar_motor(p_pedido_id INTEGER)`

Implementa Fase 1 (atrasados) y Fase 2 (rotación ordinaria). Actualmente también ejecuta Fase 3 (cobertura excepcional automática).

**Advertencia crítica:** la Fase 3 automática contradice D-06. Debe refactorizarse para detenerse tras Fase 2. La cobertura excepcional debe ser una función separada invocada por UATRE.

Detalles de la implementación actual que deben preservarse al refactorizar:
- Cálculo de `v_faltan = cant_requerida - designaciones activas`.
- Fase 1 ordenada por `atrasos_pendientes DESC, fecha_primer_atraso ASC`.
- Fase 2 circular desde `seccionales.punto_rotacion` con `v_max_iteraciones = v_total_numeros * 2`.
- Actualización de `punto_rotacion` solo al final de la Fase 2.
- Uso del índice `idx_atrasos_prioridad`.

### 4.3 `fn_procesar_cola_pedidos(p_momento TIMESTAMP)`

Procesa `cola_pedidos` con `estado = 'PENDIENTE'` y `fecha_procesamiento_programado <= p_momento`, en orden `fecha_procesamiento_programado, orden`, con `FOR UPDATE SKIP LOCKED`. Para cada pedido: `UPDATE pedidos SET estado = 'EN_PROCESO'` y `PERFORM fn_ejecutar_motor`. Luego marca la cola como PROCESADO.

---

## 5. Índices críticos

| Índice | Filtro | Uso |
|---|---|---|
| `idx_trab_elegibles` | presente_hoy, presente_ayer, NOT anotado, activo | Motor y pizarrón |
| `idx_trab_excepcional_etapa1` | presente_hoy, NOT presente_ayer, activo | Etapa 1 |
| `idx_trab_excepcional_etapa2` | presente_hoy, activo | Etapa 2 |
| `idx_trab_excepcional_etapa3` | NOT presente_hoy, activo | Etapa 3 |
| `idx_atrasos_prioridad` | cantidad > 0, orden DESC por cantidad, ASC por fecha | Orden del motor |
| `idx_designaciones_activas` | estado IN (DESIGNADO, TRABAJANDO) | Verificación de ocupación |
| `idx_cola_pendientes` | estado = PENDIENTE | Procesamiento FIFO |
| `idx_usuarios_email` | activo = TRUE | Login |

Regla: las consultas al motor deben usar los mismos filtros que los índices parciales para que PostgreSQL los aproveche.

---

## 6. Pendientes

| Cambio | Decisión | Estado |
|---|---|---|
| Refactor de `fn_ejecutar_motor` (fin tras Fase 2) | D-06 | Pendiente |
| `fn_decidir_procesamiento_pedido` no verifica cierre real de asistencia | D-03 | Pendiente (ya señalizado en `base_datos.md`) |
| Señalización D-09/D-15/D-27 en `requirements.md` y UC | D-09, D-15, D-27 | Señalizados; reescritura pendiente de confirmación |

---

## 7. Reglas al escribir SQL o Prisma

1. No agregar columnas sin actualizar `BD/bd_uatre.sql` y `base_datos.md`.
2. Usar las vistas existentes antes de escribir consultas complejas.
3. Confiar en los triggers para sincronización de flags y estados; no duplicar en JS.
4. No duplicar la lógica del motor en el backend (RN-167).
5. Usar índices parciales en las consultas del motor.
6. Validar con los CHECK existentes antes de insertar.
7. Documentar cualquier cambio estructural en ambos documentos.
8. Ante discrepancia entre `BD/bd_uatre.sql` y `base_datos.md`, prevalecer el SQL y registrar la corrección.