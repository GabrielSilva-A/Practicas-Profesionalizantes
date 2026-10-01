# Base de Datos: Sistema de Gestión de Personal Eventual UATRE

## 📌 Propósito del documento

Este documento describe la estructura completa de la base de datos PostgreSQL del sistema de gestión de personal eventual para UATRE. Su objetivo es servir como contexto para GitHub Copilot y para cualquier desarrollador que trabaje en el backend.

Toda consulta, función, trigger o vista que se cree debe respetar la estructura y las reglas descritas en este documento.

---

## 🎯 Visión general del sistema

El sistema permite:

1. **Gestionar seccionales** de UATRE con su propia lista de rotación de socios.
2. **Registrar empresas** afiliadas a una seccional que solicitan personal eventual.
3. **Registrar trabajadores (socios)** con un número fijo en la lista de rotación.
4. **Tomar asistencia diaria** y mantener flags sincronizados.
5. **Recibir pedidos** de las empresas y decidir si procesarlos inmediatamente o enviarlos a cola.
6. **Designar automáticamente** trabajadores usando un motor de asignación con prioridades.
7. **Aplicar sanciones, inhabilitaciones y atrasos** como condiciones del sistema.
8. **Mantener historial** de pedidos al cierre de jornada.

---

## 🗄️ Estructura de la base de datos

### 15 tablas

| Tabla | Propósito |
|-------|-----------|
| `SECCIONALES` | Sedes de UATRE |
| `EMPRESAS` | Empresas afiliadas a una seccional |
| `ESTABLECIMIENTOS` | Direcciones o lugares de trabajo administrados por una empresa |
| `TAREAS_EMPRESA` | Tipos de trabajo configurados por empresa |
| `TRABAJADORES` | Socios con flags de asistencia y anotado |
| `USUARIOS` | Usuarios centralizados (seccional, empresa, trabajador) |
| `LISTA_ROTACION` | Números fijos por seccional |
| `ASISTENCIA` | Historial diario de asistencia |
| `ATRASOS` | Cantidad de turnos atrasados por trabajador |
| `SANCIONES` | Turnos de sanción pendientes |
| `INHABILITACIONES` | Excepciones de habilitación (trabajador ↔ empresa) |
| `PEDIDOS` | Solicitudes de personal creadas por empresas |
| `COLA_PEDIDOS` | Pedidos que esperan la próxima actualización |
| `DESIGNACIONES` | Asignación de trabajadores a pedidos |
| `PEDIDO_HISTORIAL` | Foto del pedido al cierre de jornada |

### 7 vistas del motor

| Vista | Propósito |
|-------|-----------|
| `v_trabajadores_elegibles` | Base: presentes hoy + ayer, no anotados |
| `v_atrasados_elegibles` | Atrasados con prioridad |
| `v_rotacion_disponible` | Trabajadores para rotación ordinaria |
| `v_excepcional_etapa1` | Presentes hoy, ausentes ayer, sin condiciones |
| `v_excepcional_etapa2` | Sancionados presentes hoy |
| `v_excepcional_etapa3` | Ausentes hoy |
| `v_estado_trabajador` | Estado completo para UI |

### 9 triggers

| Trigger | Cuándo se dispara | Qué hace |
|---------|-------------------|----------|
| `trg_sync_presente_flags` | Al cerrar asistencia | Copia `presente_hoy` → `presente_ayer` y actualiza `presente_hoy` |
| `trg_reset_presente_hoy` | Al crear asistencia | Resetea `presente_hoy = FALSE` |
| `trg_crear_atraso_inicial` | Al insertar trabajador | Crea registro en `atrasos` con cantidad 0 |
| `trg_gestionar_fecha_primer_atraso` | Al actualizar atrasos | Setea/resetea `fecha_primer_atraso` |
| `trg_descontar_atraso_al_designar` | Al insertar designación | Descuenta 1 atraso si tenía |
| `trg_gestionar_sancion_al_llegar_a_cero` | Al actualizar sanciones | Marca `fecha_fin` cuando llega a 0 |
| `trg_paso_a_trabajando` | Al cambiar a TRABAJANDO | Calcula `horario_fin = horario_inicio + 12h` |
| `trg_liberar_designacion` | Al cambiar a FINALIZADO | Marca `horario_fin = NOW()` |
| `trg_descuento_atraso_ausencia` | Al cerrar asistencia | Descuenta 1 atraso si AUSENTE + atrasos > 0 |

