# Diseño de API — UATRE

**Fase:** 8 — EN PROCESO; acceso y registros iniciales implementados

**Fecha:** 2026-10-01

**Estado:** Implementación parcial; acceso y registros iniciales conectados a PostgreSQL. Las vistas principales siguen pendientes.

## 1. Alcance y fuentes

API Express en JavaScript para cliente Vite + React, PostgreSQL y Prisma.
Fuentes: [requirements.md](./requirements.md), [business-rules.md](./business-rules.md),
[uc-uatre.md](./uc-uatre.md), [uc-empresa.md](./uc-empresa.md),
[uc-trabajador.md](./uc-trabajador.md) y [modelo-dominio.md](./modelo-dominio.md).
Decisiones y bloqueos: [decisiones-pendientes.md](./decisiones-pendientes.md).

Las convenciones HTTP siguientes son propuestas de diseño de esta fase, no nuevas
reglas de negocio. Los contratos con dudas identificadas son provisionales.
El [openapi.yaml](./openapi.yaml) formaliza el contrato parcial descrito en sección 7.
La base mínima se documenta en [architecture.md](./architecture.md); Fase 7 está
EN CONSOLIDACIÓN, no completada. Bibliotecas de sesión/jobs y otras precisiones
siguen pendientes.

## 2. Comunicación y responsabilidades

```text
React → HTTPS / JSON → Express → caso de uso → Prisma / PostgreSQL
React ← respuesta filtrada por actor ← Express
Procesos programados → lógica de servidor / funciones SQL
```

- React presenta datos y validaciones orientativas; no decide permisos ni elegibilidad.
- Express autentica, autoriza, valida entradas y delimita la transacción del caso de uso.
- Prisma accede a datos; funciones SQL y triggers conservan sus responsabilidades
  comprobadas. No volver a ejecutar en JavaScript un efecto ya aplicado en SQL.
- Los procesos temporales necesitan ejecución programada, no triggers temporales.
  La biblioteca y despliegue del worker no están seleccionados.
- Transacciones deben incluir todos los efectos de una operación o revertirse.
  Reintentar una operación no puede generar credenciales, designaciones o descuentos duplicados.

## 3. Convenciones propuestas

### HTTP y rutas

- Prefijo `/api/v1`; recursos en español, sin acentos, nombres plurales.
- GET consulta; POST crea o ejecuta acción; PATCH modifica parcialmente;
  DELETE solo cuando la operación represente eliminar un recurso/condición.
- Cancelar pedido no significa borrarlo: se diseña como acción POST.
- JSON con campos `snake_case`, coherente con documentación del dominio.
- IDs enteros positivos. Campos desconocidos o protegidos se rechazan con 422.
- No aceptar rol, identidad operativa o seccional arbitrarios en operaciones
  autenticadas. Excepción: registros públicos definidos por RN-138/139.

### Respuestas y errores

Respuesta individual: `{ "data": { ... } }`. No devolver filas SQL completas.
Los DTO incluyen únicamente campos permitidos y explícitos.

```json
{
  "error": {
    "code": "VALIDACION",
    "message": "Revisá los datos ingresados",
    "details": [{ "field": "cantidad_numeros", "message": "Debe ser mayor a cero" }]
  }
}
```

`details` es opcional. No exponer SQL, stack traces, hashes ni datos de terceros.
Los códigos de error son estables; los mensajes son descriptivos, no lógica del cliente.

| HTTP | Uso |
| --- | --- |
| 200 | Consulta o acción con representación. |
| 201 | Recurso creado. |
| 204 | Acción exitosa sin cuerpo, por ejemplo logout. |
| 400 | JSON mal formado. |
| 413 | Cuerpo JSON superior al límite técnico de 16 KB. |
| 401 | Sin sesión válida o credenciales inválidas. |
| 403 | Actor no autorizado o cambio obligatorio pendiente. |
| 404 | Recurso inexistente o fuera del ámbito autorizado, sin revelar su existencia. |
| 409 | Conflicto de unicidad o estado operativo. |
| 422 | Campos válidos sintácticamente pero inválidos para la operación. |
| 500 / 503 | Fallo interno o indisponibilidad, sin detalles internos. |

