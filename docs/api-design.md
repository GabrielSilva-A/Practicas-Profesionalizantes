# Diseño de API — UATRE

**Fase:** 8 — EN PROCESO

**Fecha:** 2026-10-01

**Estado:** Diseño inicial; no es una API implementada

## 1. Alcance y fuentes

API Express en JavaScript para cliente Vite + React, PostgreSQL y Prisma.
Fuentes: [requirements.md](./requirements.md), [business-rules.md](./business-rules.md),
[uc-uatre.md](./uc-uatre.md), [uc-empresa.md](./uc-empresa.md),
[uc-trabajador.md](./uc-trabajador.md) y [modelo-dominio.md](./modelo-dominio.md).
Decisiones y bloqueos: [decisiones-pendientes.md](./decisiones-pendientes.md).

Las convenciones HTTP siguientes son propuestas de diseño de esta fase, no nuevas
reglas de negocio. Los contratos con dudas identificadas son provisionales.
El [openapi.yaml](./openapi.yaml) cubre solo el subconjunto indicado en sección 7.
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

- Propuesta: cookie opaca `uatre_session`; su almacenamiento y biblioteca quedan pendientes.
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
- D-29 a D-33 conservan precisiones pendientes de sesión, cuentas e identificación.
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

**Fuentes:** RN-150/169, UC-TRABAJADOR-001 y 008. Acceso centralizado por tipo;
políticas exactas de seccional/empresa requieren D-29 y D-32.

- Público. Entrada propuesta: `identificador`, `password`, ambos requeridos;
  identificador permite nombre o email para trabajador. No permite seleccionar rol.
- Nombre es el nombre propio consignado al registrar al trabajador, no alias único;
  tratamiento de homónimos/comparación pendiente D-33. Alta por UATRE, no autorregistro.
  Acceso de empresa/seccional conserva email documentado. No crear columna de alias SQL.
- Verifica identidad, bcrypt, cuenta activa y primer login; sin bloqueo por fallos.
- 200: cookie + `data: { usuario_id, tipo, primera_vez_login }`.
  Primer login devuelve sesión restringida y no habilita otros módulos.
- 401 `CREDENCIALES_INVALIDAS`: mensaje genérico para identificador/contraseña incorrectos.
- 403 `CUENTA_INACTIVA`; 422 `VALIDACION`. No hay respuesta INTENTOS_EXCEDIDOS.
- No devolver hash ni contraseña. Persistencia de auditoría pendiente D-30.
- **Provisional:** D-29, D-30, D-32, D-33, D-35 y D-36. Google está aprobado como
  modalidad futura; aclarar coexistencia/sustitución antes de cerrar login local.

### GET /auth/me

- Sesión normal o restringida. 200 con el mismo DTO de identidad de login.
- 401 `SESION_INVALIDA` cuando expira/no existe.
- Consulta de solo lectura; no devuelve email, documento ni datos de otras cuentas.

### POST /auth/logout

- Invalida sesión y borra cookie. 204 sin cuerpo, también si no había sesión vigente.
- No modifica al trabajador, su asistencia o su designación.

### PATCH /auth/password

**Fuentes:** RN-169; UC-TRABAJADOR-008.

- Contrato inicial exclusivo para cambio obligatorio de TRABAJADOR.
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

- Público, alta inicial documentada; no inventar aprobación por superadmin.
- Entrada: `numero`, `localidad`, `provincia`, `email`, `password`, `cantidad_numeros`.
- Número/email únicos; cantidad entera >0; campos requeridos según UC.
- Transacción: seccional con punto 1, N números libres y activos, usuario SECCIONAL.
- 201: `{ id, numero, localidad, provincia, cantidad_numeros, punto_rotacion, activo }`.
- 409 `SECCIONAL_DUPLICADA` / `EMAIL_EN_USO`; 422 `VALIDACION`.
- No crea sesión automática: UC dirige a login. Política de password de alta
  necesita definición; no copiar automáticamente la política del trabajador.

### GET /seccionales — selector de registro

- Público; lista únicamente `{ id, numero, localidad, provincia }` de seccionales activas.
- 200 con lista paginada; no publicar email ni datos operativos. El selector debe
  poder obtener todas las páginas. Fuentes: RN-139; UC-UATRE-003.

### GET /seccionales/me

- SECCIONAL; identidad desde sesión. 200 con DTO de seccional anterior, sin usuarios.
- 401/403; sin cambios de datos. Configurar tamaño de lista queda bloqueado por D-18.

### POST /empresas/registro

**Fuentes:** RN-003/139; UC-UATRE-003, flujo A.

- Público. Entrada: `nombre`, `localidad`, `provincia`, `seccional_id`, `email`, `password`.
- Seccional existente y activa, email único. Transacción empresa activa + usuario EMPRESA.
- 201: `{ id, nombre, localidad, provincia, seccional_id, activa }`; sin sesión automática.
- 409 `EMAIL_EN_USO`; 422 `SECCIONAL_NO_DISPONIBLE` / `VALIDACION`.
- No aceptar `activa`, tipo de usuario ni permisos elegidos por el cliente.
- Política de password empresarial no especificada; contrato provisional.

### POST /empresas — alta por UATRE

- SECCIONAL; mismo conjunto de datos empresariales, seccional desde sesión.
- No fijar todavía campos de contraseña ni respuesta de credenciales: **D-31**.
- Transacción empresa + usuario. 201, 409 `EMAIL_EN_USO`, 422 `VALIDACION`, 401/403.

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
- **Provisional:** significado temporal de asistencia D-02/D-04 y acceso inactivo D-32.
  No convertir condiciones coexistentes en un único estado.

## 7. Estado del contrato formal

OpenAPI 3.1 inicial cubre login, me, logout y estado personal. Incluye DTOs, cookie,
respuestas y marcas `x-decision-pendiente`. Es un subconjunto de diseño; no describe
servidor real ni acredita implementación. Cambio de contraseña y altas se incorporarán
al contrato formal al precisar sus validaciones pendientes.

Operaciones mutables exigen cerrar el mecanismo CSRF antes de implementación.
La validación sintáctica del archivo no equivale a revisión semántica completa OpenAPI.

## 8. Próximos módulos y cierre

1. Resolver D-29 a D-33 y D-35/D-36 al cerrar acceso y administración; recuperación
   por email D-34 queda pendiente para implementación posterior.
2. Rotación, catálogos, asistencia y disponibilidad (D-01 a D-05, D-17 a D-19).
3. Pedidos, motor y designaciones (D-06 a D-14, D-20, D-23 a D-27).
4. Pizarrón e historial (D-15 y D-16).
5. Ampliar OpenAPI y revisar cada operación contra RN/REQ/UC, errores,
   privacidad, transacciones y casos límite. Solo entonces evaluar cierre de fase.