### 3 funciones del motor

| Función | Propósito |
|---------|-----------|
| `fn_decidir_procesamiento_pedido()` | Trigger: decide cola vs inmediato |
| `fn_ejecutar_motor(pedido_id)` | Ejecuta la designación automática completa |
| `fn_procesar_cola_pedidos(momento)` | Procesa pedidos pendientes en orden FIFO al alcanzar su momento programado |

### 38 índices optimizados

Los índices están diseñados para las consultas más frecuentes del motor. Se priorizan **índices parciales** (con `WHERE`) para reducir tamaño y acelerar búsquedas.

---

## 📋 Detalle de cada tabla

### 1. `SECCIONALES`

Representa cada sede de UATRE. Cada seccional tiene su propio usuario, su propia lista de rotación y administra sus empresas y trabajadores.

```sql
CREATE TABLE seccionales (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    localidad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    punto_rotacion INTEGER NOT NULL DEFAULT 1,
    cantidad_numeros INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);
```

**Campos clave:**
- `punto_rotacion`: próximo número desde donde arranca el motor.
- `cantidad_numeros`: cantidad de números que tiene la lista.

---

### 2. `EMPRESAS`

Empresas afiliadas a una seccional. Cada empresa tiene su propio usuario para crear pedidos y consultar el pizarrón.

```sql
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    seccional_id INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);
```

**Relación:** `EMPRESAS.seccional_id → SECCIONALES.id` (RESTRICT).

---

### 2.1 `ESTABLECIMIENTOS`

Lugares de trabajo administrados por una empresa. Un pedido puede referenciar uno de sus establecimientos.

```sql
CREATE TABLE establecimientos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(300) NOT NULL,
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_establecimiento_empresa_nombre UNIQUE (empresa_id, nombre)
);
```

---

### 2.2 `TAREAS_EMPRESA`

Tipos de trabajo configurados por empresa por el personal autorizado de UATRE.

```sql
CREATE TABLE tareas_empresa (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tarea_empresa_nombre UNIQUE (empresa_id, nombre)
);
```

---

### 3. `TRABAJADORES`

Socios que participan de la lista de rotación. Incluye flags de asistencia y anotado para consultas rápidas del motor.

```sql
CREATE TABLE trabajadores (
    id SERIAL PRIMARY KEY,
    seccional_id INTEGER NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    documento VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    presente_hoy BOOLEAN NOT NULL DEFAULT FALSE,
    presente_ayer BOOLEAN NOT NULL DEFAULT FALSE,
    anotado BOOLEAN NOT NULL DEFAULT FALSE
);
```

**Campos clave:**
- `presente_hoy` / `presente_ayer`: flags sincronizados por trigger al cerrar asistencia.
- `anotado`: flag cambiado manualmente (por el trabajador o UATRE).
- `documento`: único global.

---

### 4. `USUARIOS`

