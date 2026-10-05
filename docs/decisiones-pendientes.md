# Decisiones y dudas — UATRE

**Fecha de registro:** 2026-10-01

**Estado:** Registro inicial para Fase 8 — Diseño de API

## Uso del registro

Los IDs son estables. Una duda abierta no autoriza a implementar una suposición.
Resolver las dudas cuando afecten al módulo trabajado, continuar con lo independiente
y actualizar las fuentes afectadas al aprobar una decisión. No registrar horas ficticias.

Estados: **ABIERTA**, **RESUELTA / PENDIENTE DE CONSOLIDACIÓN** y **CONSOLIDADA**.
Este registro no reemplaza las RN, REQ ni UC; permite seguir sus aclaraciones.

## Decisiones aprobadas

| ID | Decisión del usuario | Estado / impacto |
| --- | --- | --- |
| A-01 | Node.js + Express, Vite + React, JavaScript, PostgreSQL con Prisma. | Aprobada; reflejada en PROJECT_GUIDE y AGENTS. No aprueba otros paquetes. |
| A-02 | Monorepo simple: backend/ y frontend/, cada uno con package.json. | Aprobada e implementada en el scaffolding técnico. |
| A-03 | Consolidar documentación y estandarizar antes de programar; comenzar por Fase 8 tras preparar la skill. | Fase 8 en proceso; el diseño continúa y existe implementación inicial acotada de acceso y registros. |
| A-04 | Reemplazar manualmente un designado aplica +1 turno de sanción (RN-083). | Consolidada en RN-126, REQ-UATRE-013 y UC-UATRE-010. No cambia la cancelación del pedido. |
| A-05 | Estados internos PENDIENTE, EN_PROCESO, CUBIERTO, NO_CUBIERTO, CANCELADO; empresa con vista simplificada. | RESUELTA / PENDIENTE DE CONSOLIDACIÓN de equivalencia completa, ver D-27. |
| A-06 | Agregar primera_vez_login a USUARIOS para cambio obligatorio del trabajador. | RESUELTA en SQL (migración `20261001204500` aplicada; columna en `BD/bd_uatre.sql` y `schema.prisma`); PENDIENTE DE CONSOLIDACIÓN solo en documentación del esquema (`base_datos.md`). |
| A-07 | Mecanismo de notificación de designaciones se decide después. | Decisión de aplazamiento; D-26 consolidada: en esta etapa no se envían notificaciones, se informa en las vistas. |
| A-08 | No bloquear el acceso por cantidad de intentos fallidos, sin importar cuántos se hagan. | Consolidada en UC-TRABAJADOR-001 y contrato inicial; D-28 resuelta. No equivale a permitir acceso sin credenciales válidas. |
| A-09 | La sesión de una hora se renueva con navegación e interacción del usuario. | Actividad explícita aprobada mediante endpoint dedicado; refrescos automáticos no renuevan. Consolidada en D-29. |
| A-10 | El trabajador podía ingresar por nombre propio consignado en el registro o email con contraseña. | Reemplazada: por D-33, el login local de trabajador no se habilita y el identificador futuro es exclusivamente el email. UATRE mantiene el alta. |
| A-11 | Recuperación de contraseña por email se implementará más adelante. | Funcionalidad futura pendiente de diseño e implementación, D-34. |
| A-12 | Contraseña nueva de mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo obligatorios. | Consolidada en RN-169, UC-TRABAJADOR-008 y diseño de API. D-21 resuelta respecto de complejidad del cambio inicial. |
| A-13 | Usar y guardar un correo válido de Gmail del trabajador; el ingreso con Gmail se implementará más adelante. | Restricción de correo consolidada, D-22 resuelta. A-14 precisa modalidad Google. Acceso transitorio pendiente D-35; integración no implementada. |
| A-14 | El ingreso futuro del trabajador será mediante «Continuar con Google». | Autenticación Google aprobada como modalidad futura. No se implementó ni se eligió biblioteca. D-35 conserva pendiente sustitución del acceso local y transición. D-36 trata contraseña inicial y vinculación. |
| A-15 | Consolidar arquitectura mínima: monolito modular, PostgreSQL local y proxy Vite para /api; preservar y revisar SQL, sin duplicar efectos. | Documentada en architecture.md. PostgreSQL 18.6 verificado; `uatre_dev` creada con migración Prisma y `uatre_test` con esquema/fixtures. La conexión local se conserva solo en `backend/.env` ignorado por Git. La base preexistente `uatre_db` (13 tablas) no se modificó porque difiere del esquema físico actual de 15 tablas. |
| A-16 | Para este MVP, permitir acceso local por email y contraseña a empresas y seccionales; el acceso de trabajadores queda fuera hasta definir su transición a Google. | Implementado en formularios/API; no resuelve D-35/D-36 para trabajadores. |
| A-17 | Guardar sesiones opacas en PostgreSQL, identificador aleatorio en cookie HttpOnly/SameSite=Strict, expiración de una hora. | Implementado con hash SHA-256 del identificador en tabla `sesiones`; `Secure` en producción. Renovación por actividad queda pendiente para las vistas (D-29). |
| A-18 | Para altas públicas de empresas/seccionales, la contraseña es obligatoria pero no lleva mínimo de longitud ni composición en este MVP. | Hash bcrypt. Límite técnico de 72 bytes por el algoritmo; no extiende D-21, que corresponde al trabajador. |
| A-19 | Permitir login a una cuenta activa aunque la empresa o seccional asociada esté inactiva; no permitir login si el usuario está inactivo. | Implementado. Los permisos de acceso a vistas/datos históricos de entidades inactivas quedan pendientes y no se crean vistas en esta iteración. |
| A-20 | Proteger login, logout y registros públicos exigiendo Origin exacto en lista permitida y JSON. | Implementado; `WEB_ORIGINS` configura los orígenes permitidos por ambiente. |
| A-21 | No definir un máximo funcional para `cantidad_numeros` al registrar seccional. | Implementado sin tope de negocio; el valor debe caber en INTEGER y la sentencia de creación de puestos tiene timeout de 15 segundos. |
| A-22 | Usar el runner nativo `node:test` para las pruebas automatizadas iniciales. | Implementado sin dependencia adicional; cubre el bloque técnico actual. Librerías externas de pruebas siguen sin seleccionarse. |
| A-23 | En el alta manual de empresa, UATRE usa el email como identificador; el sistema genera una contraseña temporal y exige cambiarla en el primer acceso. | Consolidada en RN-169, REQ-UATRE-010, UC-UATRE-003 y el contrato `POST /empresas`. Requiere extender `primera_vez_login` a cuentas EMPRESA al implementar. |
| A-24 | Al liberar un número, desactivar trabajador y usuario, bloquear la operación con designación/trabajo activo y reiniciar atrasos y sanciones. | Consolidada en RN-153, REQ-UATRE-012, UC-UATRE-001 y el contrato de liberación. La reactivación de la misma identidad queda pendiente. |
| A-25 | Reactivar al mismo trabajador con un número libre elegido por UATRE y conservar la contraseña existente. | Consolidada en RN-153, REQ-UATRE-012, UC-UATRE-001 y el contrato de reactivación. No se crean identidades ni credenciales nuevas. |
| A-26 | Al reducir la cantidad de números, rechazar si hay puestos ocupados fuera del rango o si el punto de rotación queda fuera; no ajustar ni reasignar automáticamente. | Consolidada en RN-152, REQ-UATRE-014, UC-UATRE-001 y el contrato de configuración de lista. |
| A-27 | La empresa administra establecimientos; UATRE administra tareas por empresa. No se desactivan catálogos referenciados por pedidos futuros. | Consolidada en RN-052/RN-054 y contratos de catálogos. |
| A-28 | Asistencia usa `verificado` separado de presencia; flags solo se sincronizan al cierre; se espera el cierre manual tras 07:40; antecedente es última jornada cerrada; ANOTADO no altera presencia. | Consolidada en RN-018/020/027/063/155/166 y UC-UATRE-004. Requiere migración de asistencia y revisión de triggers. |

