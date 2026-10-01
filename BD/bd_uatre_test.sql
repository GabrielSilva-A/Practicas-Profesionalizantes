-- ============================================================
-- BORRAR TODOS LOS DATOS DE TODAS LAS TABLAS
-- Opción 1: TRUNCATE (rápido, resetea IDs)
-- ============================================================

TRUNCATE TABLE 
    pedido_historial,
    designaciones,
    cola_pedidos,
    pedidos,
    inhabilitaciones,
    sanciones,
    atrasos,
    asistencia,
    lista_rotacion,
    usuarios,
    trabajadores,
    tareas_empresa,
    establecimientos,
    empresas,
    seccionales
RESTART IDENTITY CASCADE;


-- ============================================================================
-- DEMOSTRACIÓN COMPLETA: SISTEMA DE GESTIÓN DE PERSONAL EVENTUAL UATRE
-- ============================================================================
-- Este script ejecuta las 8 etapas de la demostración:
--   1. Estado inicial (tablas vacías)
--   2. Creación de seccional y su usuario
--   3. Creación de 6 empresas y sus usuarios
--   4. Creación de 30 trabajadores y sus usuarios
--   5. Creación de la lista de rotación
--   6. Simulación de asistencia (ayer y hoy)
--   7. Creación y procesamiento de un pedido
--   8. Verificación final
-- ============================================================================


-- ============================================================================
-- ETAPA 1: ESTADO INICIAL
-- ============================================================================
-- Verificamos que todas las tablas están vacías antes de empezar.
-- ============================================================================

SELECT 
    'seccionales' AS tabla, COUNT(*) AS filas FROM seccionales
UNION ALL SELECT 'empresas', COUNT(*) FROM empresas
UNION ALL SELECT 'trabajadores', COUNT(*) FROM trabajadores
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'lista_rotacion', COUNT(*) FROM lista_rotacion
UNION ALL SELECT 'asistencia', COUNT(*) FROM asistencia
UNION ALL SELECT 'atrasos', COUNT(*) FROM atrasos
UNION ALL SELECT 'sanciones', COUNT(*) FROM sanciones
UNION ALL SELECT 'inhabilitaciones', COUNT(*) FROM inhabilitaciones
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'cola_pedidos', COUNT(*) FROM cola_pedidos
UNION ALL SELECT 'designaciones', COUNT(*) FROM designaciones
UNION ALL SELECT 'pedido_historial', COUNT(*) FROM pedido_historial;


-- ============================================================================
-- ETAPA 2: CREAR SECCIONAL Y SU USUARIO
-- ============================================================================
-- Creamos la seccional 1 con 30 números en su lista.
-- ============================================================================

INSERT INTO seccionales (
    numero, localidad, provincia, punto_rotacion, cantidad_numeros, activo
) VALUES (
    1, 'San Isidro', 'Buenos Aires', 1, 30, TRUE
);

INSERT INTO usuarios (email, password_hash, tipo, seccional_id)
VALUES ('seccional1@uatr.org', 'hash_seccional_1', 'SECCIONAL', 1);

SELECT * FROM seccionales;
SELECT id, email, tipo, seccional_id FROM usuarios WHERE tipo = 'SECCIONAL';


-- ============================================================================
-- ETAPA 3: CREAR 6 EMPRESAS Y SUS USUARIOS
-- ============================================================================
-- Creamos 6 empresas afiliadas a la seccional 1, cada una con su usuario.
-- ============================================================================

INSERT INTO empresas (seccional_id, nombre, localidad, provincia, activa) VALUES
    (1, 'Constructora del Norte S.A.',    'San Isidro', 'Buenos Aires', TRUE),
    (1, 'Logística Sur S.R.L.',           'San Isidro', 'Buenos Aires', TRUE),
    (1, 'Alimentos del Plata S.A.',       'San Isidro', 'Buenos Aires', TRUE),
    (1, 'Textil San Isidro S.A.',         'San Isidro', 'Buenos Aires', TRUE),
    (1, 'Servicios Generales Zona Norte', 'San Isidro', 'Buenos Aires', TRUE),
    (1, 'Distribuidora del Río',          'San Isidro', 'Buenos Aires', TRUE);

INSERT INTO usuarios (email, password_hash, tipo, empresa_id) VALUES
    ('constructora@test.com', 'hash_emp_1', 'EMPRESA', 1),
    ('logistica@test.com',    'hash_emp_2', 'EMPRESA', 2),
    ('alimentos@test.com',    'hash_emp_3', 'EMPRESA', 3),
    ('textil@test.com',       'hash_emp_4', 'EMPRESA', 4),
    ('servicios@test.com',    'hash_emp_5', 'EMPRESA', 5),
    ('distribuidora@test.com','hash_emp_6', 'EMPRESA', 6);