### Listados

Propuesta: `page` (desde 1), `page_size` (por defecto 20, máximo 100), filtros
permitidos por operación y orden determinista con ID como último desempate.
Respuesta: `{ "data": [], "meta": { "page": 1, "page_size": 20, "total": 0 } }`.
Esta paginación no se aplica automáticamente a la cuadrícula o lista completa
del pizarrón: esas vistas requieren sus contratos específicos.

### Fechas y horarios

- Jornada: `YYYY-MM-DD`; horario local de pedido: `HH:mm:ss`.
- Instantes en respuestas: ISO 8601 con offset explícito o `Z`; nunca ambiguos.
- Reglas horarias evaluadas en Argentina UTC-3 (RN-168), con reloj del servidor.
- Propuesta técnica: configuración consistente `America/Argentina/Buenos_Aires`.
  La conversión de TIMESTAMP existentes y la configuración de conexiones deberán
  verificarse antes de implementar; no se migraron fechas en esta fase.

## 4. Sesión, autorización y privacidad

Base documental UC-TRABAJADOR-001: bcrypt, cookie HttpOnly/Secure/SameSite=Strict,
TTL de una hora. Las decisiones posteriores del usuario eliminan el bloqueo por
intentos fallidos y establecen renovación con actividad. JWT no forma parte del diseño aprobado.

- Sesión implementada para EMPRESA y SECCIONAL: identificador aleatorio opaco en
  cookie `uatre_session`, hash SHA-256 del identificador guardado en PostgreSQL,
  vencimiento a una hora y cookie HttpOnly/SameSite=Strict. `Secure` se activa
  en producción. La sesión no se renueva por consultas automáticas; renovación
  por interacción queda pendiente para las vistas protegidas.
- La cookie no expone contraseñas ni un rol que el cliente pueda modificar.
- HTTPS en entorno operativo. Arquitectura de mismo origen propuesta para cliente/API;
  en desarrollo Vite redirige `/api` hacia Express por proxy, según architecture.md.
  Puertos, ajustes de cookies locales y CORS si fuera necesario se definen al implementar.
- Operaciones mutables autenticadas necesitan protección CSRF; mecanismo pendiente
  de arquitectura. SameSite no sustituye por sí solo todo el diseño de protección.
- Cambiar contraseña renueva la sesión; logout la invalida en servidor y elimina cookie.
- Sesión restringida de primer login solo permite consultar identidad de sesión,
  cambiar contraseña y cerrar sesión. API devuelve 403 `CAMBIO_PASSWORD_REQUERIDO`
  en el resto de operaciones (RN-169).
- `/me` obtiene trabajador desde sesión. UATRE opera solo su seccional;
  Empresa solo sus pedidos y datos empresariales permitidos.
- La empresa nunca recibe identidad, números ni rotación de trabajadores.
- Pizarrón compartido no equivale a permiso de consultar fichas personales ajenas.
- No bloquear por número de intentos fallidos, ni por IP ni por cuenta.
- TTL de una hora renovable con navegación e interacción del usuario. Polling,
  reintentos automáticos y otros procesos en segundo plano no acreditan esa actividad.
  Precisar alcance por actor y cómo comunica el cliente la actividad (D-29).
  No renovar una sesión ya vencida; exige nuevo login.
- D-29 conserva pendiente la renovación de sesión por actividad. D-32 mantiene
  pendiente el acceso a vistas/datos históricos de entidades inactivas; el
  comportamiento de login aprobado en A-19 ya está implementado.
- Recuperación vía email queda para implementación futura (D-34), sin endpoint
  definido todavía. D-21 resuelta: mínimo 8 caracteres, mayúscula, minúscula,
  número y símbolo obligatorios para la nueva contraseña.
