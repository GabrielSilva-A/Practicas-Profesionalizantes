# Requerimientos Funcionales y No Funcionales

# Sistema Web de Gestión y Asignación de Personal Eventual para UATRE

**Versión:** 1.0  
**Estado:** Consolidado con Fase 4  
**Propósito:** Especificar el comportamiento funcional y no funcional requerido del sistema.

---

# 1. Propósito de este documento

Este documento contiene los requerimientos funcionales y no funcionales aprobados para el Sistema Web de Gestión y Asignación de Personal Eventual para UATRE.

Los requerimientos están organizados por **Actor + Funcionalidad**.

## Relación con otros documentos

- **business-rules.md** define CÓMO funciona el negocio (reglas del dominio).
- **requirements.md** define QUÉ DEBE HACER el sistema (funcionalidades concretas).

Antes de implementar, consultar ambos documentos.

---

# 2. Actores del sistema

1. **UATRE:** Personal autorizado de una seccional.
2. **Empresa:** Empresa afiliada que solicita personal.
3. **Trabajador:** Socio participante de la lista.

---

# 3. Requerimientos UATRE

## REQ-UATRE-001: Registrar seccional
- Número único, localidad, provincia, email, contraseña, cantidad de números
- Crear usuario SECCIONAL y lista de rotación inicial
- **UC asociado:** UC-UATRE-001 (Administrar seccional) ✅

## REQ-UATRE-002: Abrir asistencia
- Cuadrícula de números → estado (PRESENTE/AUSENTE/ANOTADO)
- Un toque = PRESENTE, pulsación sostenida = menú
- **UC asociado:** UC-UATRE-004 (Registrar asistencia y cierre) ✅

## REQ-UATRE-003: Cerrar asistencia
- Solamente después de 07:40 hs (Zona Argentina UTC-3)
- Todos los números deben estar verificados
- Triggers: sincroniza flags, descuenta atrasos, inicia motor
- **UC asociado:** UC-UATRE-004 (Registrar asistencia y cierre) ✅

## REQ-UATRE-004: Motor de nombramiento
- Procesa pedidos automáticamente
- Fase 1: Atrasados elegibles
- Fase 2: Rotación ordinaria
- Cobertura excepcional (3 etapas): **MANUAL** — el motor se detiene tras la
  rotación y UATRE autoriza cada etapa (D-06 consolidada)
- **UC asociado:** UC-UATRE-004 (Registrar asistencia y cierre) ✅ — se dispara automáticamente al cerrar asistencia; no tiene UC propio porque UATRE no lo invoca directamente

## REQ-UATRE-005: Override de rotación
- Definir manualmente el punto de inicio de rotación
- **UC asociado:** UC-UATRE-005 (Override de rotación) ✅

## REQ-UATRE-006: Inhabilitar/rehabilitar
- Inhabilitar trabajador para empresa específica
- Solo afecta futuras designaciones
- **UC asociado:** UC-UATRE-006 (Inhabilitar/Rehabilitar trabajador) ✅

## REQ-UATRE-007: Aplicar sanción
- Cantidad de turnos, motivo opcional
- Bloquea designación hasta completar sanción
- **UC asociado:** UC-UATRE-007 (Aplicar sanción) ✅
- **Nota:** el esquema real no contempla campo de motivo (ver RN-159 corregida); "motivo opcional" aquí queda obsoleto

## REQ-UATRE-008: Ver pizarrón actual
- Pedidos en curso: empresa, cantidad, estado, designados
- **UC asociado:** UC-UATRE-008 (Ver pizarrón actual) ✅ — remite a UC-TRABAJADOR-002 (pizarrón unificado)

## REQ-UATRE-009: Historial de pizarrón
- Consultar pizarrón de fechas anteriores
- **UC asociado:** UC-UATRE-009 (Historial de pizarrón) ✅

## REQ-UATRE-010: Registrar empresa
- Nombre, localidad, provincia y email; la seccional se obtiene de la sesión.
- El sistema genera una contraseña temporal y UATRE entrega las credenciales
  usando el email como identificador. La empresa debe cambiarla obligatoriamente
  en su primer acceso.