Tabla centralizada de usuarios. Un solo login para todos los actores. El campo `tipo` determina el rol y la FK correspondiente.

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    seccional_id INTEGER,
    empresa_id INTEGER,
    trabajador_id INTEGER,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tipo_usuario CHECK (tipo IN ('SECCIONAL', 'EMPRESA', 'TRABAJADOR')),
    CONSTRAINT chk_coherencia_tipo CHECK (
        (tipo = 'SECCIONAL' AND seccional_id IS NOT NULL AND empresa_id IS NULL AND trabajador_id IS NULL) OR
        (tipo = 'EMPRESA'   AND empresa_id IS NOT NULL   AND seccional_id IS NULL AND trabajador_id IS NULL) OR
        (tipo = 'TRABAJADOR' AND trabajador_id IS NOT NULL AND seccional_id IS NULL AND empresa_id IS NULL)
    )
);
```

**Reglas:**
- `tipo = 'SECCIONAL'` → solo `seccional_id` tiene valor.
- `tipo = 'EMPRESA'` → solo `empresa_id` tiene valor.
- `tipo = 'TRABAJADOR'` → solo `trabajador_id` tiene valor.
- El CHECK garantiza coherencia.

**Cardinalidad:** RN-149 exige un único usuario por seccional, garantizado mediante un índice único parcial. Las cuentas de empresa y trabajador conservan la extensibilidad prevista por RN-150.

---

### 5. `LISTA_ROTACION`

Números fijos por seccional. El `trabajador_id` puede ser NULL (número libre).

```sql
CREATE TABLE lista_rotacion (
    id SERIAL PRIMARY KEY,
    seccional_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    trabajador_id INTEGER,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_lista_numero UNIQUE (seccional_id, numero)
);
```

**Estados de un número:**
- **Libre:** `trabajador_id IS NULL AND activo = TRUE`.
- **Ocupado:** `trabajador_id IS NOT NULL AND activo = TRUE`.
- **Histórico:** `activo = FALSE`.

---

### 6. `ASISTENCIA`

Historial diario de asistencia. Los flags en `TRABAJADORES` se sincronizan automáticamente al cerrar la asistencia.

```sql
CREATE TABLE asistencia (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    cerrado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_asistencia_trabajador_fecha UNIQUE (trabajador_id, fecha)
);
```

**Ciclo:**
1. Se crea el registro del día (`cerrado = FALSE`) → trigger 2 resetea `presente_hoy`.
2. UATRE marca PRESENTE/AUSENTE.
3. UATRE cierra la asistencia (`cerrado = TRUE`) → trigger 1 sincroniza flags.

---

### 7. `ATRASOS`

Cantidad de turnos atrasados por trabajador. Un solo registro por trabajador.

```sql
CREATE TABLE atrasos (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL UNIQUE,
    cantidad INTEGER NOT NULL DEFAULT 0,
    fecha_primer_atraso TIMESTAMP
);
```

**Reglas:**
- `fecha_primer_atraso` se setea al primer atraso y se resetea cuando `cantidad = 0`.
- Se usa para desempatar atrasados con la misma cantidad.
- Se descuenta 1 al designar (trigger 5).

---

### 8. `SANCIONES`

Turnos de sanción pendientes por trabajador.

```sql
CREATE TABLE sanciones (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL UNIQUE,
    turnos_pendientes INTEGER NOT NULL DEFAULT 0,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP
);
```

**Reglas:**
- Se acumulan (las nuevas sanciones suman).
- Se descuentan al evaluar (motor).
- Se cierran cuando `turnos_pendientes = 0` (trigger 6).

---

### 9. `INHABILITACIONES`

Excepciones de habilitación: por defecto, todos los trabajadores están habilitados para todas las empresas. Solo se registran las inhabilitaciones.

```sql
CREATE TABLE inhabilitaciones (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    fecha_inhabilitacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inhabilitacion UNIQUE (trabajador_id, empresa_id)
);
```

**Consulta en el motor:**
```sql
-- Un trabajador está habilitado si NO existe inhabilitación
SELECT NOT EXISTS (
    SELECT 1 FROM inhabilitaciones 
    WHERE trabajador_id = X AND empresa_id = Y
) AS habilitado;
```

---

### 10. `PEDIDOS`

Solicitudes de personal creadas por las empresas.

```sql
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    seccional_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    cant_requerida INTEGER NOT NULL CHECK (cant_requerida > 0),
    tarea_id INTEGER NOT NULL,
    establecimiento_id INTEGER,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estado_pedido CHECK (
        estado IN ('PENDIENTE', 'EN_PROCESO', 'CUBIERTO', 'NO_CUBIERTO', 'CANCELADO')
    )
);
```

**Estados:**
- `PENDIENTE`: recién creado.
- `EN_PROCESO`: el motor está designando.
- `CUBIERTO`: se cubrieron todos los puestos.
- `NO_CUBIERTO`: no se pudo cubrir.
- `CANCELADO`: cancelado antes del inicio.
- La empresa visualiza `CUBIERTO` como “Completo”; `COMPLETO` no es un estado persistido.

---

### 11. `COLA_PEDIDOS`

Pedidos que esperan la próxima actualización de estados (cierre de asistencia).

```sql
CREATE TABLE cola_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL UNIQUE,
    fecha_encolamiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento_programado TIMESTAMP NOT NULL,
    orden BIGSERIAL NOT NULL UNIQUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT chk_estado_cola CHECK (
        estado IN ('PENDIENTE', 'PROCESADO', 'CANCELADO')
    )
);
```

**Reglas:**
- `orden` es FIFO (RN-067).
- Se procesa al cerrar asistencia.

---

### 12. `DESIGNACIONES`

Asignación de trabajadores a pedidos. Un trabajador no puede tener 2 designaciones activas simultáneas.

```sql
CREATE TABLE designaciones (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    trabajador_id INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'DESIGNADO',
    horario_inicio TIMESTAMP NOT NULL,
    horario_fin TIMESTAMP,
    es_excepcional BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_designacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_designacion UNIQUE (pedido_id, trabajador_id),
    CONSTRAINT chk_estado_designacion CHECK (
        estado IN ('DESIGNADO', 'TRABAJANDO', 'FINALIZADO', 'CANCELADO')
    )
);
```

**Índice parcial:**
```sql
CREATE UNIQUE INDEX uq_designacion_activa_trabajador
    ON designaciones (trabajador_id)
    WHERE estado IN ('DESIGNADO', 'TRABAJANDO');
