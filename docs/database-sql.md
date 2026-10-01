-- ============================================================================
-- SISTEMA DE GESTIÓN Y ASIGNACIÓN DE PERSONAL EVENTUAL PARA UATRE
-- Base de datos completa en PostgreSQL
-- ============================================================================
--
-- Este script crea la base de datos completa del sistema, incluyendo:
--   0. Configuración inicial
--   1. Tablas (15 tablas)
--   2. Foreign Keys y políticas de borrado
--   3. Índices de integridad y rendimiento
--   4. Vistas del motor (7 vistas)
--   5. Triggers (9 triggers)
--   6. Funciones del motor (3 funciones)
--
-- Versión: 3.0
-- Fecha: 2026-09-22
-- Actualización: Normalización de establecimientos y tareas por empresa,
-- integridad adicional y procesamiento FIFO ejecutable.
-- ============================================================================


-- ============================================================================
-- SECCIÓN 0: CONFIGURACIÓN INICIAL
-- ============================================================================

SELECT version();


-- ============================================================================
-- SECCIÓN 1: CREACIÓN DE TABLAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 SECCIONALES
-- ----------------------------------------------------------------------------
CREATE TABLE seccionales (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    localidad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    punto_rotacion INTEGER NOT NULL DEFAULT 1,
    cantidad_numeros INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_numeros >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE seccionales IS 'Sedes de UATRE';
COMMENT ON COLUMN seccionales.numero IS 'Número único de seccional';
COMMENT ON COLUMN seccionales.punto_rotacion IS 'Próximo número desde donde arranca el motor';
COMMENT ON COLUMN seccionales.cantidad_numeros IS 'Cantidad de números que tiene la lista';


-- ----------------------------------------------------------------------------
-- 1.2 EMPRESAS
-- ----------------------------------------------------------------------------
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    seccional_id INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE empresas IS 'Empresas afiliadas a una seccional';
COMMENT ON COLUMN empresas.seccional_id IS 'Seccional a la que pertenece la empresa';


-- ----------------------------------------------------------------------------
-- 1.2.1 ESTABLECIMIENTOS
-- ----------------------------------------------------------------------------
CREATE TABLE establecimientos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(300) NOT NULL,
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_establecimiento_empresa_nombre UNIQUE (empresa_id, nombre),
    CONSTRAINT uq_establecimiento_empresa_id UNIQUE (id, empresa_id)
);

COMMENT ON TABLE establecimientos IS 'Establecimientos o direcciones de una empresa';


-- ----------------------------------------------------------------------------
-- 1.2.2 TAREAS_EMPRESA
-- ----------------------------------------------------------------------------
CREATE TABLE tareas_empresa (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tarea_empresa_nombre UNIQUE (empresa_id, nombre),
    CONSTRAINT uq_tarea_empresa_id UNIQUE (id, empresa_id)
);

COMMENT ON TABLE tareas_empresa IS 'Tipos de trabajo configurados por empresa';


-- ----------------------------------------------------------------------------
-- 1.3 TRABAJADORES
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE trabajadores IS 'Socios/trabajadores del sistema';
COMMENT ON COLUMN trabajadores.documento IS 'Documento único a nivel global';
COMMENT ON COLUMN trabajadores.presente_hoy IS 'Flag: presente en la jornada actual';
COMMENT ON COLUMN trabajadores.presente_ayer IS 'Flag: presente en la jornada anterior';
COMMENT ON COLUMN trabajadores.anotado IS 'Flag: ANOTADO (bloqueo temporal)';


-- ----------------------------------------------------------------------------
-- 1.4 USUARIOS
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE usuarios IS 'Usuarios centralizados del sistema';
COMMENT ON COLUMN usuarios.tipo IS 'Rol: SECCIONAL, EMPRESA o TRABAJADOR';


-- ----------------------------------------------------------------------------
-- 1.5 LISTA_ROTACION
-- ----------------------------------------------------------------------------
CREATE TABLE lista_rotacion (
    id SERIAL PRIMARY KEY,
    seccional_id INTEGER NOT NULL,
    numero INTEGER NOT NULL CHECK (numero > 0),
    trabajador_id INTEGER,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_lista_numero UNIQUE (seccional_id, numero)
);

COMMENT ON TABLE lista_rotacion IS 'Lista fija de números por seccional';
COMMENT ON COLUMN lista_rotacion.trabajador_id IS 'Trabajador asignado (NULL = libre)';


-- ----------------------------------------------------------------------------
-- 1.6 ASISTENCIA
-- ----------------------------------------------------------------------------
CREATE TABLE asistencia (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    cerrado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_asistencia_trabajador_fecha UNIQUE (trabajador_id, fecha)
);

