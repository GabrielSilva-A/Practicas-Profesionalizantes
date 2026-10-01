# CASOS DE USO — ACTOR: TRABAJADOR

**Versión:** 1.0  
**Última actualización:** 2026-09-28  
**Estado:** Fase 4 - Documentación de casos de uso completa (UC-TRABAJADOR-001 a 009)

---

## UC-TRABAJADOR-001: INICIAR SESIÓN

**Identificador:** UC-TRABAJADOR-001  
**Nombre:** Iniciar sesión  
**Tipo:** CRITICAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Autenticación de trabajadores mediante nombre o email y contraseña (decisión
aprobada). Detecta primer login y ejecuta cambio obligatorio de contraseña.
El nombre de ingreso es el nombre propio consignado en el formulario de registro,
no un alias único. UATRE mantiene la responsabilidad de registrar al trabajador.
La resolución de homónimos y comparación del nombre están pendientes D-33 en
`decisiones-pendientes.md`; el nombre personal no identifica por sí solo una cuenta única.

**Decisión posterior pendiente de precisión:** se guardará un correo válido de
Gmail del trabajador y el ingreso con Gmail se implementará más adelante.
El usuario confirmó «Continuar con Google»: autenticación Google, no correo y
contraseña local. Falta confirmar si sustituye acceso por nombre/contraseña
(D-35), el efecto sobre el cambio inicial y vinculación al alta UATRE (D-36).
El flujo local siguiente es provisional; no constituye integración implementada.

### Precondiciones:
1. Trabajador registrado por UATRE (UC-UATRE-002)
2. Usuario existe en USUARIOS con tipo = TRABAJADOR
3. Email y password registrados
4. Sistema disponible

### Flujo principal:

1. Trabajador accede a pantalla login
2. Sistema muestra formulario con campos:
   - Nombre o email
   - Contraseña
   - Opción "Recordar email"
   - Botón "INICIAR SESIÓN"

3. Trabajador ingresa nombre o email y contraseña
4. Sistema valida entrada
5. Sistema consulta usuario en BD
6. Sistema verifica contraseña con bcrypt
7. Sistema verifica cuenta activa
8. Sistema verifica si es primer login

**SI ES PRIMER LOGIN:**
- Sistema redirige a UC-TRABAJADOR-008 (Cambiar contraseña obligatorio)
- Después de completar: acceso a panel principal

**SI NO ES PRIMER LOGIN:**
- Sistema crea sesión segura
- Guarda cookie (HttpOnly, Secure, SameSite=Strict)
- Opcionalmente recuerda email
- Registra login en auditoría
- Redirige a Panel Principal

### Flujos alternativos:

- FA-1: Identificador no registrado → Mensaje genérico de error
- FA-2: Contraseña incorrecta → Mensaje genérico, sin bloqueo por cantidad de intentos
- FA-3: Cuenta desactivada → "Tu cuenta ha sido desactivada"
- FA-4: Intentos fallidos repetidos → se permite volver a intentar, sin bloqueo por IP o cuenta basado en su cantidad
- FA-5: Sistema en mantenimiento → "Sistema en mantenimiento"

### Postcondiciones:

**Si exitoso (primer login):**
- Sesión creada con first_login=TRUE
- UC-TRABAJADOR-008 ejecutado completamente
- USUARIOS.primera_vez_login: FALSE
- USUARIOS.password_hash: actualizado
- Auditoría: LOGIN registrado
- Trabajador ve Panel Principal

**Si exitoso (no primer login):**
- Sesión creada con first_login=FALSE
- Cookie establecida
- Email recordado (si autorizó)
- Auditoría: LOGIN registrado
- Trabajador ve Panel Principal

**Si falla:**
- Sesión NO creada
- Auditoría: LOGIN FALLIDO registrado
- Trabajador permanece en login

### Características de seguridad:

- Mensaje genérico de error (previene enumeración)
- Sin bloqueo por intentos fallidos, independientemente de su cantidad (decisión aprobada)
- Sesiones TTL 1 hora renovable con navegación e interacción del usuario.
- Refrescos automáticos, incluido el polling del pizarrón, no renuevan la sesión.
- La renovación requiere una sesión todavía válida; detección/comunicación de
  actividad al servidor pendiente de diseño técnico (D-29).
- Cookies HttpOnly + Secure + SameSite=Strict
- Email recordado (NUNCA contraseña)
- Primer login dispara UC-TRABAJADOR-008

### Funcionalidad futura pendiente:

- Recuperación de contraseña vía email, aprobada para implementación posterior.
- Su flujo, mecanismo de verificación y servicio de envío aún no están diseñados
  ni implementados (D-34). No se ofrece como funcionalidad disponible.

### Reglas de negocio asociadas:

- RN-140: Registro de trabajador (UATRE crea)
- RN-150: Modelo usuarios centralizado
- RN-169: Cambio obligatorio password primer login

---


## UC-TRABAJADOR-008: CAMBIAR CONTRASEÑA EN PRIMER LOGIN

**Identificador:** UC-TRABAJADOR-008  
**Nombre:** Cambiar contraseña en primer login  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Cambio OBLIGATORIO de contraseña temporal a permanente. Se ejecuta automáticamente en primer login después de UC-TRABAJADOR-001.

**Revisión necesaria:** el acceso futuro «Continuar con Google» fue aprobado.
La aplicabilidad de este cambio de contraseña local requiere decisión D-36;
no se solicita ni se modifica la contraseña de la cuenta Google.

### Precondiciones:

1. Trabajador registrado por UATRE (UC-UATRE-002)
2. Recibió credenciales temporales (email + password)
3. Accede al sistema por PRIMERA VEZ
4. Campo primera_vez_login = TRUE

### Flujo principal:

1. Trabajador accede con email + password temporal
2. Sistema valida credenciales en USUARIOS
3. Sistema detecta primera_vez_login = TRUE
4. Sistema BLOQUEA acceso normal y redirige a:
   `/cambiar-contraseña-obligatoria`

5. Sistema muestra pantalla de cambio obligatorio

6. Trabajador ingresa nueva contraseña
7. Trabajador confirma contraseña
8. Trabajador hace clic "CAMBIAR CONTRASEÑA"

