# Diagrama Motor de Nombramiento — Flujo de asignación

# Sistema Web de Gestión y Asignación de Personal Eventual para UATRE

**Propósito:** Mostrar cómo el motor asigna automáticamente trabajadores a pedidos.

**Reglas:** RN-077 a RN-092, RN-101 a RN-114

**Función:** fn_ejecutar_motor(pedido_id)

> ⚠️ **Avisos de consolidación:**
> - **D-06:** la cobertura excepcional es **manual** — el motor SQL actual
>   aún la ejecuta automáticamente (bloqueador en `execution-plan.md`); el
>   flujo correcto se detiene tras la rotación ordinaria y UATRE autoriza
>   las etapas.
> - **C-04 (abierta):** este diagrama omite ANOTADO y sanciones; rediseñar
>   antes de usarlo como especificación.

---

## Flujo del Motor (fases automáticas)

```
ENTRADA: pedido_id, cantidad_requerida

INICIALIZACIÓN:
  v_faltan = cantidad_requerida
  v_ya_designados = COUNT(designaciones activas para este pedido)
  v_faltan = v_faltan - v_ya_designados
  
  IF v_faltan <= 0 THEN
    RETURN (pedido ya está cubierto)
  END IF

═══════════════════════════════════════════════════════════════

FASE 1: ATRASADOS ELEGIBLES (RN-077, RN-101, RN-105)
───────────────────────────────────────────────────────────

Consulta: SELECT * FROM v_atrasados_elegibles
Filtros:
  ✓ presente_hoy = TRUE
  ✓ presente_ayer = TRUE
  ✓ anotado = FALSE
  ✓ sanciones_pendientes = 0
  ✓ atrasos_pendientes > 0
  ✓ NO habilitado para empresa (si existe) → SALTAR
  ✓ NO designado/trabajando → SALTAR

Ordenamiento (RN-103, RN-104):
  1° ORDER BY atrasos_pendientes DESC (mayor cantidad primero)
  2° ORDER BY fecha_primer_atraso ASC (más antiguo primero)

Acción:
  PARA CADA trabajador HACER
    IF v_faltan <= 0 THEN BREAK
    INSERT designaciones (pedido_id, trabajador_id, estado='DESIGNADO')
    ├─ Trigger 5: descontar 1 atraso automáticamente
    v_faltan = v_faltan - 1

IF v_faltan <= 0 THEN
  RETURN (pedido cubierto por atrasados)
END IF

═══════════════════════════════════════════════════════════════

FASE 2: ROTACIÓN ORDINARIA (RN-011 a RN-014, RN-028)
──────────────────────────────────────────────────────

Inicio: punto_rotacion de la seccional
Recorrido: Circular (1, 2, 3, ..., N, 1, 2, ...)

PARA CADA número EN la lista HACER
  SELECT trabajador_id FROM lista_rotacion WHERE numero = v_numero_actual
  
  VALIDAR:
    ✓ trabajador_id IS NOT NULL (número ocupado, no libre)
    ✓ presente_hoy = TRUE
    ✓ presente_ayer = TRUE
    ✓ anotado = FALSE
    ✓ sanciones_pendientes = 0
    ✓ NO habilitado para empresa → agregar 1 atraso, CONTINUAR
    ✓ NO designado/trabajando → CONTINUAR
    ✓ NO tiene atrasos pendientes → CONTINUAR

  SI TODAS las condiciones se cumplen ENTONCES
    INSERT designaciones (pedido_id, trabajador_id)
    ├─ Trigger 5: descontar 1 atraso (si tenía)
    UPDATE seccionales SET punto_rotacion = v_numero_actual + 1
    v_faltan = v_faltan - 1
  FIN SI
  
  v_numero_actual = v_numero_actual + 1
  IF v_numero_actual > cantidad_numeros THEN
    v_numero_actual = 1  (vuelta circular)
  END IF

IF v_faltan <= 0 THEN
  RETURN (pedido cubierto por rotación)
END IF

═══════════════════════════════════════════════════════════════

FASE 3: COBERTURA EXCEPCIONAL (RN-086 a RN-090)
────────────────────────────────────────────────

ETAPA 1: Presentes hoy, ausentes ayer (RN-088)
───────────────────────────────────────────────
Consulta: v_excepcional_etapa1
Filtros:
  ✓ presente_hoy = TRUE
  ✓ presente_ayer = FALSE
  ✓ anotado = FALSE
  ✓ sanciones = 0
  ✓ atrasos = 0
  ✓ habilitado para empresa

Acción:
  PARA CADA trabajador HACER
    IF v_faltan <= 0 THEN BREAK
    INSERT designaciones (pedido_id, trabajador_id, es_excepcional=TRUE)
    v_faltan = v_faltan - 1

IF v_faltan <= 0 THEN RETURN (cubierto)

ETAPA 2: Sancionados presentes hoy (RN-089)
────────────────────────────────────────────
Consulta: v_excepcional_etapa2
Filtros:
  ✓ presente_hoy = TRUE
  ✓ sanciones_pendientes > 0
  ✓ anotado = FALSE
  ✓ habilitado para empresa
  
NOTA: NO se descuenta sanción al designar en esta etapa

Acción:
  PARA CADA trabajador HACER
    IF v_faltan <= 0 THEN BREAK
    INSERT designaciones (pedido_id, trabajador_id, es_excepcional=TRUE)
    v_faltan = v_faltan - 1

IF v_faltan <= 0 THEN RETURN (cubierto)

ETAPA 3: Ausentes hoy (RN-090)
───────────────────────────────
Consulta: v_excepcional_etapa3
Filtros:
  ✓ presente_hoy = FALSE
  ✓ anotado = FALSE
  ✓ habilitado para empresa

Acción:
  PARA CADA trabajador HACER
    IF v_faltan <= 0 THEN BREAK
    INSERT designaciones (pedido_id, trabajador_id, es_excepcional=TRUE)
    ├─ INSERT sanciones: +1 turno de sanción (NUEVA sanción o agregar)
    v_faltan = v_faltan - 1

═══════════════════════════════════════════════════════════════

FINALIZACIÓN:
─────────────

IF v_faltan <= 0 THEN
  UPDATE pedidos SET estado = 'CUBIERTO' WHERE id = pedido_id
ELSE
  UPDATE pedidos SET estado = 'NO_CUBIERTO' WHERE id = pedido_id
END IF

RETURN (Pedido procesado)
```