- **UC asociado:** UC-UATRE-003 (Gestionar empresas) ✅
- **Nota:** este alta manual por UATRE coexiste con el autoregistro de la empresa descripto en RN-003/RN-139 (business-rules.md). Ambas vías son válidas.

## REQ-UATRE-011: Registrar trabajador
- Nombre, apellido, documento, teléfono, número de lista, email, contraseña
- Valida documento y email únicos global
- Crea registro en ATRASOS inicialmente
- **UC asociado:** UC-UATRE-002 (Registrar nuevo trabajador en la seccional) ✅

## REQ-UATRE-012: Liberar número
- Marca trabajador_id = NULL, activo = FALSE
- Número inactivo no entra en rotaciones futuras
- Desactiva al trabajador y su usuario, conserva identidad e historial, y
  reinicia atrasos y sanciones pendientes.
- Rechaza la liberación si el trabajador tiene una designación o trabajo activo.
- La misma identidad puede reactivarse sobre un número libre elegido por UATRE,
  conservando su contraseña anterior.
- **UC asociado:** UC-UATRE-001 (Administrar seccional) ✅

## REQ-UATRE-013: Override puntual de asignación
- UATRE reemplaza manualmente al trabajador designado dentro de un pedido
- Aplica +1 turno de sanción al trabajador reemplazado, conforme a RN-083 y decisión aprobada por el usuario. No aplicar por analogía los efectos de cancelación del pedido (RN-074).
- Sin auditoría específica del override (RN-128); el historial conserva únicamente el resultado final resumido del pedido (RN-165)
- **UC asociado:** UC-UATRE-010 (Override puntual de asignación) ✅
- **Nota:** requerimiento agregado en esta actualización para cubrir RN-126, que no tenía REQ ni UC asignado previamente

## REQ-UATRE-014: Ajustar cantidad de números
- UATRE ajusta la cantidad de números de su propia seccional.
- Al reducir, rechaza si existen números ocupados o si el punto de rotación queda
  fuera del nuevo rango; no reasigna trabajadores ni ajusta el punto automáticamente.
- Conserva filas históricas: desactiva los números libres fuera del nuevo límite.
- **UC asociado:** UC-UATRE-001 (Administrar seccional) ✅

---

# 4. Requerimientos EMPRESA

## REQ-EMPRESA-001: Crear pedido
- Fecha, horario, cantidad, tarea, establecimiento
- Sistema decide cola vs inmediato (RN-063)
- **UC asociado:** UC-EMPRESA-001 (Crear pedido de trabajadores) ✅

## REQ-EMPRESA-002: Modificar pedido
- Solo si sin designaciones previas
- Puede cambiar: cantidad, horario, tarea
- **UC asociado:** UC-EMPRESA-003 (Modificar o eliminar pedido) ✅

## REQ-EMPRESA-003: Cancelar pedido
- Antes de horario_inicio
- Cancela designaciones, devuelve atrasos, compensa +1
- **UC asociado:** UC-EMPRESA-003 (Modificar o eliminar pedido) ✅

## REQ-EMPRESA-004: Consultar estado
- Ver estado pedido (PENDIENTE, EN_PROCESO, COMPLETADO)
- NO ver identidad de trabajadores ni números
- **UC asociado:** UC-EMPRESA-002 (Ver estado del pedido) ✅
- **UC asociado:** UC-EMPRESA-004 (Ver historial de pedidos propios) ✅ — amplía la consulta a pedidos de jornadas cerradas
- **⚠️ D-27 (PENDIENTE DE DISEÑO):** la lista de estados visibles aún no fue
  confirmada; verificar contra `decisiones-pendientes.md` antes de implementar.

---

# 5. Requerimientos TRABAJADOR

## REQ-TRABAJADOR-001: Consultar estado
- Número, asistencia, anotado/sancionado/atrasado, designación vigente
- **UC asociado:** UC-TRABAJADOR-007 (Consultar estado personal) ✅

## REQ-TRABAJADOR-002: Marcar ANOTARME
- Si: no designado, no trabajando, sin sanciones
- **UC asociado:** UC-TRABAJADOR-005 (Solicitar ANOTADO [indisponibilidad]) ✅

## REQ-TRABAJADOR-003: Marcar LIBERAR
- Si: está ANOTADO
- **UC asociado:** UC-TRABAJADOR-006 (Liberar ANOTADO) ✅