## Dudas de negocio abiertas

| ID | Pregunta / caso concreto | Fuentes | Contrato afectado |
| --- | --- | --- | --- |
| D-01 | **CONSOLIDADA:** `verificado` distingue un registro pendiente de una ausencia confirmada. | A-28; RN-166; UC-UATRE-004. | Apertura, actualización y cierre de asistencia. |
| D-02 | **CONSOLIDADA:** los flags no se resetean al abrir; se sincronizan atómicamente solo al cierre. | A-28; RN-062/RN-155; UC-UATRE-004. | Elegibilidad y procesamiento temprano. |
| D-03 | **CONSOLIDADA:** tras 07:40 sin cierre real, los pedidos esperan el cierre manual. | A-28; RN-018/RN-063/RN-066. | Creación de pedidos y cola. |
| D-04 | **CONSOLIDADA:** “ayer” es la última jornada cerrada; sin antecedente no hay elegibilidad ordinaria. | A-28; RN-020/RN-077/RN-105. | Elegibilidad ordinaria y atrasados. |
| D-05 | **CONSOLIDADA:** ANOTADO conserva presencia como condición independiente. | A-28; RN-027/RN-156; UC-UATRE-004. | Asistencia y ANOTADO. |
| D-06 | **CONSOLIDADA:** si la rotación ordinaria no cubre el pedido, el motor se detiene y UATRE autoriza manualmente la cobertura excepcional. | RN-086 a RN-090; contrato de cobertura excepcional. |
| D-07 | **CONSOLIDADA / NO APLICA:** la cobertura excepcional es manual; no hay recorrido excepcional automático que deba definir un punto de inicio. | D-06; RN-144. |
| D-08 | **CONSOLIDADA:** UATRE inicia manualmente el reprocesamiento de un pedido parcial hasta su horario de ingreso. | RN-086, RN-119, RN-167. |
| D-09 | **CONSOLIDADA:** los puestos de un pedido vencido se cierran como NO_CUBIERTO y no se designan después. Los pedidos no vencidos conservan la regla de transferencia de RN-119. | RN-119; REQ-SISTEMA-003. |
| D-10 | **CONSOLIDADA:** una designación futura vigente bloquea toda nueva designación del trabajador, sin evaluar superposición horaria. | RN-081, RN-093; disponibilidad. |
| D-11 | **CONSOLIDADA:** si se cancela antes del inicio una designación que consumió un atraso, se devuelve exactamente un atraso. | RN-074; UC-EMPRESA-003. |
| D-12 | **CONSOLIDADA:** la ocupación genera atraso solo si es el único impedimento para la designación; no se genera si también falla presentismo u otra condición. | RN-099; recorrido ordinario. |
| D-13 | **CONSOLIDADA:** una sanción se consume como máximo una vez por pedido; al consumirse el último turno, el trabajador no se designa en ese mismo procesamiento. | RN-041, RN-042, RN-045. |
| D-14 | **CONSOLIDADA:** se rechaza una quita de atrasos superior al saldo disponible. | RN-039, RN-044; UC-UATRE-007. |
| D-15 | **CONSOLIDADA:** el pizarrón muestra disponibilidad dinámica y refleja designaciones y LIBERAR posteriores al cierre de asistencia. | REQ-SISTEMA-005; UC-TRABAJADOR-002. |
| D-16 | **CONSOLIDADA:** el historial conserva el resultado final al cierre de la jornada; el pedido pertenece a la jornada de su horario de ingreso. | RN-118 a RN-120, RN-165; UC-UATRE-009. |
| D-17 | **CONSOLIDADA:** al liberar número se desactivan trabajador y usuario, se bloquea si hay designación/trabajo activo y se reinician atrasos/sanciones. La misma identidad se reactiva con un número libre elegido por UATRE y conserva su contraseña. | A-24/A-25; RN-153; UC-UATRE-001. | Baja y reactivación del trabajador. |
| D-18 | **CONSOLIDADA:** al reducir lista se rechaza si hay números ocupados o punto de rotación fuera del nuevo rango; UATRE debe liberar/reasignar trabajadores o aplicar override explícito primero. | A-26; RN-152; UC-UATRE-001. | Configuración de rotación. |
| D-19 | **CONSOLIDADA:** empresa administra establecimientos; UATRE administra tareas por empresa. Se rechaza la desactivación de un catálogo referenciado por un pedido futuro. | A-27; RN-052/RN-054; modelo-dominio. | Catálogos. |
| D-20 | **CONSOLIDADA:** los pedidos en cola de una empresa desactivada se mantienen y se procesan normalmente. | UC-UATRE-003; ciclo de pedido. |
| D-21 | **CONSOLIDADA:** nueva contraseña de mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo obligatorios. | RN-169 y UC-TRABAJADOR-008 alineados con A-12. | Cambio inicial; recuperación pendiente D-34. |
| D-22 | **CONSOLIDADA:** guardar correo válido de Gmail del trabajador. | A-13; RN-140; UC-UATRE-002. Validar formato y proveedor no prueba titularidad ni que la casilla esté activa. | Alta de trabajador; validación de titularidad y acceso futuro requieren diseño separado. |
| D-23 | **CONSOLIDADA:** se rechaza crear pedidos con horario de ingreso pasado, incluidos los inmediatos. | UC-EMPRESA-001; creación de pedidos. |
| D-24 | **CONSOLIDADA:** antes de procesarse, la empresa solo puede editar cantidad, horario y tarea; no puede cambiar establecimiento ni requisitos/habilitaciones. | RN-069; UC-EMPRESA-003. |
| D-25 | **CONSOLIDADA:** tras una cancelación, el mismo trabajador puede volver a ser designado para ese pedido si se reprocesa. | DESIGNACIONES; reemplazo y reprocesamiento. |
| D-26 | **CONSOLIDADA:** no se envían notificaciones en esta etapa; las designaciones y faltas de cobertura se muestran exclusivamente en las vistas correspondientes. | RN-082; UC-EMPRESA-001. |
| D-27 | **CONSOLIDADA:** la empresa ve Pendiente, En proceso, Completo, Sin cobertura y Cancelado. | RN-075; REQ-EMPRESA-004; UC-EMPRESA-002. |