SELECT id, nombre FROM empresas ORDER BY id;
SELECT id, email, tipo, empresa_id FROM usuarios WHERE tipo = 'EMPRESA' ORDER BY id;

INSERT INTO establecimientos (
    empresa_id, nombre, direccion, localidad, provincia, activo
) VALUES (
    1, 'Obra San Isidro', 'Av. del Trabajo 123', 'San Isidro', 'Buenos Aires', TRUE
);

INSERT INTO tareas_empresa (empresa_id, nombre, activa)
VALUES (1, 'Carga', TRUE);


-- ============================================================================
-- ETAPA 4: CREAR 30 TRABAJADORES Y SUS USUARIOS
-- ============================================================================
-- Los triggers trg_crear_atraso_inicial crean automáticamente
-- un registro en atrasos por cada trabajador.
-- ============================================================================

INSERT INTO trabajadores (
    seccional_id, nombre, apellido, documento, telefono, activo,
    presente_hoy, presente_ayer, anotado
) VALUES
    (1, 'Juan',      'Pérez',      '30000001', '1145678901', TRUE, FALSE, FALSE, FALSE),
    (1, 'María',     'Gómez',      '30000002', '1145678902', TRUE, FALSE, FALSE, FALSE),
    (1, 'Carlos',    'López',      '30000003', '1145678903', TRUE, FALSE, FALSE, FALSE),
    (1, 'Ana',       'Martínez',   '30000004', '1145678904', TRUE, FALSE, FALSE, FALSE),
    (1, 'Pedro',     'Rodríguez',  '30000005', '1145678905', TRUE, FALSE, FALSE, FALSE),
    (1, 'Lucía',     'Fernández',  '30000006', '1145678906', TRUE, FALSE, FALSE, FALSE),
    (1, 'Diego',     'Sánchez',    '30000007', '1145678907', TRUE, FALSE, FALSE, FALSE),
    (1, 'Sofía',     'Ramírez',    '30000008', '1145678908', TRUE, FALSE, FALSE, FALSE),
    (1, 'Martín',    'Torres',     '30000009', '1145678909', TRUE, FALSE, FALSE, FALSE),
    (1, 'Valentina', 'Flores',     '30000010', '1145678910', TRUE, FALSE, FALSE, FALSE),
    (1, 'Jorge',     'Acosta',     '30000011', '1145678911', TRUE, FALSE, FALSE, FALSE),
    (1, 'Camila',    'Benítez',    '30000012', '1145678912', TRUE, FALSE, FALSE, FALSE),
    (1, 'Facundo',   'Herrera',    '30000013', '1145678913', TRUE, FALSE, FALSE, FALSE),
    (1, 'Julieta',   'Morales',    '30000014', '1145678914', TRUE, FALSE, FALSE, FALSE),
    (1, 'Nicolás',   'Ortiz',      '30000015', '1145678915', TRUE, FALSE, FALSE, FALSE),
    (1, 'Agustina',  'Silva',      '30000016', '1145678916', TRUE, FALSE, FALSE, FALSE),
    (1, 'Sebastián', 'Rojas',      '30000017', '1145678917', TRUE, FALSE, FALSE, FALSE),
    (1, 'Micaela',   'Medina',     '30000018', '1145678918', TRUE, FALSE, FALSE, FALSE),
    (1, 'Tomás',     'Suárez',     '30000019', '1145678919', TRUE, FALSE, FALSE, FALSE),
    (1, 'Florencia', 'Castro',     '30000020', '1145678920', TRUE, FALSE, FALSE, FALSE),
    (1, 'Matías',    'Vargas',     '30000021', '1145678921', TRUE, FALSE, FALSE, FALSE),
    (1, 'Rocío',     'Cabrera',    '30000022', '1145678922', TRUE, FALSE, FALSE, FALSE),
    (1, 'Gonzalo',   'Ríos',       '30000023', '1145678923', TRUE, FALSE, FALSE, FALSE),
    (1, 'Belén',     'Peralta',    '30000024', '1145678924', TRUE, FALSE, FALSE, FALSE),
    (1, 'Emiliano',  'Navarro',    '30000025', '1145678925', TRUE, FALSE, FALSE, FALSE),
    (1, 'Abril',     'Domínguez',  '30000026', '1145678926', TRUE, FALSE, FALSE, FALSE),
    (1, 'Ignacio',   'Vega',       '30000027', '1145678927', TRUE, FALSE, FALSE, FALSE),
    (1, 'Delfina',   'Luna',       '30000028', '1145678928', TRUE, FALSE, FALSE, FALSE),
    (1, 'Thiago',    'Paz',        '30000029', '1145678929', TRUE, FALSE, FALSE, FALSE),
    (1, 'Malena',    'Ríos',       '30000030', '1145678930', TRUE, FALSE, FALSE, FALSE);

