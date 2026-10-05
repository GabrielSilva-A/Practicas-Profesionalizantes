# CASOS DE USO — ACTOR: EMPRESA

**Versión:** 1.0  
**Última actualización:** 2026-09-22  
**Estado:** Fase 4 - Documentación de casos de uso completa (UC-EMPRESA-001 a 004)

---

## RESTRICCIONES Y CONFIDENCIALIDAD PARA EMPRESA

### Lo que EMPRESA NO puede ver:

❌ Números de trabajadores  
❌ Identidad de trabajadores asignados  
❌ Criterios de selección/rotación  
❌ Información interna de la seccional  
❌ Detalles operativos de nombramiento  

### Lo que EMPRESA PUEDE hacer:

✅ Crear pedidos de trabajadores  
✅ Modificar pedidos (si no fueron procesados)  
✅ Eliminar pedidos (si no fueron procesados)  
✅ Ver estado de sus pedidos  
✅ Ver historial de pedidos  
✅ Ver la falta de cobertura en el estado del pedido  

### Si NO hay cobertura:

- El pedido queda con estado `NO_CUBIERTO`, visible en "Mis pedidos"
- La empresa lo consulta en el detalle del pedido (D-26 consolidada: **no se
  envían notificaciones en esta etapa**; las faltas de cobertura se muestran
  exclusivamente en las vistas correspondientes)
- Empresa debe llamar manualmente a responsables de nombramiento
- Sin acceso a información detallada de por qué no hay cobertura

---

## UC-EMPRESA-001: CREAR PEDIDO DE TRABAJADORES

**Identificador:** UC-EMPRESA-001  
**Nombre:** Crear pedido de trabajadores  
**Tipo:** CRITICAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Empresa crea una solicitud de personal eventual indicando cantidad, fecha, horario, tarea y establecimiento. El sistema determina automáticamente si el pedido se procesa de inmediato o se envía a la cola, según el árbol de decisión de RN-063.

### Precondiciones:

1. Empresa autenticada (usuario tipo EMPRESA)
2. Empresa activa
3. Sistema disponible

### Flujo principal:

1. Empresa accede a "Crear pedido"
2. Sistema muestra formulario con campos:
   - Fecha
   - Horario de inicio
   - Cantidad requerida
   - Tipo de tarea
   - Establecimiento (si la empresa tiene múltiples direcciones registradas, RN-053)
3. Empresa completa el formulario y confirma
4. Sistema valida la información mínima obligatoria (RN-058): empresa, fecha, horario, cantidad, tarea y establecimiento cuando corresponde
5. Sistema ejecuta `INSERT INTO pedidos (..., estado = 'PENDIENTE')`
6. Sistema evalúa el árbol de decisión de procesamiento (RN-063):
   - **Si corresponde procesamiento INMEDIATO:** dispara el motor de nombramiento sobre el estado válido actual de la lista; el pedido pasa a `EN_PROCESO` y luego a `CUBIERTO`/`NO_CUBIERTO` según el resultado
   - **Si corresponde ENVIAR A COLA:** `INSERT INTO cola_pedidos` con `fecha_procesamiento_programado` y `orden` (FIFO por momento de creación, RN-067); el pedido queda `PENDIENTE` hasta el próximo cierre de asistencia (REQ-SISTEMA-004)
7. Sistema confirma la creación del pedido a la empresa, mostrando únicamente el estado resultante (sin exponer lógica interna de cola/motor)
8. Si el procesamiento (inmediato o en cola) finaliza sin cubrir la cantidad solicitada, el pedido queda en `NO_CUBIERTO` y la empresa lo ve en el estado de su pedido (sin notificación: D-26 consolidada)

### Flujos alternativos:

- FA-1: Campos obligatorios incompletos → "Completá todos los campos requeridos"
- FA-2: Cantidad requerida ≤ 0 → "La cantidad debe ser mayor a 0"
- FA-3: Fecha/horario inválido (ej. fecha pasada) → "Fecha u horario inválido"
- FA-4: Error de BD al crear el pedido → pedido no creado, mensaje de error genérico
- FA-5: Sin cobertura tras el procesamiento → pedido en `NO_CUBIERTO`, visible en el estado; sin notificación (D-26) y sin acceso a detalle de por qué no hubo cobertura

### Postcondiciones:

**Si exitoso:**
- Pedido creado en PEDIDOS con estado inicial `PENDIENTE`
- Según RN-063: procesado inmediatamente (pudiendo terminar `EN_PROCESO`, `CUBIERTO` o `NO_CUBIERTO`) o encolado en COLA_PEDIDOS
- Empresa recibe confirmación de creación
- Si no hay cobertura, el pedido queda visible en `NO_CUBIERTO` para la empresa (sin notificación, D-26)

**Si falla:**
- Pedido NO creado
- Empresa permanece en el formulario con el error mostrado

### Restricciones de confidencialidad:

- La empresa no ve identidad, números ni criterios de selección de trabajadores en ningún momento del flujo (ver sección "Restricciones y confidencialidad" de este documento)