## Precisiones adicionales detectadas al diseñar acceso y administración

| ID | Pregunta | Fuentes / impacto |
| --- | --- | --- |
| D-28 | **CONSOLIDADA:** no hay bloqueo por intentos fallidos; sustituye el bloqueo previo tras 5 fallos. | UC-TRABAJADOR-001 y OpenAPI alineados con A-08. |
| D-29 | **CONSOLIDADA:** la interfaz informa actividad explícita del usuario mediante un endpoint dedicado; clics, teclado y navegación pueden renovarla mientras la sesión siga vigente. El polling no la renueva. | UC-TRABAJADOR-001; RN-150. |
| D-30 | **CONSOLIDADA:** no se guarda auditoría de login en esta etapa. | UC-TRABAJADOR-001; RN-128. |
| D-31 | **CONSOLIDADA:** alta manual empresarial con email como identificador, contraseña temporal generada por el sistema y cambio obligatorio en el primer acceso. | A-23; RN-169; UC-UATRE-003. Requiere persistir `primera_vez_login` para EMPRESA al implementar. |
| D-32 | **CONSOLIDADA:** una cuenta activa asociada a entidad inactiva puede autenticarse, pero el sistema bloquea todo acceso posterior e informa que la entidad está inactiva. | UC-UATRE-003; UC-TRABAJADOR-001. |
| D-33 | **CONSOLIDADA:** el acceso de trabajador usa exclusivamente email como identificador; no se admite el nombre propio para login. | A-10 actualizado por esta decisión; UC-TRABAJADOR-001. |
| D-34 | **PENDIENTE DE DISEÑO E IMPLEMENTACIÓN:** recuperación por email futura. Definir solicitud, verificación, vigencia de enlace/código y cambio de contraseña cuando se aborde. | A-11. No existe endpoint ni servicio de envío implementado. |
| D-35 | **CONSOLIDADA:** cuando se implemente, Google será el único acceso de trabajadores. Hasta entonces no se habilita login local de trabajadores. | A-14; UC-TRABAJADOR-001. |
| D-36 | Si se adopta Google, ¿se deja de generar contraseña temporal y exigir cambio inicial al trabajador? ¿Cómo se vincula la identidad Google al trabajador previamente registrado por UATRE? | A-14 frente a RN-140, RN-169, A-06/A-12 y UC-UATRE-002. El alta por UATRE sigue vigente; no aprobar autorregistro ni acceso automático a correos no registrados. |