INSERT INTO usuarios (email, password_hash, tipo, trabajador_id)
SELECT 
    LOWER(nombre) || '.' || LOWER(apellido) || '@test.com',
    'hash_trab_' || id,
    'TRABAJADOR',
    id
FROM trabajadores
WHERE seccional_id = 1
ORDER BY id;

SELECT COUNT(*) AS total_trabajadores FROM trabajadores;
SELECT COUNT(*) AS total_usuarios_trabajador FROM usuarios WHERE tipo = 'TRABAJADOR';
SELECT COUNT(*) AS total_atrasos FROM atrasos;


-- ============================================================================
-- ETAPA 5: CREAR LA LISTA DE ROTACIÓN
-- ============================================================================
-- Creamos 30 números y asignamos cada uno a un trabajador.
-- ============================================================================

INSERT INTO lista_rotacion (seccional_id, numero, trabajador_id, activo)
SELECT 
    1, 
    id, 
    id, 
    TRUE
FROM trabajadores
WHERE seccional_id = 1
ORDER BY id;

SELECT numero, trabajador_id FROM lista_rotacion WHERE seccional_id = 1 ORDER BY numero;


-- ============================================================================
-- ETAPA 6: SIMULAR ASISTENCIA
-- ============================================================================
-- Simulamos la asistencia de ayer (todos presentes) y hoy (todos presentes).
-- Al cerrar la asistencia de hoy, los triggers actualizan los flags.
-- ============================================================================

INSERT INTO asistencia (trabajador_id, fecha, presente, cerrado)
SELECT 
    t.id,
    CURRENT_DATE - 1,
    TRUE,
    TRUE
FROM trabajadores t
WHERE t.seccional_id = 1;

UPDATE trabajadores SET presente_ayer = TRUE WHERE seccional_id = 1;

INSERT INTO asistencia (trabajador_id, fecha, presente, cerrado)
SELECT 
    t.id,
    CURRENT_DATE,
    TRUE,
    FALSE
FROM trabajadores t
WHERE t.seccional_id = 1;

UPDATE trabajadores SET presente_hoy = TRUE WHERE seccional_id = 1;

UPDATE asistencia 
SET cerrado = TRUE 
WHERE fecha = CURRENT_DATE;

SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE presente_hoy = TRUE) AS con_presente_hoy,
    COUNT(*) FILTER (WHERE presente_ayer = TRUE) AS con_presente_ayer
FROM trabajadores
WHERE seccional_id = 1;


-- ============================================================================
-- ETAPA 7: CREAR Y PROCESAR UN PEDIDO
-- ============================================================================
-- Asignamos atrasos, sanciones e inhabilitaciones. Luego creamos un pedido
-- y designamos trabajadores. Los triggers descuentan atrasos automáticamente.
-- ============================================================================

UPDATE atrasos SET cantidad = 3, fecha_primer_atraso = CURRENT_TIMESTAMP - INTERVAL '10 days' WHERE trabajador_id = 1;
UPDATE atrasos SET cantidad = 2, fecha_primer_atraso = CURRENT_TIMESTAMP - INTERVAL '5 days'  WHERE trabajador_id = 2;
UPDATE atrasos SET cantidad = 1, fecha_primer_atraso = CURRENT_TIMESTAMP - INTERVAL '1 day'   WHERE trabajador_id = 6;

SELECT t.nombre, a.cantidad, a.fecha_primer_atraso
FROM atrasos a
JOIN trabajadores t ON a.trabajador_id = t.id
WHERE a.cantidad > 0
ORDER BY a.cantidad DESC;

INSERT INTO sanciones (trabajador_id, turnos_pendientes)
VALUES (5, 2);

SELECT t.nombre, s.turnos_pendientes
FROM sanciones s
JOIN trabajadores t ON s.trabajador_id = t.id
WHERE s.fecha_fin IS NULL;

INSERT INTO inhabilitaciones (trabajador_id, empresa_id)
VALUES (10, 1);

