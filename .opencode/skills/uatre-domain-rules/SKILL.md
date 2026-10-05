---
name: uatre-domain-rules
description: >
  Reglas de negocio vigentes del sistema UATRE: lista de socios, rotación
  circular, asistencia, ANOTADO, atrasos, sanciones, inhabilitaciones,
  pedidos, designaciones y cancelaciones. Usar cuando una tarea implique
  decidir elegibilidad, prioridad, cobertura o estados operativos. NO usar
  para contratos HTTP ni para esquema SQL; consultar las skills específicas.
---

# Reglas de dominio UATRE

## Fuente de verdad
`docs/business-rules.md` es la fuente principal. `docs/requirements.md`
traduce reglas a requerimientos. `docs/uc-*.md` describe interacciones.

## Principios irrenunciables
- Única lista de socios por seccional; orden numérico fijo.
- Rotación circular desde `seccionales.punto_rotacion`.
- Atrasados se evalúan antes de la rotación ordinaria, ordenados por
  cantidad DESC y fecha_primer_atraso ASC (RN-103, RN-104).
- ANOTADO prevalece temporalmente sobre ATRASADO (RN-036).
- Sanción por turnos prevalece sobre prioridad de atraso (RN-045).
- Habilitación por excepción: todos habilitados salvo inhabilitación
  registrada (RN-048, RN-160).
- Condiciones coexisten; no representar como estado único excluyente.
- Cobertura excepcional es manual; el motor automático se detiene tras
  rotación ordinaria (D-06, RN-086 a RN-090).
- Cancelación antes del inicio devuelve 1 atraso si se consumió (RN-074).
- Reemplazo manual aplica 1 turno de sanción al reemplazado (RN-083,
  RN-126).

## Flujo de elegibilidad (resumen)
1. ¿Número ocupado y activo?
2. ¿Presente hoy Y presente ayer? (última jornada cerrada)
3. ¿ANOTADO? → excluir.
4. ¿Sanción pendiente? → excluir de Fase 1 y 2.
5. ¿Atrasos pendientes? → prioridad Fase 1.
6. ¿Inhabilitado para la empresa? → excluir.
7. ¿DESIGNADO o TRABAJANDO? → excluir.

## Advertencias
- `BD/bd_uatre.sql` conserva cobertura excepcional automática en
  `fn_ejecutar_motor`; contradice D-06. NO implementar esa lógica hasta
  consolidar.
- A-28 resuelta: `trg_reset_presente_hoy` ya no figura en la documentación
  ni existe en el SQL; los flags se sincronizan solo al cierre.
- `REQ-SISTEMA-005` (pizarrón congelado) difiere de D-15 (pizarrón
  dinámico); D-15 está consolidada y el requerimiento está señalizado sin
  reescribir.