## Correcciones documentales y de diseño (no nuevas reglas aprobadas)

| ID | Hallazgo | Tratamiento |
| --- | --- | --- |
| C-01 | PROJECT_GUIDE/roadmap conservaban changas y FIFO de atrasados; RN-005, RN-054 y RN-103/104 establecen socios y cantidad/antigüedad. | Guía y resumen del roadmap alineados; revisar diagramas al diseñar motor. |
| C-02 | architecture.md fue citado como realizado sin existir. | **Ausencia subsanada:** se creó arquitectura mínima; Fase 7 EN CONSOLIDACIÓN. El cierre previo no se presume comprobado. Pendientes detallados en architecture.md. |
| C-03 | Triggers responden a datos, no al paso del tiempo. | Alinear REQ-SISTEMA-001 y UC-TRABAJADOR-004 en diseño de jobs; RN-167 ya lo aclara. |
| C-04 | Diagrama de motor omite efectos de ANOTADO y sanciones y discrepa en elegibilidad. | Contrastar RN-034, RN-041 y SQL antes de cerrar motor. |
| C-05 | Sección 33 de business-rules tiene 13 tablas y campos texto, frente al modelo físico de 15 tablas y FKs. | **SUBSANADA (2026-10-02):** §33.1 lista las 15 tablas (incluye ESTABLECIMIENTOS y TAREAS_EMPRESA) y §33.2 incorpora `primera_vez_login` y `verificado`. |
| C-06 | primera_vez_login aprobado para TRABAJADOR y EMPRESA creada manualmente, constaba como ausente de BD/bd_uatre.sql. | **SUBSANADA:** la columna existe en `BD/bd_uatre.sql` y `schema.prisma` (migración `20261001204500`) y ya está documentada en `base_datos.md` y `business-rules.md` §33. |

## Criterio para cerrar Fase 8

Cada contrato debe trazar sus fuentes, permisos, entradas, respuestas, errores y
efectos transaccionales. Si depende de una duda abierta, marcarlo provisional.
La fase no se completa solo por generar Markdown o un archivo OpenAPI.