- Decisión posterior: guardar un correo válido de Gmail del trabajador (A-13).
  El acceso futuro será «Continuar con Google» (A-14), no correo+contraseña local.
  La modalidad Google está aprobada pero no implementada. Biblioteca, contratos
  de inicio/retorno y vinculación deben diseñarse cuando se aborde.
  Falta decidir si sustituye o complementa acceso por nombre/contraseña y el
  cambio inicial (D-35/D-36). Login local permanece provisional.
- Respuestas de credenciales y sesión: `Cache-Control: no-store`; nunca registrar
  contraseñas ni credenciales temporales en logs.

## 5. Contratos iniciales — acceso

### POST /auth/login

**Fuentes:** RN-150/169, UC-TRABAJADOR-001 y 008. En este MVP se autentican
cuentas EMPRESA y SECCIONAL; A-19 define el tratamiento de cuentas/entidades
inactivas para el login. El endpoint de renovación por actividad (D-29) y los
permisos sobre vistas/datos posteriores siguen pendientes de diseño; D-32 está
consolidada.

- Público. Implementado para las cuentas EMPRESA y SECCIONAL. Entrada:
  `identificador` (email), `password`, ambos requeridos; el identificador es
  exclusivamente el email (D-33 consolidada). No permite seleccionar rol.
- No se habilita login local de trabajadores: cuando se implemente, Google será
  el único acceso de trabajadores (D-35 consolidada). Alta por UATRE, no
  autorregistro. Acceso de empresa/seccional usa email. No crear columna de
  alias SQL.
- Verifica identidad, bcrypt, cuenta activa y sin bloqueo por fallos.
- 200: cookie + `data: { usuario_id, tipo, primera_vez_login: false }`.
  Primer login devuelve sesión restringida y no habilita otros módulos.
- La implementación actual solo autentica cuentas EMPRESA y SECCIONAL sin marca
  de primer acceso; devuelve `primera_vez_login: false`. La restricción para
  EMPRESA creada manualmente por UATRE se aplicará junto con la migración y el
  contrato de cambio de contraseña previstos en A-23.
- 401 `CREDENCIALES_INVALIDAS`: mensaje genérico para identificador/contraseña incorrectos.
- 403 `CUENTA_INACTIVA`; 422 `VALIDACION`. No hay respuesta INTENTOS_EXCEDIDOS.
- No devolver hash ni contraseña. No se guarda auditoría de login en esta etapa
  (D-30 consolidada).
- **Pendiente:** D-29 (endpoint de renovación por interacción) y D-36
  (vinculación de la identidad Google con el alta de UATRE). D-30, D-33 y D-35
  están consolidadas. Usuario desactivado no puede autenticarse; se permite
  login de cuentas activas aunque la empresa o seccional asociada esté inactiva.
  Google es la modalidad futura única de acceso de trabajador (D-35).

### GET /auth/me

- Sesión normal o restringida. 200 con el mismo DTO de identidad de login.
- Implementado: 200 con `data: null` cuando no hay una sesión válida; con una
  sesión válida devuelve la identidad de acceso permitida en esta etapa.
- Consulta de solo lectura; no devuelve email, documento ni datos de otras cuentas.

### POST /auth/logout

- Implementado: invalida sesión y borra cookie. 204 sin cuerpo, también si no
  había sesión vigente.
- No modifica al trabajador, su asistencia o su designación.

### PATCH /auth/password

**Fuentes:** RN-169; UC-TRABAJADOR-008; UC-UATRE-003, flujo B.

- Contrato inicial para el cambio obligatorio de TRABAJADOR y de EMPRESA creada
  manualmente por UATRE.
- Entrada: `nueva_password`, `confirmacion_password`.
- Requiere sesión restringida; coincidencia, mínimo 8 caracteres, al menos una
  mayúscula, una minúscula, un número y un símbolo; distinta de temporal.
  No imponer una lista exclusiva de símbolos no aprobada. D-21 consolidada.
