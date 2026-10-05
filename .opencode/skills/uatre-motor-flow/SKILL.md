---
name: uatre-motor-flow
description: >
  Flujo de asignación del motor de nombramiento: atrasados, rotación
  ordinaria y cobertura excepcional manual. Usar cuando se implemente,
  pruebe o revise la lógica de designación, o cuando se necesite entender
  la prioridad de asignación. NO usar para reglas de negocio generales ni
  para esquema SQL.
---

# Motor de nombramiento UATRE

## Fuente de verdad
`docs/diagrama-motor.md` describe el flujo. `docs/business-rules.md`
secciones 21 a 23 contienen las reglas. `BD/bd_uatre.sql` contiene
la implementación actual.

## Fases vigentes (según D-06 y RN-086 a RN-090)
1. **Atrasados elegibles**: presentes hoy y ayer, sin sanciones, sin
   inhabilitación, ordenados por cantidad DESC y fecha ASC.
2. **Rotación ordinaria circular**: desde `punto_rotacion`, evalúa cada
   número, salta libres, aplica efectos de inhabilitación y ocupación.
3. **Cobertura excepcional MANUAL**: UATRE interviene. No automática.
   - Etapa 1: presentes hoy, ausentes ayer, sin sanciones ni atrasos.
   - Etapa 2: sancionados presentes hoy; no descuenta sanción.
   - Etapa 3: ausentes hoy; agrega +1 turno de sanción.

## Punto de rotación
- Solo la rotación ordinaria modifica `punto_rotacion` (RN-148).
- Atrasados y cobertura excepcional no lo modifican.
- Override manual de UATRE puede redefinirlo (RN-143).

## Advertencias
- El SQL actual de `fn_ejecutar_motor` ejecuta las 3 etapas
  excepcionales automáticamente. Eso contradice D-06. El motor
  automático debe detenerse tras la rotación ordinaria; la cobertura
  excepcional debe ser una operación separada invocada por UATRE.
- `diagrama-motor.md` omite efectos de ANOTADO y sanciones en algunos
  filtros; contrastar con RN-034, RN-041 y el SQL.