## REQ-TRABAJADOR-004: Ver pizarrón actual
- Pedidos del día, empresa, tarea, horario, establecimiento
- **UC asociado:** UC-TRABAJADOR-002 (Ver pizarrón) ✅
- **Nota (corrección de trazabilidad):** UC-TRABAJADOR-002 citaba erróneamente "REQ-TRABAJADOR-002" (que corresponde a Marcar ANOTARME); se corrigió a este REQ-TRABAJADOR-004

## REQ-TRABAJADOR-005: Ver historial pizarrón
- Pizarrones de fechas anteriores
- **UC asociado:** UC-TRABAJADOR-009 (Ver historial de pizarrón) ✅

## REQ-TRABAJADOR-006: Ver historial designaciones
- Histórico de trabajos realizados
- **UC asociado:** UC-TRABAJADOR-003 (Ver historial de designaciones) ✅

## REQ-TRABAJADOR-007: Finalizar trabajo
- Si: está TRABAJANDO
- Marca FINALIZADO, calcula duración real
- **UC asociado:** UC-TRABAJADOR-004 (Indicar fin de jornada) ✅

---

# 6. Requerimientos del SISTEMA

## REQ-SISTEMA-001: DESIGNADO → TRABAJANDO
- Al alcanzar horario_inicio: cambio automático de estado
- Trigger: calcula horario_fin = horario_inicio + 12h
- **Sin actor humano directo.** Documentado como flujo automático dentro de UC-TRABAJADOR-004 (Indicar fin de jornada)

## REQ-SISTEMA-002: Liberación automática 12h
- Al cumplir 12h: marca FINALIZADO si no fue marcado manualmente
- **Sin actor humano directo.** Documentado como flujo automático dentro de UC-TRABAJADOR-004 (Indicar fin de jornada)

## REQ-SISTEMA-003: Renovación pizarrón 00:00
- Pedidos completados salen del pizarrón
- Pedidos sin cubrir se transfieren al nuevo día
- **Sin actor humano directo.** Documentado como flujo automático dentro de UC-TRABAJADOR-002 (Ver pizarrón) y UC-UATRE-008 (Ver pizarrón actual)
- **⚠️ D-09 (PENDIENTE DE DISEÑO):** el vencimiento/transferencia de pedidos
  sin cubrir requiere confirmación; verificar `decisiones-pendientes.md`.

## REQ-SISTEMA-004: Procesar cola FIFO
- Al cerrar asistencia o en job programado
- Procesa cola_pedidos ordenados por fecha_procesamiento_programado
- **Sin actor humano directo.** Documentado como flujo automático dentro de UC-UATRE-004 (Registrar asistencia y cierre)
- **UC asociado:** UC-EMPRESA-001 (Crear pedido de trabajadores) ✅ — define el encolamiento de los pedidos que el proceso automático consume

---

## REQ-SISTEMA-005: Pizarron muestra lista completa de socios disponibles
- Pizarron seccional muestra lista COMPLETA de numeros disponibles (no solo cantidad)
- Basado en v_trabajadores_elegibles (presente_hoy=TRUE, presente_ayer=TRUE, anotado=FALSE, sin sanciones)
- Actualiza cada 30 segundos
- Se congela despues de cierre asistencia (07:40)
- **UC asociado:** UC-TRABAJADOR-002 (Ver pizarrón) ✅ — ya referenciado en ese documento
- **⚠️ D-15 (PENDIENTE DE DISEÑO):** congelar vs. mantener dinámico el
  pizarrón después del cierre; verificar `decisiones-pendientes.md`.

---

# 7. Requerimientos No Funcionales

- **RNF-001 Seguridad:** Email único global, contraseñas hasheadas, HTTPS
- **RNF-002 Integridad:** Transacciones ACID, índices, CHECKs
- **RNF-003 Rendimiento:** Motor procesa 10+ pedidos/min, índices optimizados
- **RNF-004 Disponibilidad:** Backup diario, operativo 06:00-18:00 Argentina
- **RNF-005 Usabilidad:** Cuadrícula responde < 1 seg, interfaz intuitiva
- **RNF-006 Escalabilidad:** Diseño para N seccionales, sin duplicación datos

---

Versión 1.0 — Consolidado con cuestionario diagnóstico