- Transacción: actualizar hash y primera_vez_login=FALSE; renovar sesión tras éxito.
- 200 con DTO de identidad actualizado; 401 `SESION_INVALIDA`;
  403 `ACTOR_NO_AUTORIZADO`; 409 `CAMBIO_OBLIGATORIO_NO_APLICA`; 422 `VALIDACION`.
- No ofrecer cambio voluntario/recuperación como si ya estuviesen definidos.
- Esquema requiere A-06; `fecha_ultimo_cambio` del UC también necesita revisión de
  persistencia antes de añadirlo. **Provisional:** D-29, D-36 y A-06; mecanismo CSRF pendiente.

## 6. Contratos iniciales — administración

### POST /seccionales

**Fuentes:** RN-138, RN-149, RN-152; REQ-UATRE-001; UC-UATRE-001.

- Público, alta inicial implementada; no inventar aprobación por superadmin.
- Entrada: `numero`, `localidad`, `provincia`, `email`, `password`, `cantidad_numeros`.
- Número/email únicos; cantidad entera >0; campos requeridos según UC.
- Transacción: seccional con punto 1, N números libres y activos, usuario SECCIONAL.
  Las filas de rotación se insertan en PostgreSQL mediante `generate_series`;
  no se fijó un máximo de negocio. El statement tiene timeout de seguridad.
- 201: `{ id, numero, localidad, provincia, cantidad_numeros, punto_rotacion, activo }`.
- 409 `SECCIONAL_DUPLICADA` / `EMAIL_EN_USO`; 422 `VALIDACION`.
- No crea sesión automática: UC dirige a login. Política de password de alta
  necesita definición; no copiar automáticamente la política del trabajador.

### GET /seccionales — selector de registro

- Público; lista únicamente `{ id, numero, localidad, provincia }` de seccionales activas.
- 200 con `{ data: [...] }` y la lista completa de seccionales activas; no publicar
  email ni datos operativos. Este endpoint de selector no pagina en el MVP.
  Fuentes: RN-139; UC-UATRE-003.

### GET /seccionales/me

- SECCIONAL; identidad desde sesión. 200 con DTO de seccional anterior, sin usuarios.
- 401/403; sin cambios de datos.

### PATCH /seccionales/me/cantidad-numeros

**Fuentes:** RN-152; REQ-UATRE-014; UC-UATRE-001; A-26.

- SECCIONAL; entrada `{ cantidad_numeros }`. Requiere Origin permitido y JSON.
- Al aumentar, activa primero números libres históricos y crea posiciones nuevas
  solo si son necesarias. Al reducir, desactiva posiciones libres fuera del
  límite sin borrar sus filas.
- Rechaza sin efectos si hay números ocupados por encima del nuevo límite
  (`NUMEROS_OCUPADOS_FUERA_DE_RANGO`) o si el punto de rotación quedaría fuera
  (`PUNTO_ROTACION_FUERA_DE_RANGO`). UATRE debe resolverlos explícitamente.
- 200 con DTO de seccional actualizado; 422 `VALIDACION`; 401/403.

### POST /lista-rotacion/{numero}/liberar

**Fuentes:** RN-153/154; REQ-UATRE-012; UC-UATRE-001; A-24.

- SECCIONAL; el número y el trabajador se buscan exclusivamente dentro de la
  seccional de la sesión. Requiere Origin permitido y un cuerpo JSON vacío.
- Precondiciones: número activo y ocupado; el trabajador asociado no tiene
  designaciones en `DESIGNADO` o `TRABAJANDO`.
- Transacción: desasignar y desactivar el número; desactivar trabajador y usuario;
  reiniciar atrasos (`cantidad=0`, sin primer atraso) y sanciones (sin turnos ni
  sanción activa). Conserva las filas y el historial; no borra identidades.
- 200: `{ numero, activo: false, trabajador_id: null }`; 404 si el número no
  pertenece a la seccional o no está activo/ocupado; 409
  `TRABAJADOR_CON_DESIGNACION_ACTIVA` si existe una designación o trabajo activo.
