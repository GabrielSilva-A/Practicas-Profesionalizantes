# CASOS DE USO — ACTOR: UATRE

**Versión:** 1.0  
**Última actualización:** 2026-09-20  
**Estado:** Fase 4 - Documentación de casos de uso

---

## UC-UATRE-002: REGISTRAR NUEVO TRABAJADOR EN LA SECCIONAL

**Identificador:** UC-UATRE-002  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Un trabajador no se registra a sí mismo en el sistema. La responsabilidad de crear un nuevo trabajador corresponde a UATRE (personal de la seccional autorizado).

### Flujo de creación:

1. **UATRE solicita datos al trabajador:**
   - Nombre (requerido)
   - Apellido (requerido)
   - Documento (requerido, único global)
   - Teléfono (opcional)
   - Email válido de Gmail (requerido, se guarda en USUARIOS.email). No implica titularidad verificada ni integración Google; ingreso futuro pendiente de precisión D-35.
   - Número de lista (UATRE selecciona de disponibles)

2. **UATRE completa el formulario de registro** dentro del sistema

3. **Sistema valida:**
   - Documento no existe (UNIQUE global)
   - Email no existe en USUARIOS (UNIQUE global)
   - Número de lista está disponible

4. **Sistema crea trabajador:**
   - Inserta en TRABAJADORES con presente_hoy=FALSE, presente_ayer=FALSE, anotado=FALSE
   - Dispara Trigger 3 para crear ATRASOS iniciales