### Reglas de negocio asociadas:

- RN-053: Pedido con múltiples establecimientos
- RN-057: Creación de pedidos (solo empresas pueden crear pedidos)
- RN-058: Información mínima
- RN-059: Tipos temporales de pedido (programado / inmediato)
- RN-060: Pedido inmediato
- RN-061: Pedido programado
- RN-062: Estado válido de la lista
- RN-063: Decisión de procesamiento (lógica completa)
- RN-067: Orden entre pedidos habilitados simultáneamente (FIFO)

### Requerimientos asociados:

- REQ-EMPRESA-001: Crear pedido

### Flujo automático del sistema asociado (sin actor humano directo):

- REQ-SISTEMA-004: Procesar cola FIFO — al cerrar asistencia o en job programado, procesa `cola_pedidos` ordenados por `fecha_procesamiento_programado`

---

## UC-EMPRESA-002: VER ESTADO DEL PEDIDO

**Identificador:** UC-EMPRESA-002  
**Nombre:** Ver estado del pedido  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Empresa consulta el estado actual de sus pedidos (cantidad solicitada vs. asignada), sin acceso a información operativa interna de la seccional.

### Precondiciones:

1. Empresa autenticada (usuario tipo EMPRESA)
2. Empresa tiene al menos un pedido creado (UC-EMPRESA-001)

### Flujo principal:

1. Empresa accede a "Mis pedidos"
2. Sistema consulta PEDIDOS filtrando por `empresa_id`
3. Sistema muestra, por cada pedido activo:
   - Cantidad solicitada (`cant_requerida`)
   - Cantidad asignada (`cantidad_designados`, solo el número)
   - Estado visible para la empresa:
     - `PENDIENTE` / `EN_PROCESO` → "En proceso"
     - `CUBIERTO` / `COMPLETO` → "Completo"
     - `NO_CUBIERTO` → "Sin cobertura" (estado visible en la lista; sin alerta, D-26)
     - `CANCELADO` → "Cancelado" (RN-146)
     
     > ⚠️ **Señalización D-27 (pendiente de propagar):** la decisión D-27
     > (CONSOLIDADA en `decisiones-pendientes.md`) define que la empresa ve
     > Pendiente, En proceso, Completo, Sin cobertura y Cancelado; REQ-EMPRESA-004
     > aún menciona `COMPLETADO`, que no es un estado persistido. Resolver la
     > equivalencia de estados antes de implementar UC-EMPRESA-002.
4. Empresa puede seleccionar un pedido para ver el detalle (fecha, horario, tarea, establecimiento)

### Flujos alternativos:

- FA-1: Sin pedidos creados → "No tenés pedidos registrados"
- FA-2: Error de BD → mensaje de error genérico, opción de reintentar

### Postcondiciones:

**Si exitoso:**
- Estado(s) del pedido mostrado(s) correctamente
- No se modifica ningún dato (consulta de solo lectura)

**Si falla:**
- Error mostrado, sin datos parciales incorrectos

### Información visible:

- Cantidad solicitada
- Cantidad asignada
- Estado del pedido

### Información NO visible:

- Identidad de trabajadores
- Criterio de selección
- Detalles de rotación

### Reglas de negocio asociadas:

- RN-075: Estados internos confirmados (la empresa solo ve el estado simplificado, no los estados internos del sistema)
- RN-117: Empresa (restricciones de visibilidad del pizarrón/pedido)
- RN-146: Aviso de pedido cancelado

### Requerimientos asociados:

- REQ-EMPRESA-004: Consultar estado

---

## UC-EMPRESA-003: MODIFICAR O ELIMINAR PEDIDO

**Identificador:** UC-EMPRESA-003  
**Nombre:** Modificar o eliminar pedido  
**Tipo:** IMPORTANT  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Empresa puede modificar o cancelar un pedido propio, pero solo mientras no tenga trabajadores designados (para modificar) o no haya alcanzado su horario de inicio (para cancelar). Una vez procesado o iniciado, el pedido queda bloqueado para estas acciones.

### Precondiciones:

1. Empresa autenticada (usuario tipo EMPRESA)
2. El pedido pertenece a la empresa (RN-068)
3. **Para modificar:** el pedido no tiene designaciones vigentes (RN-070)
4. **Para cancelar:** todavía no se alcanzó `horario_inicio` (RN-072, RN-073)

### Flujo principal (modificar):

1. Empresa selecciona un pedido propio y elige "Modificar"
2. Sistema valida que el pedido no tenga designaciones asociadas (RN-070)
3. Sistema permite editar: cantidad, horario, tipo de tarea (RN-069)
4. Empresa confirma los cambios
5. Sistema ejecuta `UPDATE pedidos SET ...`
6. Si el pedido estaba en COLA_PEDIDOS, el sistema recalcula su `fecha_procesamiento_programado` según el nuevo horario y reevalúa RN-063
7. Sistema confirma la modificación