COMMENT ON TABLE asistencia IS 'Historial diario de asistencia';


-- ----------------------------------------------------------------------------
-- 1.7 ATRASOS
-- ----------------------------------------------------------------------------
CREATE TABLE atrasos (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL UNIQUE,
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    fecha_primer_atraso TIMESTAMP
);

COMMENT ON TABLE atrasos IS 'Cantidad de turnos atrasados acumulados';
COMMENT ON COLUMN atrasos.fecha_primer_atraso IS 'Fecha del primer atraso pendiente (se resetea al llegar a 0)';


-- ----------------------------------------------------------------------------
-- 1.8 SANCIONES
-- ----------------------------------------------------------------------------
CREATE TABLE sanciones (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL UNIQUE,
    turnos_pendientes INTEGER NOT NULL DEFAULT 0 CHECK (turnos_pendientes >= 0),
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP
);

COMMENT ON TABLE sanciones IS 'Turnos de sanción pendientes por trabajador';


-- ----------------------------------------------------------------------------
-- 1.9 INHABILITACIONES
-- ----------------------------------------------------------------------------
CREATE TABLE inhabilitaciones (
    id SERIAL PRIMARY KEY,
    trabajador_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    fecha_inhabilitacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inhabilitacion UNIQUE (trabajador_id, empresa_id)
);

COMMENT ON TABLE inhabilitaciones IS 'Inhabilitaciones de trabajadores para empresas específicas';


-- ----------------------------------------------------------------------------
-- 1.10 PEDIDOS
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE pedidos IS 'Pedidos de personal creados por empresas';


-- ----------------------------------------------------------------------------
-- 1.11 COLA_PEDIDOS
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE cola_pedidos IS 'Pedidos en espera de procesamiento';


-- ----------------------------------------------------------------------------
-- 1.12 DESIGNACIONES
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE designaciones IS 'Asignación de trabajadores a pedidos';


-- ----------------------------------------------------------------------------
-- 1.13 PEDIDO_HISTORIAL
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE pedido_historial IS 'Historial de pedidos al cierre de jornada';


-- ============================================================================
-- SECCIÓN 2: FOREIGN KEYS Y POLÍTICAS DE BORRADO
-- ============================================================================