SELECT t.nombre, e.nombre AS empresa
FROM inhabilitaciones i
JOIN trabajadores t ON i.trabajador_id = t.id
JOIN empresas e ON i.empresa_id = e.id;

INSERT INTO pedidos (
    empresa_id, seccional_id, fecha, horario_inicio,
    cant_requerida, tarea_id, establecimiento_id, estado
) VALUES (
    1, 1, CURRENT_DATE + 1, '14:00',
    3, 1, 1, 'PENDIENTE'
) RETURNING id;

SELECT * FROM v_atrasados_elegibles WHERE seccional_id = 1;

INSERT INTO designaciones (pedido_id, trabajador_id, estado, horario_inicio, es_excepcional)
VALUES (1, 1, 'DESIGNADO', (CURRENT_DATE + TIME '14:00')::TIMESTAMP, FALSE);

INSERT INTO designaciones (pedido_id, trabajador_id, estado, horario_inicio, es_excepcional)
VALUES (1, 2, 'DESIGNADO', (CURRENT_DATE + TIME '14:00')::TIMESTAMP, FALSE);

INSERT INTO designaciones (pedido_id, trabajador_id, estado, horario_inicio, es_excepcional)
VALUES (1, 6, 'DESIGNADO', (CURRENT_DATE + TIME '14:00')::TIMESTAMP, FALSE);

SELECT trabajador_id, cantidad, fecha_primer_atraso FROM atrasos 
WHERE trabajador_id IN (1, 2, 6);

UPDATE pedidos SET estado = 'CUBIERTO' WHERE id = 1;
UPDATE cola_pedidos SET estado = 'PROCESADO' WHERE pedido_id = 1;

SELECT 
    p.id, e.nombre AS empresa, p.cant_requerida, p.estado,
    (SELECT COUNT(*) FROM designaciones WHERE pedido_id = p.id) AS designados
FROM pedidos p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.id = 1;

-- Verifica la excepción: un pedido para mañana antes de las 07:40 se procesa
-- inmediatamente y no debe incorporarse a la cola.
BEGIN;

DO $$
DECLARE
    v_pedido_id INTEGER;
BEGIN
    INSERT INTO pedidos (
        empresa_id, seccional_id, fecha, horario_inicio,
        cant_requerida, tarea_id, establecimiento_id, estado
    ) VALUES (
        1, 1, CURRENT_DATE + 1, TIME '07:39',
        1, 1, 1, 'PENDIENTE'
    )
    RETURNING id INTO v_pedido_id;

    IF EXISTS (
        SELECT 1
        FROM cola_pedidos
        WHERE pedido_id = v_pedido_id
    ) THEN
        RAISE EXCEPTION
            'El pedido para mañana antes de las 07:40 no debe enviarse a cola';
    END IF;
END;
$$;

ROLLBACK;


-- ============================================================================
-- ETAPA 8: VERIFICACIÓN FINAL
-- ============================================================================
-- Mostramos el estado final del sistema: designaciones, estado de trabajadores,
-- triggers e índices.
-- ============================================================================

SELECT 
    d.id, d.pedido_id, t.nombre || ' ' || t.apellido AS trabajador,
    d.estado, d.es_excepcional
FROM designaciones d
JOIN trabajadores t ON d.trabajador_id = t.id
ORDER BY d.id;

SELECT trabajador_id, nombre, apellido, numero_lista,
       presente_hoy, presente_ayer, anotado,
       atrasos_pendientes, sanciones_pendientes
FROM v_estado_trabajador
WHERE seccional_id = 1
ORDER BY trabajador_id
LIMIT 10;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

SELECT 
    tablename,
    COUNT(*) AS cantidad_indices
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- DEMO: VISTAS E ÍNDICES FUNCIONANDO
-- ============================================================================

-- ============================================================================
-- PARTE A: VISTAS
-- ============================================================================

-- A.1 Ver todas las vistas creadas
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- A.2 Ejecutar v_trabajadores_elegibles
SELECT 
    trabajador_id, nombre, apellido, numero_lista,
    atrasos_pendientes, sanciones_pendientes
FROM v_trabajadores_elegibles
WHERE seccional_id = 1
ORDER BY trabajador_id
LIMIT 10;

-- A.3 Ejecutar v_atrasados_elegibles
SELECT 
    trabajador_id, nombre, apellido, numero_lista,
    atrasos_pendientes, fecha_primer_atraso
FROM v_atrasados_elegibles
WHERE seccional_id = 1
ORDER BY atrasos_pendientes DESC, fecha_primer_atraso ASC;

-- A.4 Ejecutar v_rotacion_disponible
SELECT 
    trabajador_id, nombre, apellido, numero_lista