### Flujo principal (eliminar / cancelar):

1. Empresa selecciona un pedido propio y elige "Cancelar"
2. Sistema valida que no se haya alcanzado el `horario_inicio` (RN-072, RN-073)
3. Sistema solicita confirmación
4. Empresa confirma
5. Sistema ejecuta `UPDATE pedidos SET estado = 'CANCELADO'`
6. Si existían designaciones vigentes para ese pedido (RN-074):
   - cada designación pasa a `estado = 'CANCELADO'`
   - cada trabajador afectado recibe 1 turno atrasado (o recupera el que había usado, si correspondía)
   - cada trabajador queda disponible nuevamente según sus demás condiciones
7. El pizarrón refleja el pedido como `CANCELADO` (RN-146)
8. Sistema confirma la cancelación a la empresa

### Flujos alternativos:

- FA-1: Empresa intenta modificar un pedido que ya tiene designaciones → rechazado, "No se puede modificar: ya tiene personal asignado"
- FA-2: Empresa intenta cancelar un pedido cuyo `horario_inicio` ya fue alcanzado → rechazado, "El pedido ya está en curso y no puede cancelarse"
- FA-3: Error de BD durante la modificación/cancelación → operación revertida, sin cambios

### Postcondiciones:

**Si exitoso (modificar):**
- PEDIDOS actualizado con los nuevos valores
- Si estaba en cola, COLA_PEDIDOS reprogramado según corresponda

**Si exitoso (cancelar):**
- PEDIDOS.estado = 'CANCELADO'
- Designaciones vigentes asociadas: `estado = 'CANCELADO'`
- Trabajadores afectados: +1 turno atrasado (o atraso devuelto)
- Pizarrón muestra el pedido como CANCELADO

**Si falla:**
- Pedido sin cambios

### Acciones permitidas:

Cambiar cantidad, horarios, establecimientos, habilitaciones requeridas (mientras no existan designaciones).

### Restricción:

Una vez que el pedido entra en fase de procesamiento (tiene designaciones) o alcanza su horario de inicio, no se puede modificar ni cancelar.

### Reglas de negocio asociadas:

- RN-068: Responsabilidad de edición
- RN-069: Campos modificables
- RN-070: Bloqueo posterior a asignación
- RN-071: Actores autorizados (cancelación)
- RN-072: Límite temporal
- RN-073: Pedido iniciado
- RN-074: Cancelación con designados
- RN-146: Aviso de pedido cancelado

### Requerimientos asociados:

- REQ-EMPRESA-002: Modificar pedido
- REQ-EMPRESA-003: Cancelar pedido

---

## UC-EMPRESA-004: VER HISTORIAL DE PEDIDOS

**Identificador:** UC-EMPRESA-004  
**Nombre:** Ver historial de pedidos propios  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Empresa consulta el historial de pedidos ya realizados (jornadas cerradas), con filtros por fecha y estado. A diferencia de UC-EMPRESA-002 (estado de pedidos vigentes), este UC se apoya en `PEDIDO_HISTORIAL`, el snapshot generado al cierre de cada jornada.

### Precondiciones:

1. Empresa autenticada (usuario tipo EMPRESA)
2. Existen registros en PEDIDO_HISTORIAL asociados a `empresa_id` (jornadas ya cerradas)

### Flujo principal:

1. Empresa accede a "Historial de pedidos"
2. Sistema muestra filtros por fecha y/o estado final
3. Empresa aplica filtros (opcional)
4. Sistema consulta PEDIDO_HISTORIAL filtrando por `empresa_id` (y por fecha/estado si se aplicó filtro)
5. Sistema muestra, por cada pedido:
   - Fecha del pedido
   - Cantidad solicitada (`cantidad_requerida`)
   - Cantidad cubierta (`cantidad_designados`)
   - Estado final (`estado_final`: completado, parcial/no cubierto, cancelado)

### Flujos alternativos:

- FA-1: Sin resultados para los filtros aplicados → "No hay pedidos para los filtros seleccionados"
- FA-2: Error de BD → mensaje de error genérico, opción de reintentar

### Postcondiciones:

**Si exitoso:**
- Historial mostrado correctamente según los filtros aplicados
- No se modifica ningún dato (consulta de solo lectura)

**Si falla:**
- Error mostrado, sin datos parciales incorrectos

### Información visible:

- Fecha del pedido
- Cantidad solicitada
- Cantidad cubierta
- Estado final (completado, parcial, no cubierto)

### Información NO visible:

- Detalles de trabajadores
- Razones internas de no cobertura
- Datos operativos de la seccional

### Reglas de negocio asociadas:

- RN-117: Empresa (restricciones de visibilidad)
- RN-121: Pizarrón histórico (mismo criterio de snapshot aplicado a PEDIDO_HISTORIAL)

### Requerimientos asociados:

- REQ-EMPRESA-004: Consultar estado (cubre tanto pedidos vigentes, UC-EMPRESA-002, como el histórico de pedidos cerrados, este UC)