ALTER TABLE empresas
    ADD CONSTRAINT fk_empresas_seccional
    FOREIGN KEY (seccional_id) REFERENCES seccionales(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE establecimientos
    ADD CONSTRAINT fk_establecimientos_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE tareas_empresa
    ADD CONSTRAINT fk_tareas_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE trabajadores
    ADD CONSTRAINT fk_trabajadores_seccional
    FOREIGN KEY (seccional_id) REFERENCES seccionales(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuarios_seccional
    FOREIGN KEY (seccional_id) REFERENCES seccionales(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuarios_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuarios_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE lista_rotacion
    ADD CONSTRAINT fk_lista_seccional
    FOREIGN KEY (seccional_id) REFERENCES seccionales(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE lista_rotacion
    ADD CONSTRAINT fk_lista_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE asistencia
    ADD CONSTRAINT fk_asistencia_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE atrasos
    ADD CONSTRAINT fk_atrasos_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE sanciones
    ADD CONSTRAINT fk_sanciones_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE inhabilitaciones
    ADD CONSTRAINT fk_inhabilitaciones_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE inhabilitaciones
    ADD CONSTRAINT fk_inhabilitaciones_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedidos
    ADD CONSTRAINT fk_pedidos_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedidos
    ADD CONSTRAINT fk_pedidos_seccional
    FOREIGN KEY (seccional_id) REFERENCES seccionales(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE pedidos
    ADD CONSTRAINT fk_pedidos_tarea
    FOREIGN KEY (tarea_id, empresa_id) REFERENCES tareas_empresa(id, empresa_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE pedidos
    ADD CONSTRAINT fk_pedidos_establecimiento
    FOREIGN KEY (establecimiento_id, empresa_id) REFERENCES establecimientos(id, empresa_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE cola_pedidos
    ADD CONSTRAINT fk_cola_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE designaciones
    ADD CONSTRAINT fk_designaciones_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE designaciones
    ADD CONSTRAINT fk_designaciones_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedido_historial
    ADD CONSTRAINT fk_historial_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedido_historial
    ADD CONSTRAINT fk_historial_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedido_historial
    ADD CONSTRAINT fk_historial_seccional
    FOREIGN KEY (seccional_id) REFERENCES seccionales(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX uq_designacion_activa_trabajador
    ON designaciones (trabajador_id)
    WHERE estado IN ('DESIGNADO', 'TRABAJANDO');

CREATE UNIQUE INDEX uq_usuario_seccional
    ON usuarios (seccional_id)
    WHERE tipo = 'SECCIONAL';


-- ============================================================================
-- SECCIÓN 3: ÍNDICES
-- ============================================================================

CREATE INDEX idx_empresas_seccional ON empresas (seccional_id);
CREATE INDEX idx_empresas_activas ON empresas (seccional_id) WHERE activa = TRUE;
CREATE INDEX idx_establecimientos_empresa ON establecimientos (empresa_id) WHERE activo = TRUE;
CREATE INDEX idx_tareas_empresa ON tareas_empresa (empresa_id) WHERE activa = TRUE;

CREATE INDEX idx_trabajadores_seccional ON trabajadores (seccional_id);
CREATE INDEX idx_trabajadores_documento ON trabajadores (documento);
CREATE INDEX idx_trabajadores_activos ON trabajadores (seccional_id) WHERE activo = TRUE;

CREATE INDEX idx_trab_elegibles ON trabajadores (seccional_id) 
    WHERE presente_hoy = TRUE AND presente_ayer = TRUE AND anotado = FALSE AND activo = TRUE;

CREATE INDEX idx_trab_excepcional_etapa1 ON trabajadores (seccional_id) 
    WHERE presente_hoy = TRUE AND presente_ayer = FALSE AND activo = TRUE;

CREATE INDEX idx_trab_excepcional_etapa2 ON trabajadores (seccional_id) 
    WHERE presente_hoy = TRUE AND activo = TRUE;

CREATE INDEX idx_trab_excepcional_etapa3 ON trabajadores (seccional_id) 
    WHERE presente_hoy = FALSE AND activo = TRUE;

CREATE INDEX idx_trab_anotados ON trabajadores (seccional_id) 
    WHERE anotado = TRUE AND activo = TRUE;

CREATE INDEX idx_usuarios_email ON usuarios (email) WHERE activo = TRUE;
CREATE INDEX idx_usuarios_seccional ON usuarios (seccional_id) WHERE tipo = 'SECCIONAL';
CREATE INDEX idx_usuarios_empresa ON usuarios (empresa_id) WHERE tipo = 'EMPRESA';
CREATE INDEX idx_usuarios_trabajador ON usuarios (trabajador_id) WHERE tipo = 'TRABAJADOR';

CREATE INDEX idx_lista_seccional ON lista_rotacion (seccional_id);
CREATE INDEX idx_lista_ocupados ON lista_rotacion (seccional_id, numero) 
    WHERE trabajador_id IS NOT NULL AND activo = TRUE;
CREATE INDEX idx_lista_libres ON lista_rotacion (seccional_id, numero) 
    WHERE trabajador_id IS NULL AND activo = TRUE;
CREATE INDEX idx_lista_trabajador ON lista_rotacion (trabajador_id) 
    WHERE trabajador_id IS NOT NULL;

CREATE INDEX idx_asistencia_fecha ON asistencia (fecha);
CREATE INDEX idx_asistencia_cerrada ON asistencia (fecha, cerrado) WHERE cerrado = TRUE;

CREATE INDEX idx_atrasos_cantidad ON atrasos (cantidad) WHERE cantidad > 0;
CREATE INDEX idx_atrasos_prioridad ON atrasos (cantidad DESC, fecha_primer_atraso ASC) 
    WHERE cantidad > 0;

CREATE INDEX idx_sanciones_activas ON sanciones (trabajador_id) 
    WHERE fecha_fin IS NULL AND turnos_pendientes > 0;

CREATE INDEX idx_inhabilitaciones_par ON inhabilitaciones (trabajador_id, empresa_id);
CREATE INDEX idx_inhabilitaciones_empresa ON inhabilitaciones (empresa_id);

CREATE INDEX idx_pedidos_empresa ON pedidos (empresa_id);
CREATE INDEX idx_pedidos_seccional ON pedidos (seccional_id);
CREATE INDEX idx_pedidos_estado ON pedidos (seccional_id, estado);
CREATE INDEX idx_pedidos_fecha ON pedidos (seccional_id, fecha);
CREATE INDEX idx_pedidos_activos ON pedidos (seccional_id, fecha, estado) 
    WHERE estado IN ('PENDIENTE', 'EN_PROCESO');

CREATE INDEX idx_cola_pendientes ON cola_pedidos (fecha_procesamiento_programado, orden) 
    WHERE estado = 'PENDIENTE';

CREATE INDEX idx_designaciones_pedido ON designaciones (pedido_id);
CREATE INDEX idx_designaciones_activas ON designaciones (trabajador_id, estado) 
    WHERE estado IN ('DESIGNADO', 'TRABAJANDO');
CREATE INDEX idx_designaciones_horario ON designaciones (horario_inicio) 
    WHERE estado = 'DESIGNADO';
CREATE INDEX idx_designaciones_liberacion ON designaciones (horario_inicio) 
    WHERE estado = 'TRABAJANDO';

CREATE INDEX idx_historial_seccional_fecha ON pedido_historial (seccional_id, fecha);
CREATE INDEX idx_historial_empresa ON pedido_historial (empresa_id);
CREATE INDEX idx_historial_pedido ON pedido_historial (pedido_id);


-- ============================================================================
-- SECCIÓN 4: VISTAS DEL MOTOR
-- ============================================================================

-- Vista base para socios disponibles: usada en el pizarron seccional
-- Muestra la lista COMPLETA de numeros disponibles (presente_hoy=TRUE, presente_ayer=TRUE, anotado=FALSE, sin sanciones)
-- Se actualiza cada 30 segundos en la pantalla del pizarron
CREATE OR REPLACE VIEW v_trabajadores_elegibles AS
SELECT 
    t.id AS trabajador_id,
    t.nombre,
    t.apellido,
    t.seccional_id,
    t.presente_hoy,
    t.presente_ayer,
    t.anotado,
    lr.numero AS numero_lista,
    COALESCE(a.cantidad, 0) AS atrasos_pendientes,
    a.fecha_primer_atraso,
    CASE 
        WHEN s.id IS NOT NULL AND s.fecha_fin IS NULL THEN s.turnos_pendientes 
        ELSE 0 
    END AS sanciones_pendientes
FROM trabajadores t
INNER JOIN lista_rotacion lr 
    ON lr.trabajador_id = t.id AND lr.activo = TRUE
LEFT JOIN atrasos a ON a.trabajador_id = t.id
LEFT JOIN sanciones s ON s.trabajador_id = t.id AND s.fecha_fin IS NULL
WHERE 
    t.activo = TRUE
    AND t.presente_hoy = TRUE
    AND t.presente_ayer = TRUE
    AND t.anotado = FALSE;


CREATE OR REPLACE VIEW v_atrasados_elegibles AS
SELECT 
    trabajador_id, nombre, apellido, seccional_id, numero_lista,
    atrasos_pendientes, fecha_primer_atraso, sanciones_pendientes
FROM v_trabajadores_elegibles
WHERE atrasos_pendientes > 0 AND sanciones_pendientes = 0;


CREATE OR REPLACE VIEW v_rotacion_disponible AS
SELECT 
    trabajador_id, nombre, apellido, seccional_id, numero_lista,
    atrasos_pendientes, sanciones_pendientes
FROM v_trabajadores_elegibles
WHERE sanciones_pendientes = 0 AND atrasos_pendientes = 0;


CREATE OR REPLACE VIEW v_excepcional_etapa1 AS
SELECT 
    t.id AS trabajador_id, t.nombre, t.apellido, t.seccional_id,
    lr.numero AS numero_lista
FROM trabajadores t
INNER JOIN lista_rotacion lr ON lr.trabajador_id = t.id AND lr.activo = TRUE
LEFT JOIN atrasos a ON a.trabajador_id = t.id
LEFT JOIN sanciones s ON s.trabajador_id = t.id AND s.fecha_fin IS NULL
WHERE 
    t.activo = TRUE
    AND t.presente_hoy = TRUE
    AND t.presente_ayer = FALSE
    AND t.anotado = FALSE
    AND COALESCE(a.cantidad, 0) = 0
    AND (s.id IS NULL OR s.turnos_pendientes = 0);


CREATE OR REPLACE VIEW v_excepcional_etapa2 AS
SELECT 
    t.id AS trabajador_id, t.nombre, t.apellido, t.seccional_id,
    lr.numero AS numero_lista, s.turnos_pendientes
FROM trabajadores t
INNER JOIN lista_rotacion lr ON lr.trabajador_id = t.id AND lr.activo = TRUE
INNER JOIN sanciones s ON s.trabajador_id = t.id 
    AND s.fecha_fin IS NULL AND s.turnos_pendientes > 0
WHERE 
    t.activo = TRUE
    AND t.presente_hoy = TRUE
    AND t.anotado = FALSE;


CREATE OR REPLACE VIEW v_excepcional_etapa3 AS
SELECT 
    t.id AS trabajador_id, t.nombre, t.apellido, t.seccional_id,
    lr.numero AS numero_lista
FROM trabajadores t
INNER JOIN lista_rotacion lr ON lr.trabajador_id = t.id AND lr.activo = TRUE
WHERE 
    t.activo = TRUE
    AND t.presente_hoy = FALSE
    AND t.anotado = FALSE;


CREATE OR REPLACE VIEW v_estado_trabajador AS
SELECT 
    t.id AS trabajador_id,
    t.nombre, t.apellido, t.documento, t.telefono, t.seccional_id, t.activo,
    lr.numero AS numero_lista,
    t.presente_hoy, t.presente_ayer, t.anotado,
    COALESCE(a.cantidad, 0) AS atrasos_pendientes,
    a.fecha_primer_atraso,
    CASE WHEN s.id IS NOT NULL AND s.fecha_fin IS NULL THEN s.turnos_pendientes ELSE 0 END AS sanciones_pendientes,
    d.pedido_id AS pedido_activo,
    d.estado AS estado_designacion,
    d.horario_inicio AS horario_designacion,
    (SELECT COUNT(*) FROM inhabilitaciones i WHERE i.trabajador_id = t.id) AS total_inhabilitaciones
FROM trabajadores t
LEFT JOIN lista_rotacion lr ON lr.trabajador_id = t.id AND lr.activo = TRUE
LEFT JOIN atrasos a ON a.trabajador_id = t.id
LEFT JOIN sanciones s ON s.trabajador_id = t.id AND s.fecha_fin IS NULL
LEFT JOIN designaciones d ON d.trabajador_id = t.id 
    AND d.estado IN ('DESIGNADO', 'TRABAJANDO');


-- ============================================================================
-- SECCIÓN 5: TRIGGERS
-- ============================================================================

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

DROP TRIGGER IF EXISTS trg_sync_presente_flags ON asistencia;
CREATE TRIGGER trg_sync_presente_flags
AFTER INSERT OR UPDATE OF cerrado ON asistencia
FOR EACH ROW
EXECUTE FUNCTION fn_sync_presente_flags();


CREATE OR REPLACE FUNCTION fn_reset_presente_hoy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trabajadores SET presente_hoy = FALSE WHERE id = NEW.trabajador_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reset_presente_hoy ON asistencia;
CREATE TRIGGER trg_reset_presente_hoy
BEFORE INSERT ON asistencia
FOR EACH ROW
EXECUTE FUNCTION fn_reset_presente_hoy();


CREATE OR REPLACE FUNCTION fn_crear_atraso_inicial()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO atrasos (trabajador_id, cantidad)
    VALUES (NEW.id, 0)
    ON CONFLICT (trabajador_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crear_atraso_inicial ON trabajadores;
CREATE TRIGGER trg_crear_atraso_inicial
AFTER INSERT ON trabajadores
FOR EACH ROW
EXECUTE FUNCTION fn_crear_atraso_inicial();


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

DROP TRIGGER IF EXISTS trg_gestionar_fecha_primer_atraso ON atrasos;
CREATE TRIGGER trg_gestionar_fecha_primer_atraso
BEFORE UPDATE ON atrasos
FOR EACH ROW
EXECUTE FUNCTION fn_gestionar_fecha_primer_atraso();


CREATE OR REPLACE FUNCTION fn_descontar_atraso_al_designar()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE atrasos
    SET cantidad = GREATEST(cantidad - 1, 0)
    WHERE trabajador_id = NEW.trabajador_id AND cantidad > 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_descontar_atraso_al_designar ON designaciones;
CREATE TRIGGER trg_descontar_atraso_al_designar
AFTER INSERT ON designaciones
FOR EACH ROW
EXECUTE FUNCTION fn_descontar_atraso_al_designar();


CREATE OR REPLACE FUNCTION fn_gestionar_sancion_al_llegar_a_cero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.turnos_pendientes = 0 AND (OLD.turnos_pendientes IS NULL OR OLD.turnos_pendientes > 0) THEN
        NEW.fecha_fin = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gestionar_sancion_al_llegar_a_cero ON sanciones;
CREATE TRIGGER trg_gestionar_sancion_al_llegar_a_cero
BEFORE UPDATE ON sanciones
FOR EACH ROW
EXECUTE FUNCTION fn_gestionar_sancion_al_llegar_a_cero();


CREATE OR REPLACE FUNCTION fn_paso_a_trabajando()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'TRABAJANDO' AND OLD.estado = 'DESIGNADO' THEN
        NEW.horario_fin = NEW.horario_inicio + INTERVAL '12 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paso_a_trabajando ON designaciones;
CREATE TRIGGER trg_paso_a_trabajando
BEFORE UPDATE ON designaciones
FOR EACH ROW
EXECUTE FUNCTION fn_paso_a_trabajando();


CREATE OR REPLACE FUNCTION fn_liberar_designacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'FINALIZADO' AND OLD.estado = 'TRABAJANDO' THEN
        NEW.horario_fin = COALESCE(NEW.horario_fin, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_liberar_designacion ON designaciones;
CREATE TRIGGER trg_liberar_designacion
BEFORE UPDATE ON designaciones
FOR EACH ROW
EXECUTE FUNCTION fn_liberar_designacion();


CREATE OR REPLACE FUNCTION fn_descuento_atraso_ausencia()
RETURNS TRIGGER AS $$
BEGIN
    -- Trigger 9: Descuenta atrasos cuando trabajador está AUSENTE al cerrar asistencia
    -- Se ejecuta al cerrar asistencia (cerrado = TRUE)
    IF NEW.cerrado = TRUE AND (OLD.cerrado IS NULL OR OLD.cerrado = FALSE) THEN
        -- Si el trabajador está AUSENTE (presente = FALSE)
        IF NEW.presente = FALSE THEN
            -- Descontar 1 atraso si tiene (máximo 1 por trabajador y por jornada)
            UPDATE atrasos
            SET cantidad = GREATEST(cantidad - 1, 0)
            WHERE trabajador_id = NEW.trabajador_id AND cantidad > 0
            ;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_descuento_atraso_ausencia ON asistencia;
CREATE TRIGGER trg_descuento_atraso_ausencia
AFTER INSERT OR UPDATE OF cerrado ON asistencia
FOR EACH ROW
EXECUTE FUNCTION fn_descuento_atraso_ausencia();


-- ============================================================================
-- SECCIÓN 6: FUNCIONES DEL MOTOR
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_decidir_procesamiento_pedido()
RETURNS TRIGGER AS $$
DECLARE
    v_hora_actual TIME;
    v_fecha_pedido DATE;
    v_horario_pedido TIME;
    v_hoy DATE;
    v_ya_paso_0740 BOOLEAN;
    v_decision VARCHAR(20);
    v_proxima_actualizacion TIMESTAMP;
BEGIN
    v_hora_actual := CURRENT_TIME;
    v_hoy := CURRENT_DATE;
    v_fecha_pedido := NEW.fecha;
    v_horario_pedido := NEW.horario_inicio;
    v_ya_paso_0740 := v_hora_actual >= TIME '07:40';

    IF v_fecha_pedido = v_hoy THEN
        IF v_ya_paso_0740 THEN
            v_decision := 'INMEDIATO';
        ELSIF v_horario_pedido < TIME '07:40' THEN
            v_decision := 'INMEDIATO';
        ELSE
            v_decision := 'COLA';
        END IF;
    ELSIF v_fecha_pedido = v_hoy + 1
          AND v_horario_pedido < TIME '07:40' THEN
        v_decision := 'INMEDIATO';
    ELSE
        v_decision := 'COLA';
    END IF;

    IF v_decision = 'COLA' THEN
        IF v_ya_paso_0740 THEN
            v_proxima_actualizacion := (v_hoy + 1) + TIME '07:40';
        ELSE
            v_proxima_actualizacion := v_hoy + TIME '07:40';
        END IF;

        INSERT INTO cola_pedidos (
            pedido_id, fecha_encolamiento, fecha_procesamiento_programado, estado
        ) VALUES (
            NEW.id, CURRENT_TIMESTAMP, v_proxima_actualizacion, 'PENDIENTE'
        );

        UPDATE pedidos SET estado = 'PENDIENTE' WHERE id = NEW.id;
    ELSE
        UPDATE pedidos SET estado = 'EN_PROCESO' WHERE id = NEW.id;
        PERFORM fn_ejecutar_motor(NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_procesar_cola_pedidos(
    p_momento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS VOID AS $$
DECLARE
    v_cola RECORD;
BEGIN
    FOR v_cola IN
        SELECT cp.id, cp.pedido_id
        FROM cola_pedidos cp
        WHERE cp.estado = 'PENDIENTE'
          AND cp.fecha_procesamiento_programado <= p_momento
        ORDER BY cp.fecha_procesamiento_programado, cp.orden
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE pedidos
        SET estado = 'EN_PROCESO'
        WHERE id = v_cola.pedido_id
          AND estado = 'PENDIENTE';

        PERFORM fn_ejecutar_motor(v_cola.pedido_id);

        UPDATE cola_pedidos
        SET estado = 'PROCESADO'
        WHERE id = v_cola.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decidir_procesamiento_pedido ON pedidos;
CREATE TRIGGER trg_decidir_procesamiento_pedido
AFTER INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION fn_decidir_procesamiento_pedido();


CREATE OR REPLACE FUNCTION fn_ejecutar_motor(p_pedido_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_pedido RECORD;
    v_trabajador RECORD;
    v_faltan INTEGER;
    v_numero_actual INTEGER;
    v_total_numeros INTEGER;
    v_max_iteraciones INTEGER;
    v_iteracion INTEGER := 0;
    v_ya_designados INTEGER;
BEGIN
    SELECT * INTO v_pedido FROM pedidos WHERE id = p_pedido_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'Pedido % no encontrado', p_pedido_id;
        RETURN;
    END IF;

    SELECT COUNT(*) INTO v_ya_designados 
    FROM designaciones 
    WHERE pedido_id = p_pedido_id AND estado IN ('DESIGNADO', 'TRABAJANDO');

    v_faltan := v_pedido.cant_requerida - v_ya_designados;

    IF v_faltan <= 0 THEN
        RAISE NOTICE 'Pedido % ya está cubierto', p_pedido_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Pedido % necesita % trabajadores', p_pedido_id, v_faltan;

    FOR v_trabajador IN 
        SELECT v.trabajador_id, v.atrasos_pendientes, v.fecha_primer_atraso
        FROM v_atrasados_elegibles v
        WHERE v.seccional_id = v_pedido.seccional_id
          AND NOT EXISTS (
              SELECT 1 FROM inhabilitaciones i
              WHERE i.trabajador_id = v.trabajador_id
                AND i.empresa_id = v_pedido.empresa_id
          )
          AND NOT EXISTS (
              SELECT 1 FROM designaciones d
              WHERE d.trabajador_id = v.trabajador_id
                AND d.estado IN ('DESIGNADO', 'TRABAJANDO')
          )
        ORDER BY v.atrasos_pendientes DESC, v.fecha_primer_atraso ASC
    LOOP
        EXIT WHEN v_faltan <= 0;

        INSERT INTO designaciones (
            pedido_id, trabajador_id, estado, horario_inicio, es_excepcional
        ) VALUES (
            p_pedido_id, v_trabajador.trabajador_id, 'DESIGNADO',
            (v_pedido.fecha + v_pedido.horario_inicio)::TIMESTAMP, FALSE
        );

        v_faltan := v_faltan - 1;
    END LOOP;

    IF v_faltan <= 0 THEN
        UPDATE pedidos SET estado = 'CUBIERTO' WHERE id = p_pedido_id;
        RETURN;
    END IF;

    SELECT COUNT(*) INTO v_total_numeros 
    FROM lista_rotacion 
    WHERE seccional_id = v_pedido.seccional_id AND activo = TRUE;

    SELECT punto_rotacion INTO v_numero_actual 
    FROM seccionales WHERE id = v_pedido.seccional_id;

    v_max_iteraciones := v_total_numeros * 2;

    WHILE v_faltan > 0 AND v_iteracion < v_max_iteraciones LOOP
        v_iteracion := v_iteracion + 1;

        SELECT 
            lr.numero, t.id AS trabajador_id, t.presente_hoy, 
            t.presente_ayer, t.anotado
        INTO v_trabajador
        FROM lista_rotacion lr
        LEFT JOIN trabajadores t ON t.id = lr.trabajador_id
        WHERE lr.seccional_id = v_pedido.seccional_id
          AND lr.numero = v_numero_actual
          AND lr.activo = TRUE;

        IF v_trabajador.trabajador_id IS NOT NULL 
           AND v_trabajador.presente_hoy = TRUE
           AND v_trabajador.presente_ayer = TRUE
           AND v_trabajador.anotado = FALSE
           AND NOT EXISTS (SELECT 1 FROM inhabilitaciones i
                           WHERE i.trabajador_id = v_trabajador.trabajador_id
                             AND i.empresa_id = v_pedido.empresa_id)
           AND NOT EXISTS (SELECT 1 FROM designaciones d
                           WHERE d.trabajador_id = v_trabajador.trabajador_id
                             AND d.estado IN ('DESIGNADO', 'TRABAJANDO'))
           AND NOT EXISTS (SELECT 1 FROM sanciones s
                           WHERE s.trabajador_id = v_trabajador.trabajador_id
                             AND s.fecha_fin IS NULL AND s.turnos_pendientes > 0)
           AND NOT EXISTS (SELECT 1 FROM atrasos a
                           WHERE a.trabajador_id = v_trabajador.trabajador_id
                             AND a.cantidad > 0)
        THEN
            INSERT INTO designaciones (
                pedido_id, trabajador_id, estado, horario_inicio, es_excepcional
            ) VALUES (
                p_pedido_id, v_trabajador.trabajador_id, 'DESIGNADO',
                (v_pedido.fecha + v_pedido.horario_inicio)::TIMESTAMP, FALSE
            );
            v_faltan := v_faltan - 1;
        END IF;

        v_numero_actual := v_numero_actual + 1;
        IF v_numero_actual > v_total_numeros THEN
            v_numero_actual := 1;
        END IF;
    END LOOP;

    UPDATE seccionales SET punto_rotacion = v_numero_actual WHERE id = v_pedido.seccional_id;

    IF v_faltan <= 0 THEN
        UPDATE pedidos SET estado = 'CUBIERTO' WHERE id = p_pedido_id;
        RETURN;
    END IF;

    FOR v_trabajador IN 
        SELECT trabajador_id FROM v_excepcional_etapa1
        WHERE seccional_id = v_pedido.seccional_id
          AND NOT EXISTS (SELECT 1 FROM inhabilitaciones i
                          WHERE i.trabajador_id = trabajador_id 
                            AND i.empresa_id = v_pedido.empresa_id)
          AND NOT EXISTS (SELECT 1 FROM designaciones d
                          WHERE d.trabajador_id = trabajador_id 
                            AND d.estado IN ('DESIGNADO', 'TRABAJANDO'))
        ORDER BY numero_lista
    LOOP
        EXIT WHEN v_faltan <= 0;
        INSERT INTO designaciones (pedido_id, trabajador_id, estado, horario_inicio, es_excepcional)
        VALUES (p_pedido_id, v_trabajador.trabajador_id, 'DESIGNADO',
                (v_pedido.fecha + v_pedido.horario_inicio)::TIMESTAMP, TRUE);
        v_faltan := v_faltan - 1;
    END LOOP;

    IF v_faltan <= 0 THEN
        UPDATE pedidos SET estado = 'CUBIERTO' WHERE id = p_pedido_id;
        RETURN;
    END IF;

    FOR v_trabajador IN 
        SELECT trabajador_id FROM v_excepcional_etapa2
        WHERE seccional_id = v_pedido.seccional_id
          AND NOT EXISTS (SELECT 1 FROM inhabilitaciones i
                          WHERE i.trabajador_id = trabajador_id 
                            AND i.empresa_id = v_pedido.empresa_id)
          AND NOT EXISTS (SELECT 1 FROM designaciones d
                          WHERE d.trabajador_id = trabajador_id 
                            AND d.estado IN ('DESIGNADO', 'TRABAJANDO'))
        ORDER BY numero_lista
    LOOP
        EXIT WHEN v_faltan <= 0;
        INSERT INTO designaciones (pedido_id, trabajador_id, estado, horario_inicio, es_excepcional)
        VALUES (p_pedido_id, v_trabajador.trabajador_id, 'DESIGNADO',
                (v_pedido.fecha + v_pedido.horario_inicio)::TIMESTAMP, TRUE);
        v_faltan := v_faltan - 1;
    END LOOP;

    IF v_faltan <= 0 THEN
        UPDATE pedidos SET estado = 'CUBIERTO' WHERE id = p_pedido_id;
        RETURN;
    END IF;

    FOR v_trabajador IN 
        SELECT trabajador_id FROM v_excepcional_etapa3
        WHERE seccional_id = v_pedido.seccional_id
          AND NOT EXISTS (SELECT 1 FROM inhabilitaciones i
                          WHERE i.trabajador_id = trabajador_id 
                            AND i.empresa_id = v_pedido.empresa_id)
          AND NOT EXISTS (SELECT 1 FROM designaciones d
                          WHERE d.trabajador_id = trabajador_id 
                            AND d.estado IN ('DESIGNADO', 'TRABAJANDO'))
        ORDER BY numero_lista
    LOOP
        EXIT WHEN v_faltan <= 0;
        INSERT INTO designaciones (pedido_id, trabajador_id, estado, horario_inicio, es_excepcional)
        VALUES (p_pedido_id, v_trabajador.trabajador_id, 'DESIGNADO',
                (v_pedido.fecha + v_pedido.horario_inicio)::TIMESTAMP, TRUE);

        INSERT INTO sanciones (trabajador_id, turnos_pendientes, fecha_inicio)
        VALUES (v_trabajador.trabajador_id, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (trabajador_id) DO UPDATE 
        SET turnos_pendientes = sanciones.turnos_pendientes + 1, fecha_fin = NULL;

        v_faltan := v_faltan - 1;
    END LOOP;

    IF v_faltan <= 0 THEN
        UPDATE pedidos SET estado = 'CUBIERTO' WHERE id = p_pedido_id;
    ELSE
        UPDATE pedidos SET estado = 'NO_CUBIERTO' WHERE id = p_pedido_id;
    END IF;
END;
$$ LANGUAGE plpgsql;