5. **Sistema genera contraseña temporal:**
   - 12 caracteres aleatorios (A-Z, a-z, 0-9, !@#$%)
   - Válida solamente para primer login

6. **Sistema crea usuario:**
   - email: proporcionado por trabajador (vía UATRE)
   - password: hash de contraseña temporal
   - tipo: TRABAJADOR
   - trabajador_id: FK al trabajador recién creado

7. **UATRE recibe credenciales:**
   - Email: {email del trabajador}
   - Contraseña temporal: {generada aleatoriamente}

8. **UATRE proporciona credenciales al trabajador** por medio seguro (impreso, SMS, en persona, etc.)

### Acceso inicial del trabajador:

- Trabajador accede con: email + contraseña temporal
- Sistema detecta que es primer login
- Sistema obliga cambio de contraseña (ver UC-TRABAJADOR-008 / RN-169)
- Cambio de contraseña es OBLIGATORIO, no opcional
- Trabajador solo puede continuar después de cambiar contraseña

### Postcondiciones:

✅ TRABAJADORES: nuevo registro con documento único  
✅ LISTA_ROTACION: número asignado al trabajador  
✅ USUARIOS: nuevo usuario con email único  
✅ ATRASOS: inicializados con cantidad=0  
✅ Trabajador puede loguear con email + password temporal  
✅ Trabajador debe cambiar contraseña en primer login

### Reglas de negocio asociadas:

- RN-141: Unicidad del número ocupado
- RN-150: Modelo de usuarios centralizado
- RN-151: Documento único global
- RN-169: Cambio obligatorio de contraseña en primer login

### Requerimientos asociados:

- REQ-UATRE-011: Registrar trabajador

### Casos de uso asociados:

- UC-TRABAJADOR-008: Cambiar contraseña en primer login
- UC-TRABAJADOR-001: Iniciar sesión

---

## UC-UATRE-001: ADMINISTRAR SECCIONAL

**Identificador:** UC-UATRE-001  
**Nombre:** Administrar seccional  
**Tipo:** CRITICAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Comprende dos operaciones fundamentales de administración estructural que UATRE realiza sobre su propia seccional: el **registro inicial de la seccional** en el sistema (alta única, punto de entrada multiseccional) y la **liberación de un número** de la lista de rotación cuando un trabajador renuncia o es despedido.

### Precondiciones:

**Para registro de seccional:**
1. Sistema disponible y accesible desde pantalla inicial (sin sesión previa)
2. Número de seccional no registrado previamente
3. Email de seccional no registrado en USUARIOS

**Para liberación de número:**
1. Seccional autenticada (usuario tipo SECCIONAL)
2. Número existe en LISTA_ROTACION de esa seccional y está `activo = TRUE`
3. Número tiene un `trabajador_id` asignado (ocupado)
4. El trabajador no tiene designaciones ni trabajos activos

### Flujo principal A: Registrar seccional (alta inicial)

1. Persona autorizada accede a pantalla inicial del sistema
2. Sistema muestra opción "Registrar seccional"
3. Persona completa formulario con:
   - Número de seccional (único)
   - Localidad
   - Provincia
   - Email de la seccional
   - Contraseña
   - Cantidad de números que tendrá la lista de rotación (`cantidad_numeros`)
4. Sistema valida:
   - Número de seccional no existe (UNIQUE)
   - Email no existe en USUARIOS (UNIQUE global)
   - Cantidad de números > 0
5. Sistema crea:
   - Registro en SECCIONALES con `punto_rotacion = 1`, `cantidad_numeros` indicado, `activo = TRUE`
   - N filas en LISTA_ROTACION (números 1 a `cantidad_numeros`) con `trabajador_id = NULL`, `activo = TRUE`
   - Usuario en USUARIOS con `tipo = SECCIONAL`, `seccional_id` = FK a la seccional recién creada
6. Sistema confirma alta y redirige a login
7. Seccional inicia sesión con las credenciales creadas

### Flujo principal B: Liberar número de la lista

1. UATRE (autenticado) accede a administración de lista de rotación
2. Sistema muestra lista de números con su trabajador asignado (o libre)
3. UATRE selecciona un número ocupado y elige "Liberar número"
4. Sistema solicita confirmación (acción irreversible sobre la ocupación actual)
5. UATRE confirma
6. Sistema actualiza:
   - `lista_rotacion.trabajador_id = NULL` (desvincula al trabajador)
   - `lista_rotacion.activo = FALSE` (número queda inactivo)
   - `trabajadores.activo = FALSE` y `usuarios.activo = FALSE`
   - Atrasos y sanciones pendientes del trabajador a cero
7. Sistema muestra confirmación: "Número liberado correctamente"
8. El número liberado deja de participar en el motor y en la rotación ordinaria (`activo = TRUE` es condición de consulta)

### Flujos alternativos:

- FA-1 (Registro): Número de seccional ya existe → "El número de seccional ya está registrado"
- FA-2 (Registro): Email ya registrado en USUARIOS → "El email ya está en uso"
- FA-3 (Registro): Cantidad de números inválida (≤ 0) → "Debe indicar una cantidad válida de números"
- FA-4 (Liberación): Número ya estaba libre/inactivo → "El número ya se encuentra libre"
- FA-5 (Liberación): Trabajador tiene designaciones o trabajo activo → se rechaza
  la liberación sin realizar cambios
- FA-6: Error de conexión con la BD → mensaje de error genérico + reintento

### Postcondiciones:

**Si exitoso (registro):**
- SECCIONALES: nuevo registro con `punto_rotacion = 1`
- LISTA_ROTACION: N números creados, todos libres (`trabajador_id = NULL`, `activo = TRUE`)
- USUARIOS: nuevo usuario tipo SECCIONAL
- Seccional puede iniciar sesión y comenzar a operar (registrar trabajadores, empresas, etc.)

**Si exitoso (liberación):**
- `lista_rotacion.trabajador_id = NULL`
- `lista_rotacion.activo = FALSE`
- TRABAJADORES y USUARIOS asociados: `activo = FALSE`
- ATRASOS: `cantidad = 0` y sin primer atraso pendiente
- SANCIONES: sin turnos pendientes ni sanción activa
- El número no es evaluado por el motor de nombramiento (Fase 2 y validaciones de disponibilidad)
- El histórico de la fila se conserva (no se borra, ver RN-154)
- La reactivación posterior de esta misma persona requiere un flujo específico;
  no se crea una identidad nueva porque documento y email son únicos globales

### Flujo principal C: Reactivar trabajador y asignar número

1. UATRE busca un trabajador inactivo de su propia seccional.
2. UATRE selecciona un número libre; puede seleccionar el número previamente
   liberado si lo reactiva.
3. Sistema valida que el número esté libre e inactivo o activo dentro de la
   misma seccional.
4. Sistema reactiva trabajador, usuario y número, y vincula el número con la
   identidad existente.
5. Sistema conserva la contraseña y el estado de primer acceso que ya tenía la
   cuenta; no genera ni entrega nuevas credenciales.

**Postcondiciones de reactivación:**
- TRABAJADORES y USUARIOS asociados: `activo = TRUE`.
- LISTA_ROTACION: número seleccionado activo y vinculado al trabajador.
- Se preservan identidad, historial y contraseña previa.
- Atrasos y sanciones continúan reiniciados conforme a la liberación anterior.

### Flujo principal D: Ajustar cantidad de números

1. UATRE indica la nueva cantidad de números para su propia seccional.
2. Al reducir, el sistema verifica que no haya números ocupados por encima del
   nuevo límite y que el punto de rotación permanezca dentro del rango.
3. Si ambas condiciones se cumplen, el sistema actualiza
   `seccionales.cantidad_numeros` y desactiva los números libres que quedan fuera
   del límite, sin borrar sus filas.
4. Al aumentar, el sistema activa primero números libres históricos dentro del
   nuevo rango y crea posiciones nuevas solo si faltan.
5. Sistema confirma el nuevo tamaño de lista.

**Flujos alternativos de ajuste:**
- FA-7: existe un número ocupado por encima del nuevo límite → sistema rechaza
  hasta que UATRE libere o reasigne al trabajador.
- FA-8: `punto_rotacion` queda fuera del nuevo rango → sistema rechaza hasta que
  UATRE aplique un override explícito del punto.

**Si falla:**
- Ningún cambio persistido
- Mensaje de error correspondiente mostrado

### Reglas de negocio asociadas:

- RN-001: Sistema multiseccional
- RN-002: Independencia por seccional
- RN-138: Registro de una seccional
- RN-149: Usuario único por seccional
- RN-150: Modelo de usuarios centralizado
- RN-152: Cantidad de números configurable
- RN-153: Liberación de número
- RN-154: Histórico de la lista se conserva

### Requerimientos asociados:

- REQ-UATRE-001: Registrar seccional
- REQ-UATRE-012: Liberar número
- REQ-UATRE-014: Ajustar cantidad de números

### Casos de uso asociados:

- UC-UATRE-002: Registrar nuevo trabajador en la seccional
- UC-UATRE-005: Override de rotación (afecta el mismo `punto_rotacion` gestionado aquí en el alta)

---

## UC-UATRE-003: GESTIONAR EMPRESAS

**Identificador:** UC-UATRE-003  
**Nombre:** Gestionar empresas  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

Comprende el alta de empresas afiliadas a la seccional —que puede realizarse por **dos vías equivalentes**: autoregistro de la empresa o alta manual por parte de UATRE— y la **activación/desactivación** de una empresa ya registrada.

> **Nota de consolidación:** existía una aparente contradicción entre `business-rules.md` (RN-003, RN-139: la empresa se registra a sí misma) y `requirements.md` (REQ-UATRE-010: UATRE registra la empresa). Se resolvió que **ambas vías son válidas y coexisten**, de forma análoga a cómo UATRE también puede intervenir en la gestión de otros actores. Esta decisión queda documentada aquí y no requiere modificar `business-rules.md`, ya que RN-003/RN-139 y REQ-UATRE-010 describen dos caminos complementarios, no contradictorios.

### Precondiciones:

**Para autoregistro (empresa):**
1. Sistema disponible desde pantalla inicial (sin sesión previa)
2. Al menos una seccional registrada en el sistema (para el selector)
3. Email no registrado previamente en USUARIOS

**Para alta manual (UATRE):**
1. UATRE autenticado (usuario tipo SECCIONAL)
2. Email de la empresa no registrado previamente en USUARIOS

**Para activar/desactivar:**
1. UATRE autenticado
2. Empresa pertenece a la seccional de UATRE (no puede administrar empresas de otra seccional, RN-002)

### Flujo principal A: Autoregistro de empresa

1. Persona autorizada de la empresa accede a pantalla inicial del sistema
2. Sistema muestra opción "Registrar empresa"
3. Persona completa formulario con:
   - Nombre
   - Localidad
   - Provincia
   - Seccional a la que se adhiere (lista desplegable de seccionales registradas)
   - Email
   - Contraseña
4. Sistema valida:
   - Email no existe en USUARIOS (UNIQUE global)
   - Seccional seleccionada existe y está activa
5. Sistema crea:
   - Registro en EMPRESAS con `seccional_id` seleccionado, `activa = TRUE`
   - Usuario en USUARIOS con `tipo = EMPRESA`, `empresa_id` = FK a la empresa recién creada
6. Sistema confirma alta y redirige a login
7. Empresa inicia sesión y puede comenzar a crear pedidos (ver UC-EMPRESA-001)

### Flujo principal B: Alta manual por UATRE

1. UATRE accede a administración de empresas dentro de su panel
2. UATRE completa formulario con nombre, localidad, provincia y email; la
   seccional queda implícita (la del propio UATRE)
3. Sistema realiza las mismas validaciones y creación del Flujo A (pasos 4-5)
4. Sistema genera una contraseña temporal de 12 caracteres con el mismo
   mecanismo de UC-UATRE-002 y crea el usuario EMPRESA con
   `primera_vez_login = TRUE`
5. UATRE entrega a la empresa el email como identificador y la contraseña
   temporal por un medio seguro
6. En su primer acceso, la empresa debe cambiar obligatoriamente la contraseña
   antes de crear pedidos u operar otras funcionalidades

### Flujo principal C: Activar/Desactivar empresa

1. UATRE accede al listado de empresas de su seccional
2. Sistema muestra empresas con su estado actual (`activa` / `inactiva`)
3. UATRE selecciona una empresa y elige "Desactivar" (o "Activar" si ya estaba inactiva)
4. Sistema solicita confirmación
5. UATRE confirma
6. Sistema actualiza `EMPRESAS.activa = FALSE` (o `TRUE`)
7. Sistema muestra confirmación del nuevo estado

### Flujos alternativos:

- FA-1: Email ya registrado en USUARIOS → "El email ya está en uso"
- FA-2: Seccional seleccionada no existe o está inactiva (Flujo A) → "Seccional no disponible"
- FA-3: UATRE intenta gestionar una empresa de otra seccional → acceso denegado (RN-002, independencia por seccional)
- FA-4: Empresa desactivada intenta crear un pedido → sistema rechaza la operación con mensaje "Empresa inactiva, contacte a su seccional"
- FA-5: Empresa ya se encuentra en el estado solicitado (ya activa/ya inactiva) → mensaje informativo, sin cambios

### Postcondiciones:

**Si exitoso (alta, cualquier flujo):**
- EMPRESAS: nuevo registro con `activa = TRUE`
- USUARIOS: nuevo usuario tipo EMPRESA
- Autoregistro: empresa puede iniciar sesión y crear pedidos
- Alta manual: UATRE recibe una única vez el email y la contraseña temporal;
  la empresa debe cambiarla en su primer acceso antes de operar

**Si exitoso (activar/desactivar):**
- `EMPRESAS.activa` actualizado al nuevo valor
- Si se desactivó: la empresa no puede crear nuevos pedidos, pero sus pedidos ya EN_PROCESO/CUBIERTOS no se ven afectados retroactivamente
- Si se activó: la empresa recupera la posibilidad de operar normalmente

**Si falla:**
- Ningún cambio persistido
- Mensaje de error correspondiente mostrado

### Reglas de negocio asociadas:

- RN-002: Independencia por seccional
- RN-003: Empresa (autoregistro y cuenta compartida por empleados autorizados)
- RN-051: Asociación con seccional (una empresa no puede estar adherida a más de una seccional)
- RN-139: Registro de una empresa (formulario y selección de seccional)
- RN-150: Modelo de usuarios centralizado

### Requerimientos asociados:

- REQ-UATRE-010: Registrar empresa

### Casos de uso asociados:

- UC-EMPRESA-001: Crear pedido de trabajadores (requiere empresa activa)
- UC-UATRE-002: Registrar nuevo trabajador en la seccional (flujo análogo de alta manual)

---

## UC-UATRE-004: REGISTRAR ASISTENCIA Y CIERRE

**Identificador:** UC-UATRE-004  
**Nombre:** Registrar asistencia y cierre  
**Tipo:** CRITICAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

UATRE abre diariamente el apartado de asistencia, marca el estado de cada número de la lista de rotación (PRESENTE/AUSENTE/ANOTADO) mediante una cuadrícula interactiva, y cierra la asistencia una vez verificados todos los números y alcanzadas las 07:40 hs. El cierre dispara automáticamente la sincronización de flags de presencia, el descuento de atrasos por ausencia, y el motor de nombramiento sobre los pedidos en cola.

### Precondiciones:

1. UATRE autenticado (usuario tipo SECCIONAL)
2. Existen números activos (`activo = TRUE`) en LISTA_ROTACION de la seccional
3. No existe aún un cierre de asistencia para la jornada actual

### Flujo principal:

**A. Apertura de asistencia**

1. UATRE accede al apartado de ASISTENCIA
2. Sistema consulta TRABAJADORES activos de la seccional para HOY (vía números activos de LISTA_ROTACION)
3. Sistema crea registros en ASISTENCIA: `trabajador_id`, `fecha = HOY`,
   `presente = FALSE`, `verificado = FALSE`, `cerrado = FALSE`
4. La apertura no modifica `trabajadores.presente_hoy` ni
   `trabajadores.presente_ayer`; los flags previos permanecen válidos hasta el cierre
5. Sistema muestra cuadrícula: Número | Trabajador | Estado

**B. Interacción con la cuadrícula**

6. UATRE interactúa con los casilleros:
   - Toque simple → marca PRESENTE (RN-024)
   - Pulsación sostenida → abre menú con opciones PRESENTE / AUSENTE / ANOTADO (RN-025)
7. Sistema actualiza `ASISTENCIA.presente` y `ASISTENCIA.verificado = TRUE`
   según la selección. ANOTADO conserva la presencia elegida como condición independiente
8. Colores de la cuadrícula reflejan el estado (RN-026): Verde=PRESENTE, Rojo=AUSENTE, Amarillo=TRABAJANDO, Azul=ATRASADO, Gris=ANOTADO, Gris oscuro=SANCIONADO
9. UATRE repite hasta verificar todos los números

**C. Cierre de asistencia**

10. Sistema valida (RN-166) antes de habilitar el botón "CERRAR ASISTENCIA":
    - Todos los números activos tienen registro en ASISTENCIA para hoy
    - Todos esos registros tienen `verificado = TRUE`
    - Hora actual >= 07:40 (Zona Argentina UTC-3, RN-168)
11. Si ambas condiciones se cumplen, el botón se habilita
12. UATRE hace clic en "CERRAR ASISTENCIA"
13. Sistema actualiza `ASISTENCIA.cerrado = TRUE` para todos los registros de la jornada

**D. Efectos automáticos en cadena (disparados por el cierre):**

14. Trigger `trg_sync_presente_flags` (AFTER UPDATE, WHERE cerrado=TRUE): para
    cada trabajador, `presente_ayer = presente_hoy` (valor previo) y
    `presente_hoy = NEW.presente`
15. Trigger `trg_descuento_atraso_ausencia` (RN-022): si el trabajador está AUSENTE y tiene atrasos pendientes, descuenta 1 atraso (máximo una vez por trabajador y jornada)
16. Motor de nombramiento inicia automáticamente dentro de la transacción de cierre (RN-167):
    - Procesa COLA_PEDIDOS con `fecha_procesamiento_programado <= NOW()`, en orden FIFO
    - Ejecuta `fn_ejecutar_motor(pedido_id)` para cada pedido en cola (ver `diagrama-motor.md`: Fase 1 Atrasados, Fase 2 Rotación ordinaria; la cobertura excepcional es **manual** por D-06 — ver aviso en `base_datos.md`)
    - Cada designación creada dispara `trg_descontar_atraso_al_designar`, descontando 1 atraso adicional si correspondía
17. Sistema confirma: asistencia cerrada, flags sincronizados, atrasos actualizados, pedidos en cola procesados

### Flujos alternativos:

- FA-1: UATRE intenta cerrar antes de las 07:40 → botón permanece deshabilitado, mensaje "Disponible después de las 07:40 hs"
- FA-2: Existen números sin verificar → botón deshabilitado, mensaje "Verificar números faltantes"
- FA-3: UATRE intenta reabrir una asistencia ya cerrada → sistema rechaza la operación (la asistencia del día ya está cerrada)
- FA-4: No hay pedidos en COLA_PEDIDOS al momento del cierre → el motor no genera designaciones nuevas, el resto del cierre continúa normalmente
- FA-5: Error de BD durante el cierre → operación revertida (transacción atómica), asistencia permanece `cerrado = FALSE`, mensaje de error mostrado

### Postcondiciones:

**Si exitoso:**
- `ASISTENCIA.cerrado`: FALSE → TRUE para todos los registros de la jornada
- `TRABAJADORES.presente_ayer`: actualizado con el valor previo de `presente_hoy`
- `TRABAJADORES.presente_hoy`: actualizado según lo marcado en la cuadrícula
- `ATRASOS.cantidad`: descontado en -1 para ausentes con atrasos pendientes
- `PEDIDOS.estado`: pedidos en cola pasan a `CUBIERTO` o `NO_CUBIERTO` según resultado del motor
- `DESIGNACIONES`: nuevas filas creadas para trabajadores designados
- Pizarrón se actualiza reflejando el nuevo estado

**Si falla:**
- Ningún cambio persistido (transacción revertida)
- Asistencia permanece abierta (`cerrado = FALSE`)

### Reglas de negocio asociadas:

- RN-017: Registro diario
- RN-018: Horario habitual de cierre (07:40)
- RN-019: Llegada tarde (se considera ausente)
- RN-020: Asistencia del día anterior
- RN-022: Ausencia de un trabajador con atrasos (descuento automático)
- RN-023: Representación (cuadrícula)
- RN-024: Toque simple (PRESENTE)
- RN-025: Pulsación sostenida (menú de estados)
- RN-026: Representación visual confirmada (colores)
- RN-155: Modelo híbrido de asistencia (tabla ASISTENCIA + flags en TRABAJADORES)
- RN-166: Validación de cierre de asistencia
- RN-167: Motor de nombramiento en PostgreSQL
- RN-168: Zona horaria del sistema (UTC-3)

### Requerimientos asociados:

- REQ-UATRE-002: Abrir asistencia
- REQ-UATRE-003: Cerrar asistencia
- REQ-UATRE-004: Motor de nombramiento — se dispara automáticamente al cerrar asistencia (ver `diagrama-motor.md`); no constituye un UC propio porque UATRE no lo invoca directamente, sino que es consecuencia del cierre.

### Flujo automático del sistema asociado (sin actor humano directo):

- REQ-SISTEMA-004: Procesar cola FIFO — al cerrar asistencia (o en job programado) se procesan los `COLA_PEDIDOS` ordenados por `fecha_procesamiento_programado` (ver `diagrama-asistencia.md`).

### Casos de uso asociados:

- UC-TRABAJADOR-002: Ver pizarrón (se actualiza tras el cierre)
- UC-UATRE-005: Override de rotación (afecta cómo se comporta la Fase 2 del motor disparado aquí)
- UC-UATRE-007: Aplicar sanción (interactúa con la elegibilidad evaluada por el motor)

### Diagramas de referencia:

- `diagrama-asistencia.md`: flujo completo, timeline de jornada y orden de triggers
- `diagrama-motor.md`: detalle de las 3 fases del motor de nombramiento

---

## UC-UATRE-005: OVERRIDE MANUAL DEL PUNTO DE ROTACIÓN

**Identificador:** UC-UATRE-005  
**Nombre:** Override de rotación  
**Tipo:** IMPORTANT  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

UATRE puede definir manualmente el número desde el cual debe reanudarse la rotación ordinaria de la seccional (`seccionales.punto_rotacion`), sin esperar a que el motor lo alcance de forma circular recorriendo todos los números intermedios.

### Precondiciones:

1. UATRE autenticado (usuario tipo SECCIONAL)
2. Existe al menos un número activo (`activo = TRUE`) en LISTA_ROTACION de la seccional
3. El número de destino del override está dentro del rango válido (1 a `cantidad_numeros`)

### Flujo principal:

1. UATRE accede a la administración de la lista de rotación
2. Sistema muestra el `punto_rotacion` actual de la seccional
3. UATRE indica el nuevo número desde el cual debe continuar la rotación ordinaria
4. Sistema valida que el número esté dentro del rango de la lista (1 a `cantidad_numeros`)
5. Sistema solicita confirmación (el override modifica el comportamiento de futuras designaciones automáticas)
6. UATRE confirma
7. Sistema actualiza `SECCIONALES.punto_rotacion` con el nuevo valor
8. Sistema confirma el cambio

### Comportamiento posterior al override:

- La próxima vez que el motor ejecute la **Fase 2 (Rotación ordinaria)** de `fn_ejecutar_motor` (ver `diagrama-motor.md`), comenzará el recorrido circular desde el número indicado por el override, en lugar de continuar desde donde había quedado el recorrido anterior.
- El comportamiento posterior sigue las reglas normales de continuidad (RN-013) y vuelta completa (RN-142): si el pedido no se cubre en una vuelta completa, el punto vuelve al número desde el que comenzó esa vuelta.
- El override no afecta atrasos, sanciones ni designaciones existentes; únicamente redefine el punto de partida de la Fase 2.

### Flujos alternativos:

- FA-1: Número de destino fuera de rango (`< 1` o `> cantidad_numeros`) → "Número fuera de rango"
- FA-2: Número de destino corresponde a un número inactivo (`activo = FALSE`) → sistema permite el override igualmente (el motor simplemente saltará ese número por estar inactivo, ver RN-014), pero muestra advertencia informativa
- FA-3: Error de BD al actualizar → cambio no persistido, mensaje de error mostrado

### Postcondiciones:

**Si exitoso:**
- `SECCIONALES.punto_rotacion` actualizado al nuevo valor
- Las próximas ejecuciones de la Fase 2 del motor comienzan desde ese número
- No se modifican ATRASOS, SANCIONES ni DESIGNACIONES existentes
- No se genera un evento de auditoría específico para esta acción (RN-128)

**Si falla:**
- `SECCIONALES.punto_rotacion` permanece sin cambios

### Reglas de negocio asociadas:

- RN-011: Lista fija y recorrido circular
- RN-012: Posición actual de la rotación ordinaria
- RN-013: Continuidad del recorrido ordinario
- RN-142: Vuelta completa de la rotación ordinaria
- RN-143 / RN-127: Override del punto de rotación
- RN-128: Sin auditoría del override

### Requerimientos asociados:

- REQ-UATRE-005: Override de rotación

### Casos de uso asociados:

- UC-UATRE-004: Registrar asistencia y cierre (dispara la Fase 2 del motor que usa este punto)
- UC-UATRE-010: Override puntual de asignación (override distinto: reasignación manual dentro de un pedido, no del punto de rotación)

### Diagramas de referencia:

- `diagrama-motor.md`: Fase 2 — Rotación ordinaria

---

## UC-UATRE-006: INHABILITAR / REHABILITAR TRABAJADOR PARA EMPRESA

**Identificador:** UC-UATRE-006  
**Nombre:** Inhabilitar/Rehabilitar trabajador  
**Tipo:** IMPORTANT  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

UATRE puede inhabilitar a un trabajador para una empresa específica (registro en INHABILITACIONES) o rehabilitarlo (elimina el registro). El modelo funciona **por excepción**: por defecto todos los trabajadores están habilitados para todas las empresas de la seccional; solo se registran las inhabilitaciones puntuales.

> **Nota de consolidación:** se corrigió RN-162, que originalmente preveía un motivo en texto libre para la inhabilitación. El esquema real de la tabla `INHABILITACIONES` (`BD/bd_uatre.sql`) no contempla esa columna, por lo que se decidió alinear la regla al esquema implementado: la inhabilitación no lleva motivo, solo el par (trabajador, empresa) y su fecha.

### Precondiciones:

**Para inhabilitar:**
1. UATRE autenticado (usuario tipo SECCIONAL, único actor autorizado — RN-161)
2. Trabajador y empresa pertenecen a la seccional de UATRE
3. No existe ya una inhabilitación para ese par (trabajador, empresa) — UNIQUE(trabajador_id, empresa_id)

**Para rehabilitar:**
1. UATRE autenticado
2. Existe una inhabilitación vigente para el par (trabajador, empresa)

### Flujo principal A: Inhabilitar trabajador

1. UATRE accede a la ficha del trabajador o de la empresa
2. Sistema muestra la lista de empresas (o trabajadores) para las que actualmente NO existe inhabilitación (habilitados por defecto)
3. UATRE selecciona el par trabajador-empresa a inhabilitar
4. Sistema valida que no exista ya una inhabilitación para ese par
5. UATRE confirma
6. Sistema inserta en INHABILITACIONES: `trabajador_id`, `empresa_id`, `fecha_inhabilitacion = NOW()`
7. Sistema confirma: "Trabajador inhabilitado para la empresa seleccionada"

### Flujo principal B: Rehabilitar trabajador

1. UATRE accede a la lista de inhabilitaciones vigentes (propias, filtradas por su seccional)
2. UATRE selecciona el par trabajador-empresa a rehabilitar
3. UATRE confirma
4. Sistema elimina la fila correspondiente de INHABILITACIONES
5. Sistema confirma: "Trabajador rehabilitado para la empresa seleccionada"

### Flujos alternativos:

- FA-1: Inhabilitación ya existe para ese par → "El trabajador ya está inhabilitado para esta empresa"
- FA-2: Trabajador o empresa no pertenecen a la seccional de UATRE → acceso denegado (RN-002, independencia por seccional)
- FA-3: Intento de rehabilitar un par sin inhabilitación vigente → "No existe una inhabilitación activa para este par"
- FA-4: Error de BD → cambio no persistido, mensaje de error mostrado

### Postcondiciones:

**Si exitoso (inhabilitar):**
- Nueva fila en INHABILITACIONES para el par (trabajador, empresa)
- El motor de nombramiento (Fase 1, Fase 2 y Etapas de cobertura excepcional) excluye a ese trabajador de futuras designaciones para esa empresa
- Designaciones ya vigentes de ese trabajador para esa empresa NO se ven afectadas (RN-164)
- No se conserva historial de este cambio (RN-163): solo el estado actual

**Si exitoso (rehabilitar):**
- Fila eliminada de INHABILITACIONES
- El trabajador vuelve a ser elegible para esa empresa en futuras evaluaciones del motor

**Si falla:**
- Ningún cambio persistido

### Reglas de negocio asociadas:

- RN-002: Independencia por seccional
- RN-049: Falta de habilitación durante la rotación ordinaria (efecto sobre atrasos cuando el motor encuentra un trabajador inhabilitado)
- RN-050: Habilitación obligatoria en toda designación (aplica también a intervenciones manuales, incluido UC-UATRE-010)
- RN-160: Modelo de inhabilitaciones por excepción
- RN-161: Solo UATRE puede inhabilitar
- RN-162: Sin motivo registrado (corregida en esta consolidación)
- RN-163: Sin historial de inhabilitaciones
- RN-164: Inhabilitación solo afecta futuras designaciones

### Requerimientos asociados:

- REQ-UATRE-006: Inhabilitar/rehabilitar

### Casos de uso asociados:

- UC-UATRE-004: Registrar asistencia y cierre (el motor consulta las inhabilitaciones vigentes durante sus 3 fases)
- UC-UATRE-010: Override puntual de asignación (la habilitación también es obligatoria en overrides manuales, RN-050)

---

## UC-UATRE-007: APLICAR SANCIÓN A TRABAJADOR

**Identificador:** UC-UATRE-007  
**Nombre:** Aplicar sanción  
**Tipo:** IMPORTANT  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

UATRE registra una sanción sobre un trabajador indicando una cantidad de turnos de sanción. Mientras existan `turnos_pendientes > 0`, el trabajador queda bloqueado para la designación por Fase 1 (Atrasados) y Fase 2 (Rotación ordinaria) del motor, siendo elegible únicamente en la Etapa 2 de cobertura excepcional (sancionados presentes).

> **Nota de consolidación:** se precisó RN-159, que hablaba de "motivo no obligatorio". El esquema real de `SANCIONES` no contempla ninguna columna de motivo (ni obligatoria ni opcional); la regla se ajustó para reflejar exactamente el modelo implementado.

### Precondiciones:

**Para aplicar sanción:**
1. UATRE autenticado (usuario tipo SECCIONAL)
2. Trabajador pertenece a la seccional de UATRE
3. Cantidad de turnos a aplicar es un entero positivo

**Para quitar sanción manualmente:**
1. UATRE autenticado
2. Trabajador tiene una sanción vigente (`turnos_pendientes > 0`)

### Flujo principal A: Aplicar sanción

1. UATRE accede a la ficha del trabajador
2. UATRE indica la cantidad de turnos de sanción a aplicar
3. Sistema valida que la cantidad sea un entero positivo
4. UATRE confirma
5. Sistema verifica si ya existe un registro en SANCIONES para ese trabajador:
   - Si existe: suma la cantidad indicada a `turnos_pendientes` (RN-157, sanciones acumulables)
   - Si no existe: crea un nuevo registro con `turnos_pendientes` = cantidad indicada, `fecha_inicio = NOW()`
6. Sistema confirma: "Sanción aplicada: N turnos pendientes"

### Flujo principal B: Quitar sanción manualmente

1. UATRE accede a la ficha del trabajador sancionado
2. Sistema muestra `turnos_pendientes` actuales
3. UATRE elige "Quitar sanción"
4. Sistema solicita confirmación
5. UATRE confirma
6. Sistema actualiza `SANCIONES.turnos_pendientes = 0` y `fecha_fin = NOW()`
7. Sistema confirma: "Sanción removida"

### Comportamiento posterior a la sanción (efectos en el motor):

- Mientras `turnos_pendientes > 0`, el trabajador queda excluido de Fase 1 (Atrasados) y Fase 2 (Rotación ordinaria) del motor (RN-045)
- Si el trabajador tiene simultáneamente atrasos pendientes, estos permanecen sin cambios mientras la sanción esté vigente (RN-045); al agotarse la sanción, vuelve a usar su prioridad como atrasado
- Se descuenta exactamente **1 turno de sanción** cuando el trabajador cumple las condiciones de RN-041 (presente hoy y ayer, cumple las demás condiciones, y la sanción es lo único que impide su designación) — trigger `trg_gestionar_sancion_al_llegar_a_cero` cierra la sanción automáticamente al llegar a 0
- Si el trabajador es designado mediante **cobertura excepcional** (Etapa 2, sancionados presentes) NO se descuenta ningún turno de sanción, conservando la totalidad de los pendientes (RN-046)

### Flujos alternativos:

- FA-1: Cantidad de turnos ≤ 0 → "Debe indicar una cantidad válida de turnos"
- FA-2: Trabajador no pertenece a la seccional de UATRE → acceso denegado (RN-002)
- FA-3: UATRE intenta quitar una sanción inexistente (`turnos_pendientes` ya es 0) → "El trabajador no tiene sanciones pendientes"
- FA-4: Error de BD → cambio no persistido, mensaje de error mostrado

### Postcondiciones:

**Si exitoso (aplicar):**
- `SANCIONES.turnos_pendientes` incrementado (nuevo o acumulado, RN-157)
- `SANCIONES.fecha_inicio` establecida si es un registro nuevo
- El trabajador queda excluido de Fase 1 y Fase 2 del motor mientras dure la sanción

**Si exitoso (quitar manualmente):**
- `SANCIONES.turnos_pendientes = 0`
- `SANCIONES.fecha_fin = NOW()`
- El trabajador recupera elegibilidad normal en Fase 1 y Fase 2

**Si falla:**
- Ningún cambio persistido

### Reglas de negocio asociadas:

- RN-002: Independencia por seccional
- RN-039: Modalidades de sanción
- RN-040: Turnos de sanción pendientes
- RN-041: Descuento de un turno de sanción
- RN-042: Sanciones de varios turnos
- RN-043: Fin de sanción por turnos
- RN-044: Sanción mediante quita de atrasos
- RN-045: ATRASADO + sanción por turnos
- RN-046: Designación excepcional de un sancionado
- RN-157: Sanciones acumulables
- RN-158: Cierre de sanción
- RN-159: Sin motivo registrado (corregida en esta consolidación)

### Requerimientos asociados:

- REQ-UATRE-007: Aplicar sanción

### Casos de uso asociados:

- UC-UATRE-004: Registrar asistencia y cierre (el motor evalúa sanciones vigentes en sus 3 fases)
- UC-UATRE-006: Inhabilitar/Rehabilitar trabajador (mecanismo análogo de restricción manual sobre elegibilidad)

---

## UC-UATRE-008: VER PIZARRÓN ACTUAL

**Identificador:** UC-UATRE-008  
**Nombre:** Ver pizarrón actual  
**Tipo:** CRITICAL  
**Estado:** ✅ Documentado por referencia (pizarrón unificado)

### Descripción

El pizarrón que ve UATRE es el mismo pizarrón unificado ya documentado en **UC-TRABAJADOR-002: Ver pizarrón**. No existen diferencias de contenido entre lo que ve UATRE y lo que ve TRABAJADOR: mismas 6 secciones, mismo auto-refresh de 30 segundos, misma información no confidencial.

Este UC se mantiene como entrada separada por pertenecer al documento de casos de uso de UATRE, pero remite íntegramente a UC-TRABAJADOR-002 para su flujo, postcondiciones y reglas.

### Requerimientos asociados:

- REQ-UATRE-008: Ver pizarrón actual

### Casos de uso asociados:

- UC-TRABAJADOR-002: Ver pizarrón (documentación completa del flujo; nota: la referencia a REQ-TRABAJADOR-004 fue corregida allí durante esta revisión)

### Flujo automático del sistema asociado (sin actor humano directo):

- REQ-SISTEMA-003: Renovación pizarrón 00:00 — los pedidos completados salen del pizarrón y los pedidos sin cubrir se transfieren al nuevo día.
  **⚠️ D-09:** los pedidos vencidos se cierran como NO_CUBIERTO; verificar
  `decisiones-pendientes.md` antes de implementar la transferencia.

---

## UC-UATRE-009: VER HISTORIAL DE PIZARRÓN

**Identificador:** UC-UATRE-009  
**Nombre:** Historial de pizarrón  
**Tipo:** FUNDAMENTAL  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

UATRE puede consultar el estado del pizarrón correspondiente a fechas anteriores, a diferencia del pizarrón actual (UC-UATRE-008) que muestra únicamente el día en curso. La consulta se resuelve íntegramente sobre la tabla `PEDIDO_HISTORIAL`, que conserva una "foto" de cada pedido tal como quedó al cierre de la jornada correspondiente.

### Precondiciones:

1. UATRE autenticado (usuario tipo SECCIONAL)
2. Existen registros en PEDIDO_HISTORIAL para la seccional de UATRE (jornadas ya cerradas)

### Flujo principal:

1. UATRE accede a la sección de historial del pizarrón
2. Sistema muestra un selector de fecha (limitado a fechas con jornada ya cerrada)
3. UATRE selecciona una fecha anterior
4. Sistema consulta PEDIDO_HISTORIAL filtrando por `seccional_id` y `fecha` seleccionada
5. Sistema muestra, por cada pedido de esa jornada:
   - Empresa (`empresa_id`)
   - Horario de inicio
   - Tarea, establecimiento
   - Cantidad requerida vs. cantidad de designados (`cantidad_requerida`, `cantidad_designados`)
   - Estado final del pedido (`estado_final`: CUBIERTO, NO_CUBIERTO, CANCELADO, etc.)
6. UATRE puede navegar a otra fecha repitiendo el flujo

### Flujos alternativos:

- FA-1: Fecha seleccionada no tiene jornadas cerradas → "No hay historial disponible para esta fecha"
- FA-2: Fecha seleccionada es el día actual (jornada aún no cerrada) → sistema redirige a UC-UATRE-008 (pizarrón actual), ya que el histórico solo existe después del cierre
- FA-3: Error de BD → mensaje de error genérico, opción de reintentar

### Postcondiciones:

**Si exitoso:**
- Historial de la fecha seleccionada mostrado correctamente
- No se modifica ningún dato (consulta de solo lectura)

**Si falla:**
- Error mostrado, sin datos parciales incorrectos

### Alcance y limitaciones (RN-165 — Historial simplificado):

- Solo se conserva `PEDIDO_HISTORIAL` como snapshot del pedido al cierre de jornada
- **No se registra** historial separado de: ATRASOS, SANCIONES, HABILITACIONES/INHABILITACIONES, DESIGNACIONES individuales, ni de acciones manuales de UATRE (incluidos los overrides de UC-UATRE-005 y UC-UATRE-010, ver RN-128)
- Por lo tanto, este UC muestra el resultado final de cada pedido, pero no permite reconstruir el detalle de qué trabajador específico fue designado en cada uno más allá de `cantidad_designados` (cantidad, no identidad)

### Reglas de negocio asociadas:

- RN-121: Pizarrón histórico
- RN-122: Consulta UATRE
- RN-165: Historial simplificado

### Requerimientos asociados:

- REQ-UATRE-009: Historial de pizarrón

### Casos de uso asociados:

- UC-UATRE-008: Ver pizarrón actual (contraparte para el día en curso)
- UC-UATRE-004: Registrar asistencia y cierre (genera el snapshot en PEDIDO_HISTORIAL al cerrar la jornada)

---

## UC-UATRE-010: OVERRIDE PUNTUAL DE ASIGNACIÓN

**Identificador:** UC-UATRE-010  
**Nombre:** Override puntual de asignación  
**Tipo:** IMPORTANT  
**Estado:** ✅ COMPLETAMENTE DOCUMENTADO

### Descripción

UATRE puede modificar manualmente qué trabajador quedó designado dentro de un pedido específico, reemplazando una designación generada por el motor (o creada manualmente) por otro trabajador. Es un override distinto al de UC-UATRE-005: aquí se interviene sobre una **designación puntual de un pedido**, no sobre el punto de partida general de la rotación.

> **Nota de consolidación:** esta funcionalidad corresponde a RN-126 (`business-rules.md`, sección 31 "Overrides administrativos"), que hasta esta actualización no tenía REQ ni UC asignado. Se creó este caso de uso nuevo para cubrirla, en lugar de ampliar el alcance de UC-UATRE-005, para mantener responsabilidad única por caso de uso.

### Precondiciones:

1. UATRE autenticado (usuario tipo SECCIONAL)
2. El pedido existe y pertenece a la seccional de UATRE
3. El pedido tiene al menos una designación vigente (estado `DESIGNADO` o `TRABAJANDO`) que se desea reemplazar
4. El trabajador de reemplazo cumple las condiciones mínimas de designación (no está ya designado/trabajando en otro pedido simultáneo, está habilitado para la empresa del pedido)

### Flujo principal:

1. UATRE accede al detalle de un pedido con designaciones vigentes
2. Sistema muestra los trabajadores actualmente designados para ese pedido
3. UATRE selecciona la designación que desea reemplazar y elige un trabajador sustituto (de la lista de rotación de la seccional)
4. Sistema valida que el trabajador sustituto:
   - Esté habilitado para la empresa del pedido (RN-050)
   - No esté ya DESIGNADO/TRABAJANDO en otro pedido simultáneo
5. Sistema solicita confirmación
6. UATRE confirma
7. Sistema ejecuta el reemplazo:
   - La designación original pasa a `estado = CANCELADO`
   - Se crea una nueva fila en DESIGNACIONES para el trabajador sustituto, con `estado = DESIGNADO`
   - Aplica **1 turno de sanción** al trabajador reemplazado (RN-083 y RN-126, decisión aprobada); no aplica por analogía los efectos de cancelación del pedido (RN-074)
8. Sistema confirma el reemplazo

### Flujos alternativos:

- FA-1: Trabajador sustituto no habilitado para la empresa → "Trabajador no habilitado para esta empresa"
- FA-2: Trabajador sustituto ya está DESIGNADO/TRABAJANDO en otro pedido → "Trabajador no disponible"
- FA-3: Pedido ya alcanzó su horario de inicio (equivalente a RN-073 para cancelación) → override rechazado, mensaje "El pedido ya está en curso"
- FA-4: Error de BD durante el reemplazo → operación revertida, ninguna designación modificada

### Postcondiciones:

**Si exitoso:**
- Designación original: `estado = CANCELADO`
- Trabajador reemplazado: recibe 1 turno de sanción (RN-083 y RN-126)
- Nueva designación creada para el trabajador sustituto: `estado = DESIGNADO`
- El historial del pedido conserva únicamente el resultado final resumido; no registra la identidad del trabajador efectivamente designado ni las designaciones individuales (RN-165)
- No se genera un evento de auditoría específico para la acción de override en sí (RN-128)

**Si falla:**
- Ninguna designación modificada

### Reglas de negocio asociadas:

- RN-050: Habilitación obligatoria en toda designación
- RN-073: Pedido iniciado (límite temporal, aplicado por analogía al override)
- RN-083: Reemplazo del designado con un turno de sanción (decisión aprobada)
- RN-126: Override puntual de asignación
- RN-128: Sin auditoría del override

### Requerimientos asociados:

- REQ-UATRE-013: Override puntual de asignación.

### Casos de uso asociados:

- UC-UATRE-005: Override de rotación (override distinto: afecta el punto de partida general, no una designación puntual)
- UC-UATRE-007: Aplicar sanción (mecanismo similar de intervención manual sobre elegibilidad)

---