- La reactivación no crea un trabajador nuevo porque documento y email son únicos
  globales; se diseña como operación separada.

### POST /trabajadores/{trabajador_id}/reactivar

**Fuentes:** RN-153; REQ-UATRE-012; UC-UATRE-001; A-25.

- SECCIONAL; entrada `{ numero_lista }`. El trabajador y el número se buscan
  únicamente en la seccional de la sesión.
- Precondiciones: trabajador y usuario inactivos; número libre. UATRE puede
  elegir cualquier número libre, incluido uno previamente liberado e inactivo.
- Transacción: activar trabajador y usuario; activar el número y vincularlo al
  trabajador. Conserva identidad, historial, contraseña y estado de primer
  acceso existente; no genera ni entrega credenciales.
- 200: ficha administrativa del trabajador reactivado; 404 si el trabajador o
  número no pertenecen a la seccional; 409 `TRABAJADOR_YA_ACTIVO` o
  `NUMERO_NO_DISPONIBLE`.

### POST /empresas/registro

**Fuentes:** RN-003/139; UC-UATRE-003, flujo A.

- Público, implementado. Entrada: `nombre`, `localidad`, `provincia`,
  `seccional_id`, `email`, `password`.
- Seccional existente y activa, email único. Transacción empresa activa + usuario EMPRESA.
- 201: `{ id, nombre, localidad, provincia, seccional_id, activa }`; sin sesión automática.
- 409 `EMAIL_EN_USO`; 422 `SECCIONAL_NO_DISPONIBLE` / `VALIDACION`.
- No aceptar `activa`, tipo de usuario ni permisos elegidos por el cliente.
- Política de contraseña empresarial/seccional aprobada para este MVP: campo
obligatorio, sin regla adicional de longitud o composición; bcrypt y límite
técnico de 72 bytes por compatibilidad segura. El parser JSON también limita los
cuerpos a 16 KB. No aplica a trabajadores.

### POST /empresas — alta por UATRE

**Fuentes:** REQ-UATRE-010; UC-UATRE-003, flujo B; RN-169; A-23.

- SECCIONAL; entrada `nombre`, `localidad`, `provincia`, `email`; la seccional
  se deriva exclusivamente de la sesión. No acepta contraseña, `seccional_id`,
  `activa`, tipo ni permisos del cliente.
- Transacción: empresa activa, usuario EMPRESA con el email como identificador,
  contraseña temporal aleatoria de 12 caracteres hasheada con bcrypt y
  `primera_vez_login=TRUE`. El secreto se devuelve una única vez al creador con
  `Cache-Control: no-store`; no se persiste ni se incluye en consultas posteriores.
- La sesión del primer acceso queda restringida al cambio de contraseña y logout;
  la empresa no crea pedidos hasta completarlo.
- 201: `{ empresa, credenciales_temporales: { email, password_temporal } }`;
  409 `EMAIL_EN_USO`; 422 `VALIDACION`; 401/403. Requiere Origin permitido y JSON.
- **Pendiente de implementación:** migración de `primera_vez_login` para EMPRESA,
  sesión restringida y ruta de cambio de contraseña. D-32 sigue aplicando luego
  del acceso para empresas inactivas.

### GET /empresas y GET /empresas/{empresa_id}

- SECCIONAL: listado paginado y detalle solo de su seccional. DTO empresarial sin
  credenciales. Filtro `activa` opcional. 200, 401/403, 404 `RECURSO_NO_ENCONTRADO`.
- Empresa consulta su propia ficha por GET `/empresas/me`, sin acceso al listado UATRE.
- Son contratos iniciales derivados de la gestión empresarial; no agregan edición.

### PATCH /empresas/{empresa_id}/actividad

**Fuentes:** UC-UATRE-003, flujo C.

