# Diagrama Cola vs Inmediato

# Sistema Web de Gestión y Asignación de Personal Eventual para UATRE

**Propósito:** Mostrar árbol de decisión para procesar pedidos.

**Reglas:** RN-063, RN-064, RN-065

---

## Árbol de decisión

PEDIDO CREADO
├─ ¿fecha_pedido = HOY?
│  ├─ NO
│  │  ├─ ¿fecha_pedido = MAÑANA y horario_pedido < 07:40?
│  │  │  ├─ SÍ
│  │  │  │  └─ PROCESAR INMEDIATO
│  │  │  │     Razón: El ingreso es anterior a la próxima actualización de su jornada
│  │  │  │
│  │  │  └─ NO
│  │  │     └─ ENVIAR A COLA
│  │  │        Razón: Asistencia de esa fecha no existe aún
│  │
│  └─ SÍ (fecha = HOY)
│     ├─ ¿ya pasó 07:40?
│     │  ├─ SÍ
│     │  │  └─ PROCESAR INMEDIATO
│     │  │     Razón: Cierre ya ocurrió, estado válido
│     │  │
│     │  └─ NO
│     │     ├─ ¿horario_pedido < 07:40?
│     │     │  ├─ SÍ
│     │     │  │  └─ PROCESAR INMEDIATO
│     │     │  │     Razón: Comienza antes del cierre
│     │     │  │
│     │     │  └─ NO (horario >= 07:40)
│     │     │     └─ ENVIAR A COLA
│     │     │        Razón: Comienza después del cierre

---

## 5 Casos de ejemplo

### Caso 1: Pedido mañana 08:00
- Hora actual: Hoy 06:30
- Decisión: COLA
- Razón: Ingreso posterior a la actualización de mañana

### Caso 2: Hoy 14:00, hora actual 09:00
- Hora actual: Hoy 09:00 (ya pasó 07:40)
- Decisión: INMEDIATO
- Razón: Cierre ya ocurrió

### Caso 3: Hoy 08:00, hora actual 06:30
- Hora actual: Hoy 06:30 (antes de 07:40)
- Horario: 08:00 (después de 07:40)
- Decisión: COLA
- Razón: Comienza después del cierre

### Caso 4: Hoy 05:00, hora actual 06:30
- Horario: 05:00 (antes de 07:40)
- Decisión: INMEDIATO
- Razón: Comienza antes del cierre

### Caso 5: Pedido mañana 07:00
- Hora actual: Hoy 09:00
- Horario: 07:00 (antes de la próxima actualización de mañana, 07:40)
- Decisión: INMEDIATO
- Razón: Comienza antes de la próxima actualización de su jornada

---

**Versión:** 1.1
**Fecha:** 2026-09-30
**Referencias:** RN-063, RN-064, RN-065