9. Sistema VALIDA entrada:
   - No vacío
   - Coinciden ambos campos
   - >= 8 caracteres
   - Contiene mayúscula (A-Z)
   - Contiene minúscula (a-z)
   - Contiene número (0-9)
    - Contiene al menos un símbolo (por ejemplo !, @, #, $, %, ^, & o *; la lista no constituye una restricción exclusiva)
   - Diferente de temporal

10. Sistema ACTUALIZA:
    - UPDATE usuarios SET password_hash = bcrypt.hash(...),
      primera_vez_login = FALSE, fecha_ultimo_cambio = NOW()

11. Sistema muestra confirmación
12. Sistema redirige a Panel Principal

### Flujos alternativos:

- FA-1: Contraseña vacía
- FA-2: No coinciden
- FA-3: Muy corta (< 8 caracteres)
- FA-4: Sin mayúscula
- FA-5: Sin minúscula
- FA-6: Sin número
- FA-7: Sin símbolo
- FA-8: Igual a temporal
- FA-9: Sesión expirada
- FA-10: Error BD

### Postcondiciones:

**Si exitoso:**
- password_hash actualizado
- primera_vez_login = FALSE
- Contraseña temporal invalidada
- Trabajador accede normalmente

**Si falla:**
- password_hash NO actualizado
- primera_vez_login = TRUE
- Permanece en pantalla de cambio

### Características:

- OBLIGATORIO: no se puede saltar
- 5 validaciones de contraseña
- Bloquea acceso hasta completar
- Mostrar checklist de requisitos
- Marcar requisitos en tiempo real
- Toggle ver/ocultar contraseña

### Reglas de negocio asociadas:

- RN-140: Registro de trabajador
- RN-169: Cambio obligatorio en primer login

---

## UC-TRABAJADOR-002: VER PIZARRÓN

**Identificador:** UC-TRABAJADOR-002  
**Nombre:** Ver pizarrón  
**Tipo:** CRITICAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Trabajador accede al pizarrón seccional que muestra estado operativo en tiempo real: próximo número, lista completa de socios disponibles, pedidos activos, atrasados, anotados y suspendidos.

### Precondiciones:

1. Trabajador autenticado (UC-TRABAJADOR-001)
2. primera_vez_login = FALSE
3. Sesión activa

### Flujo principal:

1. Trabajador accede a /dashboard
2. Sistema valida sesión
3. Obtiene próximo número a designar
4. Obtiene LISTA COMPLETA de socios disponibles hoy (basado en v_trabajadores_elegibles)
5. Obtiene pedidos activos/pendientes
6. Obtiene trabajadores atrasados (número + cantidad)
7. Obtiene trabajadores anotados (número + disponibilidad)
8. Obtiene trabajadores suspendidos (número + turnos)
9. Muestra pizarrón con 6 secciones
10. Auto-refresh cada 30 segundos

### Sección ATRASADOS:
- Número del trabajador (NO nombre)
- Cantidad de turnos atrasados
- Ordenado por cantidad descendente
- Ejemplo: Nº 3 (2 turnos), Nº 8 (3 turnos)

### Sección SOCIOS DISPONIBLES HOY:
- LISTA COMPLETA de números: 5, 7, 8, 9, 11, 12, 15, 17, 18, 19...
- NO solo cantidad, sino todos los números disponibles
- Basado en v_trabajadores_elegibles
- Criterios: presente_hoy=TRUE, presente_ayer=TRUE, anotado=FALSE, sin sanciones
- Ordenado por número ascendente

### Flujos alternativos:

- FA-1: Sin pedidos → Muestra "No hay solicitudes para hoy"
- FA-2: Error de actualización → Reintento automático
- FA-3: Mantenimiento → Mensaje de mantenimiento

### Postcondiciones:

**Si exitoso:**
- Pizarrón visible con datos actuales
- Auto-refresh cada 30 segundos
- Trabajador puede interactuar

**Si falla:**
- Error mostrado
- Opción de reintentar

### Características:

- Pizarrón UNIFICADO (igual para UATRE y TRABAJADOR)
- Las consultas sobre asistencia y disponibilidades quedan estáticas después de las 07:40
- Los pedidos ingresados después de las 07:40 deben mostrarse en el pizarrón
- Si un pedido se asigna por orden de asignación inmediata, debe designarse y mostrar los trabajadores designados tanto a UATRE como a los trabajadores en el pizarrón.
- Información compartida (no confidencial)

### Reglas asociadas:

- RN-018: Cierre asistencia 07:40
- RN-150: Modelo usuarios centralizado

### Requerimientos asociados:

- REQ-TRABAJADOR-004: Ver pizarrón actual
- REQ-SISTEMA-005: Pizarrón lista completa socios disponibles

### Flujo automático del sistema asociado (sin actor humano directo):

- REQ-SISTEMA-003: Renovación pizarrón 00:00 — los pedidos completados salen del pizarrón y los pedidos sin cubrir se transfieren al nuevo día.

---
---

## UC-TRABAJADOR-003: VER HISTORIAL DE DESIGNACIONES

**Identificador:** UC-TRABAJADOR-003  
**Nombre:** Ver historial de designaciones  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Trabajador consulta el histórico de sus propias designaciones (trabajos realizados o cancelados), a diferencia del pizarrón (UC-TRABAJADOR-002) que solo muestra el estado operativo del día actual. La consulta se resuelve sobre la tabla `DESIGNACIONES` filtrando por `trabajador_id`.

### Precondiciones:

1. Trabajador autenticado (UC-TRABAJADOR-001)
2. Existen registros en DESIGNACIONES asociados a su `trabajador_id` con estado `FINALIZADO` o `CANCELADO`

### Flujo principal:

1. Trabajador accede a la sección "Mi historial"
2. Sistema consulta DESIGNACIONES filtrando por `trabajador_id` y estado IN (FINALIZADO, CANCELADO)
3. Sistema ordena resultados por `fecha_designacion` descendente
4. Sistema muestra, por cada designación:
   - Empresa y tarea (a través del pedido asociado)
   - Establecimiento
   - Fecha y horario de inicio
   - Horario de fin y duración real trabajada (si `FINALIZADO`)
   - Estado final (FINALIZADO o CANCELADO)
5. Trabajador puede filtrar por rango de fechas (opcional)

### Flujos alternativos:

- FA-1: Sin designaciones históricas → "No registrás designaciones anteriores"
- FA-2: Error de BD → mensaje de error genérico, opción de reintentar

### Postcondiciones:

**Si exitoso:**
- Historial mostrado correctamente
- No se modifica ningún dato (consulta de solo lectura)

**Si falla:**
- Error mostrado, sin datos parciales incorrectos

### Características:

- Solo muestra el resultado final de cada designación (RN-094: DESIGNADO ≠ TRABAJANDO, ambos estados intermedios ya no aplican en el historial)
- No expone información de otros trabajadores ni de la seccional

### Reglas de negocio asociadas:

- RN-093: Designado implica compromiso
- RN-094: Designado no es igual a trabajando
- RN-121: Pizarrón histórico (criterio análogo aplicado al historial personal)

### Requerimientos asociados:

- REQ-TRABAJADOR-006: Ver historial designaciones

---

## UC-TRABAJADOR-004: INDICAR FIN DE JORNADA

**Identificador:** UC-TRABAJADOR-004  
**Nombre:** Indicar fin de jornada  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Trabajador marca manualmente que finalizó su jornada laboral antes de que se cumpla el bloqueo máximo de 12 horas. Si no lo hace, el sistema lo libera automáticamente al cumplirse ese plazo.

### Precondiciones:

1. Trabajador autenticado (UC-TRABAJADOR-001)
2. Posee una designación vigente en estado `TRABAJANDO` (DESIGNACIONES.estado = 'TRABAJANDO')

### Flujo principal:

1. Trabajador accede a su panel y ve la designación activa en estado TRABAJANDO, con opción "Finalizar jornada"
2. Trabajador hace clic en "Finalizar jornada"
3. Sistema solicita confirmación
4. Trabajador confirma
5. Sistema ejecuta:
   `UPDATE designaciones SET estado = 'FINALIZADO', horario_fin = NOW() WHERE id = ... AND estado = 'TRABAJANDO'`
6. Sistema calcula la duración real trabajada (`horario_fin - horario_inicio`)
7. Trabajador queda disponible nuevamente según sus demás condiciones (RN-093)
8. Sistema muestra confirmación de fin de jornada

### Flujos alternativos:

- FA-1: Trabajador no tiene designación en estado TRABAJANDO → opción "Finalizar jornada" no disponible
- FA-2: La designación ya fue marcada FINALIZADO por la liberación automática de 12h (REQ-SISTEMA-002) antes de que el trabajador confirmara → "Tu jornada ya fue finalizada automáticamente"
- FA-3: Error de BD → operación revertida, designación permanece en TRABAJANDO

### Postcondiciones:

**Si exitoso:**
- DESIGNACIONES.estado = 'FINALIZADO'
- DESIGNACIONES.horario_fin = NOW()
- Trabajador disponible nuevamente según sus demás condiciones (asistencia, anotado, sanciones)

**Si falla:**
- DESIGNACIONES.estado sin cambios (permanece TRABAJANDO)

### Características:

- Finalización anticipada: el trabajador puede cerrar su jornada en cualquier momento antes de las 12 horas (RN-097)
- Si no finaliza manualmente, el sistema libera automáticamente al cumplirse el plazo máximo (RN-096, RN-098)

### Reglas de negocio asociadas:

- RN-093: Designado implica compromiso
- RN-094: Designado no es igual a trabajando
- RN-095: Inicio del bloqueo
- RN-096: Duración máxima (12 horas)
- RN-097: Finalización anticipada
- RN-098: Liberación automática

### Requerimientos asociados:

- REQ-TRABAJADOR-007: Finalizar trabajo (solo si está TRABAJANDO; marca FINALIZADO y calcula duración real)

### Flujo automático del sistema asociado (sin actor humano directo):

- REQ-SISTEMA-001: DESIGNADO → TRABAJANDO — al alcanzar `horario_inicio`, el trigger cambia el estado automáticamente y calcula `horario_fin = horario_inicio + 12h`.
- REQ-SISTEMA-002: Liberación automática 12h — si el trabajador no marcó fin de jornada manualmente, al cumplirse las 12h el sistema marca FINALIZADO de todos modos.

---

## UC-TRABAJADOR-005: SOLICITAR ANOTADO (INDISPONIBILIDAD)

**Identificador:** UC-TRABAJADOR-005  
**Nombre:** Solicitar ANOTADO (indisponibilidad)  
**Tipo:** IMPORTANT  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Trabajador indica que no desea ser considerado para una designación la próxima vez que la rotación ordinaria alcance su número. Se representa como un flag booleano (`TRABAJADORES.anotado`) que el propio trabajador activa desde su cuenta.

### Precondiciones:

1. Trabajador autenticado (UC-TRABAJADOR-001)
2. No está DESIGNADO
3. No está TRABAJANDO
4. No se encuentra SANCIONADO
5. `TRABAJADORES.anotado = FALSE` (aún no está anotado)

### Flujo principal:

1. Trabajador accede a su panel y selecciona "ANOTARME"
2. Sistema valida que no esté DESIGNADO, TRABAJANDO ni SANCIONADO (RN-031)
3. Sistema ejecuta: `UPDATE trabajadores SET anotado = TRUE WHERE id = ...`
4. Sistema confirma la acción al trabajador

### Flujos alternativos:

- FA-1: Trabajador ya DESIGNADO → "No podés anotarte mientras tenés una designación vigente"
- FA-2: Trabajador TRABAJANDO → "No podés anotarte mientras estás trabajando"
- FA-3: Trabajador SANCIONADO → "No podés anotarte mientras tenés una sanción vigente"
- FA-4: Trabajador ya está ANOTADO → mensaje informativo, sin cambios ("Ya estás anotado")
- FA-5: Error de BD → operación revertida

### Postcondiciones:

**Si exitoso:**
- TRABAJADORES.anotado = TRUE
- No podrá ser designado por la rotación ordinaria mientras dure la condición
- Sus turnos atrasados pendientes (si los tuviera) NO se eliminan ni se consumen (RN-037)
- Si además está ATRASADO, ANOTADO prevalece temporalmente e impide usar la prioridad de atrasado (RN-036)

**Si falla:**
- TRABAJADORES.anotado sin cambios

### Características:

- Un trabajador ATRASADO puede anotarse igualmente si no existe otra restricción (RN-035)
- El flag no se resetea automáticamente al cerrar la asistencia (RN-156)

### Reglas de negocio asociadas:

- RN-029: Significado de ANOTADO
- RN-030: Acción ANOTARME
- RN-031: Restricciones para anotarse
- RN-035: Un atrasado puede anotarse
- RN-036: Prioridad lógica de ANOTADO
- RN-037: El atraso no desaparece
- RN-156: ANOTADO como flag booleano

### Requerimientos asociados:

- REQ-TRABAJADOR-002: Marcar ANOTARME

---

## UC-TRABAJADOR-006: LIBERAR ANOTADO

**Identificador:** UC-TRABAJADOR-006  
**Nombre:** Liberar ANOTADO  
**Tipo:** IMPORTANT  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Trabajador cancela su propia condición ANOTADO antes de que la rotación ordinaria alcance su número, quedando disponible nuevamente según sus demás condiciones.

### Precondiciones:

1. Trabajador autenticado (UC-TRABAJADOR-001)
2. `TRABAJADORES.anotado = TRUE` (se encuentra actualmente ANOTADO)
3. La rotación ordinaria todavía no alcanzó su número (si ya lo alcanzó, ANOTADO finaliza automáticamente por RN-034 y este UC ya no aplica)

### Flujo principal:

1. Trabajador accede a su panel y ve su condición ANOTADO activa, con opción "LIBERAR"
2. Trabajador hace clic en "LIBERAR"
3. Sistema ejecuta: `UPDATE trabajadores SET anotado = FALSE WHERE id = ...`
4. Sistema confirma la liberación

### Flujos alternativos:

- FA-1: Trabajador no está ANOTADO → opción "LIBERAR" no disponible
- FA-2: Error de BD → operación revertida, ANOTADO permanece activo

### Postcondiciones:

**Si exitoso:**
- TRABAJADORES.anotado = FALSE
- Trabajador vuelve a estar disponible según sus demás condiciones
- Conserva sus turnos atrasados pendientes, si los tuviera (RN-033, RN-038): si aún posee atrasos, continúa ATRASADO

**Si falla:**
- TRABAJADORES.anotado sin cambios (permanece TRUE)

### Características:

- Es una de las tres formas de finalizar ANOTADO, junto con el alcance de la rotación ordinaria (RN-034) y la liberación manual por UATRE (RN-032)
- No afecta la cantidad de atrasos ni la prioridad que le correspondan (RN-038)

### Reglas de negocio asociadas:

- RN-032: Formas de finalizar ANOTADO
- RN-033: Liberación anticipada
- RN-038: Salida de ANOTADO
- RN-156: ANOTADO como flag booleano

### Requerimientos asociados:

- REQ-TRABAJADOR-003: Marcar LIBERAR

---

## UC-TRABAJADOR-007: CONSULTAR ESTADO PERSONAL

**Identificador:** UC-TRABAJADOR-007  
**Nombre:** Consultar estado personal  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Trabajador consulta su situación operativa actual sin acceder a información de otros
trabajadores. La consulta reúne el número de lista asignado, la asistencia, las
condiciones ANOTADO, ATRASADO y SANCIONADO, y cualquier designación vigente.

### Precondiciones:

1. Trabajador autenticado (UC-TRABAJADOR-001)
2. primera_vez_login = FALSE
3. Sesión activa

### Flujo principal:

1. Trabajador accede a la sección "Mi estado"
2. Sistema valida que la sesión corresponda a un usuario tipo TRABAJADOR
3. Sistema obtiene exclusivamente la información vinculada al `trabajador_id` de la sesión
4. Sistema muestra:
   - Número de lista, si posee uno asignado
   - Asistencia de la jornada actual y del día anterior
   - Condición ANOTADO
   - Cantidad de turnos ATRASADOS, si posee atrasos pendientes
   - Cantidad de turnos de sanción pendientes, si existe una sanción vigente
   - Designación vigente, si existe, con empresa, tarea, establecimiento, fecha,
     horario y estado (`DESIGNADO` o `TRABAJANDO`)
5. Sistema informa al trabajador las condiciones que actualmente afectan su disponibilidad

### Flujos alternativos:

- FA-1: Trabajador sin número asignado → muestra que no posee número activo en la lista
- FA-2: Sin designación vigente → muestra "No tenés una designación vigente"
- FA-3: Sin atrasos ni sanciones pendientes → muestra esas condiciones como inexistentes
- FA-4: Sesión no válida o perteneciente a otro tipo de usuario → acceso denegado
- FA-5: Error de BD → mensaje de error genérico, opción de reintentar

### Postcondiciones:

**Si exitoso:**
- Estado personal mostrado correctamente
- No se modifica ningún dato
- No se expone información de otros trabajadores

**Si falla:**
- Error mostrado, sin datos parciales incorrectos

### Características:

- Consulta de solo lectura
- La identidad del trabajador consultado se determina desde la sesión, no desde un
  identificador indicado por el usuario
- La información representa condiciones coexistentes; no se reduce a un único estado excluyente

### Reglas de negocio asociadas:

- RN-002: Independencia por seccional
- RN-029: Significado de ANOTADO
- RN-077: Prioridad de atrasados
- RN-079: Condiciones evaluadas por el motor
- RN-093: Designado implica compromiso
- RN-094: Designado no es igual a trabajando
- RN-150: Modelo usuarios centralizado

### Requerimientos asociados:

- REQ-TRABAJADOR-001: Consultar estado

---

## UC-TRABAJADOR-009: VER HISTORIAL DE PIZARRÓN

**Identificador:** UC-TRABAJADOR-009  
**Nombre:** Ver historial de pizarrón  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Trabajador consulta el historial simplificado del pizarrón de jornadas anteriores.
Para cada fecha disponible, el sistema muestra el resultado final no confidencial de
los pedidos de la jornada, conservado al cierre en `PEDIDO_HISTORIAL`.

### Precondiciones:

1. Trabajador autenticado (UC-TRABAJADOR-001)
2. primera_vez_login = FALSE
3. Sesión activa
4. Existen jornadas cerradas con registros históricos de la seccional del trabajador

### Flujo principal:

1. Trabajador accede a la sección "Historial de pizarrón"
2. Sistema obtiene las fechas históricas disponibles para la seccional del trabajador
3. Trabajador selecciona una fecha
4. Sistema consulta los registros históricos de esa seccional y jornada
5. Sistema muestra el pizarrón histórico con:
   - Pedidos de la jornada: empresa, tarea, establecimiento, horario, cantidad
     requerida, cantidad designada y estado final
6. Sistema no muestra identidades, números ni designaciones individuales de
   trabajadores

### Flujos alternativos:

- FA-1: No existen jornadas históricas disponibles → "No hay pizarrones históricos para consultar"
- FA-2: Fecha sin registros para la seccional → "No hay información registrada para la fecha seleccionada"
- FA-3: Fecha inválida o futura → se informa el error y no se realiza la consulta
- FA-4: Sesión no válida o perteneciente a otro tipo de usuario → acceso denegado
- FA-5: Error de BD → mensaje de error genérico, opción de reintentar

### Postcondiciones:

**Si exitoso:**
- Pizarrón histórico mostrado correctamente
- No se modifica ningún dato
- No se exponen identidades ni información confidencial de otros trabajadores

**Si falla:**
- Error mostrado, sin datos parciales incorrectos

### Características:

- Consulta de solo lectura
- El historial se limita a la seccional del trabajador autenticado
- Se conserva la foto final de cada pedido, no el detalle de designaciones
  individuales ni de las condiciones operativas de los trabajadores

### Reglas de negocio asociadas:

- RN-002: Independencia por seccional
- RN-121: Pizarrón histórico
- RN-123: Consulta histórica del trabajador
- RN-165: Historial simplificado
- RN-150: Modelo usuarios centralizado

### Requerimientos asociados:

- REQ-TRABAJADOR-005: Ver historial pizarrón