- SECCIONAL; entrada `activa` booleana. Verifica pertenencia.
- 200 con DTO empresarial; repetir mismo valor no produce nuevos efectos.
- Empresa inactiva no crea nuevos pedidos. Pedidos EN_PROCESO/CUBIERTOS no se alteran.
- **Provisional:** pedidos en cola D-20 y acceso/sesiones D-32; no cancelar designaciones.

### Catálogos empresariales

**Fuentes:** RN-002, RN-052 a RN-054; A-27.

- EMPRESA administra solo sus establecimientos mediante
  `GET/POST /empresas/me/establecimientos` y
  `PATCH /empresas/me/establecimientos/{establecimiento_id}/actividad`.
  Las altas reciben `nombre`, `direccion`, `localidad` y `provincia`; no aceptan
  `empresa_id` ni `activo` elegido por el cliente.
- SECCIONAL administra las tareas de empresas de su ámbito mediante
  `GET/POST /empresas/{empresa_id}/tareas` y
  `PATCH /empresas/{empresa_id}/tareas/{tarea_id}/actividad`. El alta recibe
  únicamente `nombre`; no acepta empresa de otra seccional ni `activo` elegido
  por el cliente.
- Listados devuelven solo sus respectivas pertenencias y admiten filtro `activo`;
  altas responden 201 y actividad responde 200 con DTO sin credenciales.
- Se rechaza con 409 `CATALOGO_EN_USO_EN_PEDIDO_FUTURO` desactivar una tarea o
  establecimiento referenciado por un pedido futuro. No se modifica ni cancela
  el pedido como efecto indirecto.
- Todas las mutaciones requieren Origin permitido y JSON; recursos ajenos se
  responden con 404 genérico.

### Asistencia y cierre

**Fuentes:** RN-018/020/022/027/062/063/066/155/166/167; REQ-UATRE-002/003;
UC-UATRE-004; A-28.

- SECCIONAL opera exclusivamente la asistencia de su propia seccional y de la
  jornada actual mediante `POST /asistencia/hoy/abrir`,
  `PATCH /asistencia/hoy/registros/{trabajador_id}` y
  `POST /asistencia/hoy/cerrar`. Todas requieren Origin permitido y JSON.
- Apertura: crea solo los registros faltantes para números activos con
  `presente=false`, `verificado=false`, `cerrado=false`; no modifica los flags
  de presencia del trabajador. Repetirla no duplica registros.
- Actualización: entrada `{ presente }`; valida pertenencia, jornada sin cerrar
  y número activo. Actualiza `presente` y `verificado=true`. ANOTADO permanece
  independiente.
- Cierre: después de las 07:40 y solo si todos los registros están verificados.
  En una transacción sincroniza flags, descuenta atrasos por ausencia y ejecuta
  el procesamiento de la cola habilitada. Tras las 07:40 los pedidos esperan
  este cierre real, no usan asistencia anterior.
- 409 para asistencia ya cerrada, cierre temprano o registros sin verificar; 404
  para trabajador ajeno o no activo. No exponer resultados internos del motor.
- **Pendiente de implementación:** migración `asistencia.verificado`, ajuste de
  triggers para no resetear flags al abrir y rutas/servicio transaccional.

### POST /trabajadores

**Fuentes:** RN-140/141/151/169; REQ-UATRE-011; UC-UATRE-002.

- SECCIONAL. Entrada: `nombre`, `apellido`, `documento`, `telefono` opcional,
  `email`, `numero_lista`. Correo válido de Gmail obligatorio (A-13, D-22 resuelta).
- Validar formato y proveedor del email no verifica titularidad o existencia de
  la casilla. No enviar correos ni integrar Google como efecto implícito del alta.
- Valida unicidad global de documento/email y disponibilidad del número en su seccional.
- Transacción: trabajador, ocupación/activación del número y usuario con contraseña
  temporal aleatoria de 12 caracteres según RN-140, hasheada con bcrypt; flag de primer
  login TRUE. Trigger existente crea atraso inicial; no duplicar inserción.
