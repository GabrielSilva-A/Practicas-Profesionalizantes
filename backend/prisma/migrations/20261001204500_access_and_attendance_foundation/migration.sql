-- Decisiones A-06, A-23 y A-28.
-- Las filas existentes conservan acceso normal y asistencia no verificada hasta
-- que el modulo de asistencia gestione explicitamente la jornada.
ALTER TABLE usuarios
    ADD COLUMN primera_vez_login BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE asistencia
    ADD COLUMN verificado BOOLEAN NOT NULL DEFAULT FALSE;

-- Abrir una jornada no debe alterar flags operativos. Estos se sincronizan
-- exclusivamente durante el cierre transaccional de asistencia.
DROP TRIGGER IF EXISTS trg_reset_presente_hoy ON asistencia;
DROP FUNCTION IF EXISTS fn_reset_presente_hoy();