---

## Matriz de condiciones por fase

| Condición | Atrasados | Rotación | Exc. Etapa 1 | Exc. Etapa 2 | Exc. Etapa 3 |
|-----------|-----------|----------|--------------|--------------|--------------|
| presente_hoy | ✓ | ✓ | ✓ | ✓ | ✗ |
| presente_ayer | ✓ | ✓ | ✗ | ✗ | — |
| anotado | ✗ | ✗ | ✗ | ✗ | ✗ |
| sanciones | ✗ | ✗ | ✗ | ✓ | — |
| atrasos | ✓ | ✗ | ✗ | — | — |
| habilitado | ✓ | ✓ | ✓ | ✓ | ✓ |
| orden | Desc atrasos | Circular | Número | Número | Número |

Legend: ✓=Requerido ✗=No permitido —=Indiferente

---

## Ejemplo de ejecución

```
ENTRADA:
  pedido_id: 5
  cant_requerida: 3
  seccional_id: 1

ESTADO INICIAL:
  punto_rotacion: 5
  
ETAPA 1: Atrasados
─────────────────
  v_atrasados_elegibles con sanciones=0:
    → Trabajador 8 (3 atrasos)
    → Trabajador 12 (1 atraso)
  
  Designa: 8
  v_faltan: 3 - 1 = 2
  Designa: 12
  v_faltan: 2 - 1 = 1
  No hay más atrasados sin sanciones
  
ETAPA 2: Rotación
────────────────
  Comienza en número 5
  
  Número 5: Trabajador 10 (presente_hoy=T, presente_ayer=T, sin sanciones)
  → Designa
  v_faltan: 1 - 1 = 0
  
SALIDA:
  Estado: CUBIERTO
  Designaciones creadas: 3
    ├─ Trabajador 8 (Atrasado)
    ├─ Trabajador 12 (Atrasado)
    └─ Trabajador 10 (Rotación ordinaria)
  Nueva punto_rotacion: 6
```

---

## Reglas de transición y prioridades

```
Prioridad 1: ATRASADOS elegibles
  └─ Bloquean ROTACIÓN ordinaria
  └─ Se ordenan por atrasos DESC, fecha ASC

Prioridad 2: ROTACIÓN ordinaria
  └─ Recorre lista circular
  └─ Salta números libres
  └─ Genera ATRASOS si no cumple condiciones

Prioridad 3: COBERTURA excepcional
  └─ Etapa 1: Presentes hoy, ausentes ayer
  └─ Etapa 2: Sancionados presentes hoy
  └─ Etapa 3: Ausentes hoy (agregando +1 sanción)

Consecuencia: Si tiene atrasos Y sanción → sanción bloquea temporalmente

Liberación: Al terminar sanción (turnos_pendientes = 0) → vuelve a usar prioridad
```

---

**Versión:** 1.0
**Fecha:** 2026-09-17
**Referencias:** RN-077 a RN-092, RN-101 a RN-114, REQ-UATRE-004, BD/bd_uatre.sql