- 201: `{ id, nombre, apellido, numero_lista, credenciales_temporales: { email, password_temporal } }`.
  Solo UATRE creador recibe secreto en respuesta de alta; nunca en GET/listados/logs.
- 409 `DOCUMENTO_EN_USO` / `EMAIL_EN_USO` / `NUMERO_OCUPADO`; 422 `VALIDACION`; 401/403.
- Error revierte toda el alta. Un reintento no vuelve a revelar el secreto persistido.
- **Provisional:** A-06 y efectos de acceso Google D-35/D-36, incluida generación
  de contraseña temporal; no implementado todavía.

### GET /trabajadores y GET /trabajadores/{trabajador_id}

- SECCIONAL; listado paginado, filtro `activo`, orden `numero_lista` con ID de desempate;
  sin número, posiciones al final. Detalle dentro de su seccional.
- DTO administrativo: id, nombre, apellido, documento, telefono, activo,
  numero_lista nullable. No devolver hashes ni contraseña temporal.
- 200, 401/403, 404. Ficha/estado detallado ampliable al diseñar asistencia y condiciones.

### GET /me/estado

**Fuentes:** REQ-TRABAJADOR-001; UC-TRABAJADOR-007.

- TRABAJADOR con primer cambio completado; ID tomado de sesión.
- 200: `numero_lista` nullable, `presente_hoy`, `presente_ayer`, `anotado`,
  `atrasos_pendientes`, `turnos_sancion_pendientes`, `designacion_vigente` nullable.
- Designación: id, pedido_id, empresa, tarea, establecimiento nullable, horario_inicio
  ISO, estado DESIGNADO/TRABAJANDO. Sin información de otros trabajadores.
- 401 `SESION_INVALIDA`; 403 `ACTOR_NO_AUTORIZADO` / `CAMBIO_PASSWORD_REQUERIDO`.
- El significado temporal de asistencia se consolida en A-28; D-32 mantiene
  pendiente el acceso de cuentas inactivas. No convertir condiciones coexistentes
  en un único estado.

## 7. Estado del contrato formal

OpenAPI 3.1 v0.2.0 cubre login, consulta/cierre de sesión, cambio de contraseña
inicial, estado personal y operaciones iniciales de registro/consulta/gestión de
seccionales, empresas y trabajadores. Incluye DTOs, errores, cookie, marcas
`x-decision-pendiente` y `x-implementation-status`. Las rutas sin esa última
marca están implementadas actualmente: healthchecks, login, consulta/cierre de
sesión, selector y registro público de seccionales, y registro público de empresas.
Las rutas marcadas `planned` son contratos futuros/provisionales y el cliente no
debe invocarlas hasta que exista su implementación. El contrato es un subconjunto
del sistema y no acredita la implementación de esas operaciones futuras.

Operaciones mutables del MVP exigen `Origin` exacto de un origen configurado y
`Content-Type: application/json`; `WEB_ORIGINS` se configura por entorno.
El mismo control debe aplicarse a futuras operaciones mutables.
Se verificaron la sintaxis JSON del documento (JSON es subconjunto válido de YAML),
las referencias internas y la unicidad de operationId. Esto no equivale a una
validación semántica completa contra OpenAPI.

## 8. Próximos módulos y cierre

1. Resolver D-29, D-30, D-32, D-33 y D-35/D-36 al cerrar acceso y administración;
   recuperación por email D-34 queda pendiente para implementación posterior. D-31
   está consolidada mediante A-23.
2. Implementar las migraciones y contratos formalizados de administración,
   catálogos, asistencia y disponibilidad antes de habilitar esos módulos.
3. Pedidos, motor y designaciones (D-06 a D-14, D-20, D-23 a D-27).
4. Pizarrón e historial (D-15 y D-16).
5. Ampliar OpenAPI y revisar cada operación contra RN/REQ/UC, errores,
   privacidad, transacciones y casos límite. Solo entonces evaluar cierre de fase.