FROM v_rotacion_disponible
WHERE seccional_id = 1
ORDER BY numero_lista
LIMIT 10;

-- A.5 Contar por etapa excepcional
SELECT 'ETAPA 1: Pres hoy, Aus ayer' AS etapa, COUNT(*) AS total
FROM v_excepcional_etapa1 WHERE seccional_id = 1
UNION ALL
SELECT 'ETAPA 2: Sancionados', COUNT(*)
FROM v_excepcional_etapa2 WHERE seccional_id = 1
UNION ALL
SELECT 'ETAPA 3: Ausentes hoy', COUNT(*)
FROM v_excepcional_etapa3 WHERE seccional_id = 1;

-- A.6 Ejecutar v_estado_trabajador (vista de UI)
SELECT 
    trabajador_id, nombre, apellido, numero_lista,
    presente_hoy, presente_ayer, anotado,
    atrasos_pendientes, sanciones_pendientes, total_inhabilitaciones
FROM v_estado_trabajador
WHERE seccional_id = 1
ORDER BY trabajador_id
LIMIT 10;

-- A.7 Demostrar que la vista filtra (prueba de exclusión)
UPDATE trabajadores SET anotado = TRUE WHERE id = 15;

SELECT 'ANTES de anotar a Nicolás (15)' AS momento, COUNT(*) AS en_vista
FROM v_trabajadores_elegibles WHERE seccional_id = 1 AND trabajador_id = 15;

SELECT 'DESPUÉS de anotar a Nicolás (15)' AS momento, COUNT(*) AS en_vista
FROM v_trabajadores_elegibles WHERE seccional_id = 1 AND trabajador_id = 15;

UPDATE trabajadores SET anotado = FALSE WHERE id = 15;


-- ============================================================================
-- PARTE B: ÍNDICES
-- ============================================================================

-- B.1 Ver todos los índices creados
SELECT 
    tablename, indexname,
    CASE 
        WHEN indexdef LIKE '%WHERE%' THEN 'PARCIAL'
        ELSE 'NORMAL'
    END AS tipo
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
  AND indexname NOT LIKE '%_key'
ORDER BY tablename, indexname;

-- B.2 Contar índices por tabla
SELECT 
    tablename, COUNT(*) AS cantidad_indices
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY cantidad_indices DESC, tablename;

-- B.3 EXPLAIN: índice de trabajadores elegibles
EXPLAIN ANALYZE
SELECT trabajador_id, nombre, apellido
FROM v_trabajadores_elegibles
WHERE seccional_id = 1;

-- B.4 EXPLAIN: índice de atrasos
EXPLAIN ANALYZE
SELECT trabajador_id, cantidad, fecha_primer_atraso
FROM atrasos
WHERE cantidad > 0
ORDER BY cantidad DESC, fecha_primer_atraso ASC;

-- B.5 EXPLAIN: índice de email
EXPLAIN ANALYZE
SELECT id, tipo, seccional_id, empresa_id, trabajador_id
FROM usuarios
WHERE email = 'seccional1@uatr.org'
  AND activo = TRUE;

-- B.6 EXPLAIN: índice de designaciones activas
EXPLAIN ANALYZE
SELECT id, pedido_id, trabajador_id
FROM designaciones
WHERE trabajador_id = 1
  AND estado IN ('DESIGNADO', 'TRABAJANDO');

-- B.7 EXPLAIN: índice de lista ocupados
EXPLAIN ANALYZE
SELECT numero, trabajador_id
FROM lista_rotacion
WHERE seccional_id = 1
  AND trabajador_id IS NOT NULL
  AND activo = TRUE
ORDER BY numero;

-- B.8 Estadísticas de uso
SELECT 
    indexrelname AS index_name,
    idx_scan AS veces_usado,
    idx_tup_read AS filas_leidas
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 15;

-- B.9 Comparar con y sin índice
EXPLAIN ANALYZE
SELECT id AS trabajador_id, nombre, apellido
FROM trabajadores
WHERE seccional_id = 1
  AND presente_hoy = TRUE
  AND presente_ayer = TRUE
  AND anotado = FALSE
  AND activo = TRUE;

SET enable_indexscan = OFF;
EXPLAIN ANALYZE
SELECT id AS trabajador_id, nombre, apellido
FROM trabajadores
WHERE seccional_id = 1
  AND presente_hoy = TRUE
  AND presente_ayer = TRUE
  AND anotado = FALSE
  AND activo = TRUE;
SET enable_indexscan = ON;