```

**Regla:** un trabajador no puede estar en 2 designaciones activas simultáneas.

---

### 13. `PEDIDO_HISTORIAL`

Foto del pedido al cierre de jornada. Se llena automáticamente.

`tarea` y `establecimiento` se conservan como texto en esta tabla exclusivamente para preservar el snapshot histórico, aunque el pedido vigente los relacione mediante `tarea_id` y `establecimiento_id`.

```sql
CREATE TABLE pedido_historial (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    seccional_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    cantidad_requerida INTEGER NOT NULL,
    cantidad_designados INTEGER NOT NULL DEFAULT 0,
    tarea VARCHAR(200),
    establecimiento VARCHAR(200),
    estado_final VARCHAR(20) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL,
    fecha_cierre_jornada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔗 Relaciones entre tablas

```
SECCIONALES (1) ─── (N) EMPRESAS
SECCIONALES (1) ─── (N) TRABAJADORES
SECCIONALES (1) ─── (N) LISTA_ROTACION
SECCIONALES (1) ─── (N) PEDIDOS
SECCIONALES (1) ─── (1) USUARIOS (tipo=SECCIONAL)

EMPRESAS (1) ─── (N) USUARIOS (tipo=EMPRESA)
EMPRESAS (1) ─── (N) ESTABLECIMIENTOS
EMPRESAS (1) ─── (N) TAREAS_EMPRESA
EMPRESAS (1) ─── (N) PEDIDOS
EMPRESAS (1) ─── (N) INHABILITACIONES

TRABAJADORES (1) ─── (1) USUARIOS (tipo=TRABAJADOR)
TRABAJADORES (1) ─── (N) ASISTENCIA
TRABAJADORES (1) ─── (1) ATRASOS
TRABAJADORES (1) ─── (1) SANCIONES
TRABAJADORES (1) ─── (N) INHABILITACIONES
TRABAJADORES (1) ─── (1) LISTA_ROTACION
TRABAJADORES (1) ─── (N) DESIGNACIONES

PEDIDOS (1) ─── (N) DESIGNACIONES
PEDIDOS (1) ─── (0..1) COLA_PEDIDOS
PEDIDOS (1) ─── (N) PEDIDO_HISTORIAL
TAREAS_EMPRESA (1) ─── (N) PEDIDOS
ESTABLECIMIENTOS (1) ─── (0..N) PEDIDOS
```

---

## ⚙️ Triggers detallados

### Trigger 1: `trg_sync_presente_flags`

**Cuándo:** al cerrar asistencia (`cerrado = TRUE`).

**Qué hace:**
1. Copia `presente_hoy` → `presente_ayer`.
2. Actualiza `presente_hoy` con `NEW.presente`.

```sql
CREATE OR REPLACE FUNCTION fn_sync_presente_flags()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cerrado = TRUE AND (OLD.cerrado IS NULL OR OLD.cerrado = FALSE) THEN
        UPDATE trabajadores
        SET presente_ayer = presente_hoy,
            presente_hoy = NEW.presente
        WHERE id = NEW.trabajador_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_presente_flags
AFTER INSERT OR UPDATE OF cerrado ON asistencia
FOR EACH ROW
EXECUTE FUNCTION fn_sync_presente_flags();
```

---

### Trigger 2: `trg_reset_presente_hoy`

**Cuándo:** al crear asistencia nueva.

**Qué hace:** resetea `presente_hoy = FALSE`.

```sql
CREATE OR REPLACE FUNCTION fn_reset_presente_hoy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trabajadores SET presente_hoy = FALSE WHERE id = NEW.trabajador_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reset_presente_hoy
BEFORE INSERT ON asistencia
FOR EACH ROW
EXECUTE FUNCTION fn_reset_presente_hoy();
```

---

### Trigger 3: `trg_crear_atraso_inicial`

**Cuándo:** al insertar un trabajador.

**Qué hace:** crea registro en `atrasos` con cantidad 0.

```sql
CREATE OR REPLACE FUNCTION fn_crear_atraso_inicial()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO atrasos (trabajador_id, cantidad)
    VALUES (NEW.id, 0)
    ON CONFLICT (trabajador_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crear_atraso_inicial
AFTER INSERT ON trabajadores
FOR EACH ROW
EXECUTE FUNCTION fn_crear_atraso_inicial();
```

---

### Trigger 4: `trg_gestionar_fecha_primer_atraso`

**Cuándo:** al actualizar `atrasos.cantidad`.

**Qué hace:**
- Si cantidad pasa de 0 a >0 → setea `fecha_primer_atraso`.
- Si cantidad vuelve a 0 → resetea `fecha_primer_atraso = NULL`.

```sql
CREATE OR REPLACE FUNCTION fn_gestionar_fecha_primer_atraso()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cantidad > 0 AND (OLD.cantidad IS NULL OR OLD.cantidad = 0) THEN
        NEW.fecha_primer_atraso = CURRENT_TIMESTAMP;
    END IF;
    IF NEW.cantidad = 0 AND (OLD.cantidad IS NULL OR OLD.cantidad > 0) THEN
        NEW.fecha_primer_atraso = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gestionar_fecha_primer_atraso
BEFORE UPDATE ON atrasos
FOR EACH ROW
EXECUTE FUNCTION fn_gestionar_fecha_primer_atraso();
```

---

### Trigger 5: `trg_descontar_atraso_al_designar`

**Cuándo:** al insertar una designación.

**Qué hace:** descuenta 1 atraso si el trabajador tenía.

```sql
CREATE OR REPLACE FUNCTION fn_descontar_atraso_al_designar()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE atrasos
    SET cantidad = GREATEST(cantidad - 1, 0)
    WHERE trabajador_id = NEW.trabajador_id AND cantidad > 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_descontar_atraso_al_designar
AFTER INSERT ON designaciones
FOR EACH ROW
EXECUTE FUNCTION fn_descontar_atraso_al_designar();
```

---

### Trigger 6: `trg_gestionar_sancion_al_llegar_a_cero`

**Cuándo:** al actualizar sanciones.

**Qué hace:** marca `fecha_fin` cuando `turnos_pendientes = 0`.

```sql
CREATE OR REPLACE FUNCTION fn_gestionar_sancion_al_llegar_a_cero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.turnos_pendientes = 0 AND (OLD.turnos_pendientes IS NULL OR OLD.turnos_pendientes > 0) THEN
        NEW.fecha_fin = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gestionar_sancion_al_llegar_a_cero
BEFORE UPDATE ON sanciones
FOR EACH ROW
EXECUTE FUNCTION fn_gestionar_sancion_al_llegar_a_cero();
```

---

### Trigger 7: `trg_paso_a_trabajando`

**Cuándo:** al cambiar `designaciones.estado` a `TRABAJANDO`.

**Qué hace:** calcula `horario_fin = horario_inicio + 12h`.

```sql
CREATE OR REPLACE FUNCTION fn_paso_a_trabajando()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'TRABAJANDO' AND OLD.estado = 'DESIGNADO' THEN
        NEW.horario_fin = NEW.horario_inicio + INTERVAL '12 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_paso_a_trabajando
BEFORE UPDATE ON designaciones
FOR EACH ROW
EXECUTE FUNCTION fn_paso_a_trabajando();
```

---

### Trigger 8: `trg_liberar_designacion`

**Cuándo:** al cambiar `designaciones.estado` a `FINALIZADO`.

**Qué hace:** marca `horario_fin = NOW()` si no estaba seteado.

```sql
CREATE OR REPLACE FUNCTION fn_liberar_designacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'FINALIZADO' AND OLD.estado = 'TRABAJANDO' THEN
        NEW.horario_fin = COALESCE(NEW.horario_fin, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_liberar_designacion
BEFORE UPDATE ON designaciones
FOR EACH ROW
EXECUTE FUNCTION fn_liberar_designacion();
```

---

## 🎯 Funciones del motor

### `fn_decidir_procesamiento_pedido()`

**Propósito:** trigger que decide si un pedido va a cola o se procesa inmediatamente.

**Lógica (RN-063, RN-064, RN-065):**

1. Si `fecha_pedido = HOY`:
   - Si ya pasó 07:40 → procesar inmediato.
   - Si horario < 07:40 → procesar inmediato.
   - Si horario >= 07:40 → enviar a cola.
2. Si `fecha_pedido = MAÑANA` y `horario < 07:40` → procesar inmediato: el ingreso es anterior a la próxima actualización de su jornada.
3. Para cualquier otro `fecha_pedido > HOY` → enviar a cola.

**Acción:**
- **Cola:** insert en `cola_pedidos`.
- **Inmediato:** estado = `EN_PROCESO`.

---

### `fn_ejecutar_motor(pedido_id)`

**Propósito:** ejecutar la designación automática de trabajadores.

**Fases:**

1. **Atrasados:** consulta `v_atrasados_elegibles`, excluye inhabilitados y ya designados, ordena por cantidad DESC y fecha ASC.
2. **Rotación ordinaria:** recorre la lista desde `punto_rotacion`, evaluando cada número.
3. **Cobertura excepcional:**
   - Etapa 1: presentes hoy, ausentes ayer.
   - Etapa 2: sancionados presentes hoy (sin descontar sanción).
   - Etapa 3: ausentes hoy (agrega 1 sanción).
4. **Cierre:** actualiza el pedido a `CUBIERTO` o `NO_CUBIERTO`.

**Uso:**
```sql
SELECT fn_ejecutar_motor(1);
```

---

## 📊 Vistas del motor

### `v_trabajadores_elegibles` (vista base)

Presentes hoy + ayer + no anotados + activos. Incluye `numero_lista`, `atrasos_pendientes`, `sanciones_pendientes`.

**Uso principal:** Genera la lista de SOCIOS DISPONIBLES HOY que se muestra en el pizarrón seccional. Se muestra la lista COMPLETA de números disponibles (no solo cantidad).

---

### `v_atrasados_elegibles`

Filtra los elegibles con `atrasos_pendientes > 0` y sin sanciones.

**Uso en el motor:**
```sql
SELECT * FROM v_atrasados_elegibles 
WHERE seccional_id = X
ORDER BY atrasos_pendientes DESC, fecha_primer_atraso ASC;
```

---

### `v_rotacion_disponible`

Filtra los elegibles sin atrasos ni sanciones.

**Uso:**
```sql
SELECT * FROM v_rotacion_disponible 
WHERE seccional_id = X
ORDER BY numero_lista ASC;
```

---

### `v_excepcional_etapa1`

Presentes hoy, ausentes ayer, sin sanciones ni atrasos.

**Uso:** primera ampliación manual de UATRE.

---

### `v_excepcional_etapa2`

Sancionados presentes hoy.

**Uso:** segunda ampliación manual. **NO se descuenta sanción.**

---

### `v_excepcional_etapa3`

Ausentes hoy.

**Uso:** tercera ampliación manual. **Se agrega 1 sanción al designado.**

---

### `v_estado_trabajador`

Estado completo para UI. Incluye asistencia, condiciones y designación activa.

**Uso:**
```sql
SELECT * FROM v_estado_trabajador WHERE trabajador_id = X;
```

---

## ⚡ Índices estratégicos

### Índices parciales del motor

Los índices más importantes son los **parciales**, que solo indexan un subconjunto de filas:

| Índice | Filtro | Uso |
|--------|--------|-----|
| `idx_trab_elegibles` | `presente_hoy AND presente_ayer AND NOT anotado AND activo` | Base del motor |
| `idx_trab_excepcional_etapa1` | `presente_hoy AND NOT presente_ayer AND activo` | Etapa 1 |
| `idx_trab_excepcional_etapa2` | `presente_hoy AND activo` | Etapa 2 |
| `idx_trab_excepcional_etapa3` | `NOT presente_hoy AND activo` | Etapa 3 |
| `idx_atrasos_prioridad` | `cantidad > 0`, ordenado por `cantidad DESC, fecha ASC` | Orden del motor |
| `idx_usuarios_email` | `activo = TRUE` | Login |
| `idx_designaciones_activas` | `estado IN ('DESIGNADO', 'TRABAJANDO')` | Verificar ocupación |

**Regla:** cuando escribas una consulta al motor, asegurate de que use los mismos filtros que el índice para que PostgreSQL lo use.

---

## 🎯 Reglas de negocio clave

### Prioridad de atrasados (RN-103, RN-104)

Los atrasados se ordenan por:
1. `atrasos_pendientes DESC` (mayor cantidad primero).
2. `fecha_primer_atraso ASC` (más antiguo primero).

---

### Requisitos para usar atrasos (RN-105)

Un trabajador puede usar su prioridad de atraso solo si:
- `presente_hoy = TRUE`
- `presente_ayer = TRUE`
- No está inhabilitado para la empresa.
- No está anotado.
- No tiene sanción activa.
- No está designado.

---

### Descuento de atraso (RN-106)

Al designar por prioridad de atraso, se descuenta 1 turno automáticamente (trigger 5).

---

### Cobertura excepcional (RN-088, RN-089, RN-090)

| Etapa | Condiciones | Sanción |
|-------|-------------|---------|
| 1 | Presentes hoy, ausentes ayer, sin sanciones ni atrasos | No |
| 2 | Sancionados presentes hoy | No se descuenta |
| 3 | Ausentes hoy | +1 turno de sanción |

---

### Decisión cola vs inmediato (RN-063, RN-064, RN-065)

| Pedido para | Hora pedido | Hora actual | Decisión |
|-------------|-------------|-------------|----------|
| Hoy | 06:30 | 03:00 | Inmediato |
| Hoy | 06:30 | 10:00 | Inmediato |
| Hoy | 14:00 | 03:00 | Cola |
| Hoy | 14:00 | 10:00 | Inmediato |
| Mañana | Cualquiera | Cualquiera | Cola |

---

## 🔧 Convenciones de código

### Nombres

- **Tablas:** `snake_case`, plural (`trabajadores`, `designaciones`).
- **Columnas:** `snake_case`, singular (`trabajador_id`, `fecha_inicio`).
- **Índices:** `idx_tabla_descripcion` (`idx_trabajadores_documento`).
- **Vistas:** `v_nombre` (`v_atrasados_elegibles`).
- **Triggers:** `trg_accion` (`trg_sync_presente_flags`).
- **Funciones:** `fn_accion` (`fn_ejecutar_motor`).

### Tipos de datos

- **IDs:** `SERIAL` (auto-incremental).
- **Fechas:** `DATE` para días, `TIMESTAMP` para momentos exactos.
- **Booleanos:** `BOOLEAN` con `DEFAULT FALSE`.
- **Textos:** `VARCHAR(n)` con tamaño según el campo.
- **Estados:** `VARCHAR(20)` con `CHECK` de valores válidos.

---

## 📚 Consultas frecuentes

### Obtener atrasados elegibles para una empresa

```sql
SELECT * FROM v_atrasados_elegibles v
WHERE v.seccional_id = X
  AND NOT EXISTS (
      SELECT 1 FROM inhabilitaciones i
      WHERE i.trabajador_id = v.trabajador_id
        AND i.empresa_id = Y
  )
  AND NOT EXISTS (
      SELECT 1 FROM designaciones d
      WHERE d.trabajador_id = v.trabajador_id
        AND d.estado IN ('DESIGNADO', 'TRABAJANDO')
  )
ORDER BY v.atrasos_pendientes DESC, v.fecha_primer_atraso ASC;
```

### Verificar si un trabajador está ocupado

```sql
SELECT EXISTS (
    SELECT 1 FROM designaciones
    WHERE trabajador_id = X
      AND estado IN ('DESIGNADO', 'TRABAJANDO')
) AS ocupado;
```

### Obtener pedidos activos del día

```sql
SELECT * FROM pedidos
WHERE seccional_id = X
  AND fecha = CURRENT_DATE
  AND estado IN ('PENDIENTE', 'EN_PROCESO')
ORDER BY fecha_creacion ASC;
```

### Procesar cola al cerrar asistencia

```sql
SELECT fn_procesar_cola_pedidos();
```

---

## 🚨 Reglas para escribir código nuevo

1. **Respetar la estructura de tablas.** No agregar columnas sin actualizar este documento.
2. **Usar las vistas existentes** en vez de escribir consultas complejas.
3. **Confiar en los triggers** para la sincronización de flags y estados.
4. **No duplicar la lógica del motor** en el backend.
5. **Usar índices parciales** en las consultas del motor.
6. **Validar condiciones** con los CHECK existentes antes de insertar.
7. **Documentar** cualquier cambio estructural en este documento.

---

## 🎯 Resumen ejecutivo

El sistema es una base de datos PostgreSQL con:

- **15 tablas** organizadas por responsabilidad.
- **7 vistas** que encapsulan la lógica del motor.
- **9 triggers** que automatizan la sincronización.
- **3 funciones** que ejecutan decisiones complejas y la cola FIFO.
- Índices de integridad y rendimiento para las consultas del motor.

El flujo principal es:
1. Se registra una seccional, empresas y trabajadores.
2. Se toma asistencia diaria y se sincronizan flags.
3. Las empresas crean pedidos.
4. El sistema decide cola o inmediato.
5. El motor designa trabajadores con prioridades.
6. Se actualiza el pedido y se notifica.

---


---

**Versión:** 3.0  
**Fecha de validación:** 2026-09-22  
**Última actualización:** 2026-09-17  
**Nota:** El SQL DDL completo se encuentra en `database-sql.md`
