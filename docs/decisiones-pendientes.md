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
| A-02 | Monorepo simple: backend/ y frontend/, cada uno con package.json. | Aprobada; estructura de código todavía no creada. |
| A-03 | Consolidar documentación y estandarizar antes de programar; comenzar por Fase 8 tras preparar la skill. | Fase 8 en proceso; diseño, no implementación. |
| A-04 | Reemplazar manualmente un designado aplica +1 turno de sanción (RN-083). | Consolidada en RN-126, REQ-UATRE-013 y UC-UATRE-010. No cambia la cancelación del pedido. |
| A-05 | Estados internos PENDIENTE, EN_PROCESO, CUBIERTO, NO_CUBIERTO, CANCELADO; empresa con vista simplificada. | RESUELTA / PENDIENTE DE CONSOLIDACIÓN de equivalencia completa, ver D-27. |
| A-06 | Agregar primera_vez_login a USUARIOS para cambio obligatorio del trabajador. | RESUELTA / PENDIENTE DE CONSOLIDACIÓN en SQL y documentación del esquema. No se realizó una migración. |
| A-07 | Mecanismo de notificación de designaciones se decide después. | Decisión de aplazamiento; D-26 sigue abierta. |
| A-08 | No bloquear el acceso por cantidad de intentos fallidos, sin importar cuántos se hagan. | Consolidada en UC-TRABAJADOR-001 y contrato inicial; D-28 resuelta. No equivale a permitir acceso sin credenciales válidas. |
| A-09 | La sesión de una hora se renueva con navegación e interacción del usuario. | Actividad explícita aprobada; refrescos automáticos no renuevan. D-29 conserva pendiente alcance por actor y mecanismo de detección. |
| A-10 | Trabajador puede ingresar por nombre propio consignado en formulario de registro o email, siempre con contraseña. | No se eligió un alias único ni se aprobó autorregistro; UATRE mantiene el alta. Homónimos pendientes D-33. |
| A-11 | Recuperación de contraseña por email se implementará más adelante. | Funcionalidad futura pendiente de diseño e implementación, D-34. |
| A-12 | Contraseña nueva de mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo obligatorios. | Consolidada en RN-169, UC-TRABAJADOR-008 y diseño de API. D-21 resuelta respecto de complejidad del cambio inicial. |
| A-13 | Usar y guardar un correo válido de Gmail del trabajador; el ingreso con Gmail se implementará más adelante. | Restricción de correo consolidada, D-22 resuelta. A-14 precisa modalidad Google. Acceso transitorio pendiente D-35; integración no implementada. |
| A-14 | El ingreso futuro del trabajador será mediante «Continuar con Google». | Autenticación Google aprobada como modalidad futura. No se implementó ni se eligió biblioteca. D-35 conserva pendiente sustitución del acceso local y transición. D-36 trata contraseña inicial y vinculación. |
| A-15 | Consolidar arquitectura mínima: monolito modular, PostgreSQL local y proxy Vite para /api; preservar y revisar SQL, sin duplicar efectos. | Documentada en architecture.md. Usuario confirmó PostgreSQL instalado; versión/conexión pendientes de comprobación. Base de desarrollo y aplicaciones aún no creadas. |

## Dudas de negocio abiertas

| ID | Pregunta / caso concreto | Fuentes | Contrato afectado |
| --- | --- | --- | --- |
| D-01 | ¿Cómo distinguir sin verificar de AUSENTE si todos los registros nacen presente=FALSE? | RN-166; UC-UATRE-004 | Apertura, actualización y cierre de asistencia. |
| D-02 | ¿Qué jornada válida se usa antes del cierre? El reset de presente_hoy previo a copiarlo a presente_ayer puede perder la presencia anterior. | RN-062, RN-155; base_datos, triggers 1 y 2 | Elegibilidad y procesamiento temprano. |
| D-03 | Pasadas las 07:40 sin cierre real, ¿esperar o utilizar última asistencia cerrada? | RN-018, RN-063, RN-066 | Creación de pedidos y cola. |
| D-04 | ¿Ayer es calendario o última jornada operativa? ¿Cómo inicia una seccional sin asistencia anterior? | RN-020, RN-077, RN-105 | Elegibilidad ordinaria y atrasados. |
| D-05 | ¿Marcar ANOTADO en cuadrícula conserva presencia independiente? | RN-027, RN-156; UC-UATRE-004 | Asistencia y ANOTADO. |
| D-06 | ¿Motor se detiene tras rotación y UATRE autoriza cobertura excepcional? El diagrama describe asignación automática frente a reglas manuales. | RN-087 a RN-090; diagrama-motor | Cobertura excepcional. |
| D-07 | ¿Desde qué número inicia el recorrido circular de cada etapa excepcional? | RN-144 | Selección excepcional. |
| D-08 | ¿Quién y cuándo reprocesa un pedido parcial? ¿Cuál es el límite temporal? | RN-086, RN-119, RN-167 | Reprocesamiento y designaciones. |
| D-09 | ¿Qué sucede con puestos sin cubrir después del horario de ingreso? | RN-119; REQ-SISTEMA-003 | Pedidos vencidos y cambio de día. |
| D-10 | ¿Designación futura bloquea todo trabajo o solo horarios incompatibles? | RN-081, RN-093; modelo-dominio; índice uq_designacion_activa_trabajador | Disponibilidad y asignación. |
| D-11 | Si una designación consumió un atraso y el pedido se cancela, ¿devolver uno o devolver y agregar otro? | RN-074; UC-EMPRESA-003 | Cancelación y contabilidad de atrasos. |
| D-12 | ¿Se genera atraso por estar ocupado si también falla presentismo u otra condición? | RN-099 | Recorrido ordinario. |
| D-13 | ¿Puede descontarse sanción en varias fases/reintentos del mismo pedido? Al consumir el último turno, ¿puede designarse en ese procesamiento? | RN-041, RN-042, RN-045 | Evaluación y reprocesamiento. |
| D-14 | Quita de atrasos superior al saldo: ¿rechazar o descontar los disponibles? | RN-039, RN-044; UC-UATRE-007 | Sanción por quita de atrasos. |
| D-15 | ¿Disponibles es foto del cierre o refleja designaciones y LIBERAR posteriores? | REQ-SISTEMA-005; UC-TRABAJADOR-002 | Pizarrón y refresco. |
| D-16 | ¿Cuándo se toma snapshot y a qué fecha pertenece un pedido que atraviesa días sin duplicarse? | RN-118 a RN-120, RN-165; UC-UATRE-009 | Historial. |
| D-17 | Al liberar número, ¿qué ocurre con cuenta, trabajo activo, atrasos y sanciones? | RN-153; UC-UATRE-001 | Baja y reactivación del trabajador. |
| D-18 | ¿Cómo reducir lista con números ocupados o punto_rotacion fuera del nuevo rango? | RN-152 | Configuración de rotación. |
| D-19 | ¿Quién administra establecimientos? ¿Efectos de desactivar tareas/establecimientos usados por pedidos futuros? | RN-052, RN-054; modelo-dominio | Catálogos. |
| D-20 | ¿Se procesan pedidos en cola de empresa posteriormente desactivada? | UC-UATRE-003 | Activación y cola. |
| D-21 | **CONSOLIDADA:** nueva contraseña de mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo obligatorios. | RN-169 y UC-TRABAJADOR-008 alineados con A-12. | Cambio inicial; recuperación pendiente D-34. |
| D-22 | **CONSOLIDADA:** guardar correo válido de Gmail del trabajador. | A-13; RN-140; UC-UATRE-002. Validar formato y proveedor no prueba titularidad ni que la casilla esté activa. | Alta de trabajador; validación de titularidad y acceso futuro requieren diseño separado. |
| D-23 | ¿Se permiten pedidos con hora pasada? Ejemplos temporales frente a validación del UC. | UC-EMPRESA-001; diagrama-cola-vs-inmediato; base_datos | Creación de pedidos. |
| D-24 | ¿Campos editables solo cantidad/horario/tarea o también establecimiento y habilitaciones? | RN-069; UC-EMPRESA-003 | Edición de pedido. |
| D-25 | ¿Volver a designar al mismo trabajador al mismo pedido tras cancelación? UNIQUE(pedido_id, trabajador_id) lo impide. | base_datos, DESIGNACIONES | Reemplazo y reprocesamiento. |
| D-26 | ¿Canal de notificación al designado y alerta empresarial sin cobertura? | RN-082; UC-EMPRESA-001 | Notificaciones. |
| D-27 | ¿Equivalencia completa de estados visible por empresa? UC-EMPRESA-002 propone En proceso/Completo/Sin cobertura/Cancelado; REQ-EMPRESA-004 usa otro vocabulario. | RN-075; REQ-EMPRESA-004; UC-EMPRESA-002 | Respuestas empresariales de pedidos. |

## Precisiones adicionales detectadas al diseñar acceso y administración

| ID | Pregunta | Fuentes / impacto |
| --- | --- | --- |
| D-28 | **CONSOLIDADA:** no hay bloqueo por intentos fallidos; sustituye el bloqueo previo tras 5 fallos. | UC-TRABAJADOR-001 y OpenAPI alineados con A-08. |
| D-29 | **PARCIALMENTE RESUELTA:** TTL de 1 hora renovable con navegación/interacción del usuario, no con polling automático. Precisar alcance para empresa/seccional y mecanismo para comunicar actividad al servidor. | UC-TRABAJADOR-001; RN-150. No reiniciar sesión vencida por detectar actividad tardía. |
| D-30 | Auditoría de login: ¿qué información conservar y dónde? No confundir con auditoría de overrides descartada. | UC-TRABAJADOR-001; RN-128. No existe especificación de persistencia de login. |
| D-31 | Alta manual empresarial: contraseña temporal o inicial elegida; ¿cambio obligatorio también para empresa? | UC-UATRE-003, flujo B. Credenciales empresariales. |
| D-32 | Empresa/trabajador inactivo con usuario activo: ¿login y consultas históricas permitidos? ¿Seccional inactiva bloquea todas sus cuentas? | UC-UATRE-003; UC-TRABAJADOR-001; campos activo. Autorización. |
| D-33 | **PARCIALMENTE RESUELTA:** nombre propio consignado en formulario, no alias único. ¿Cómo distinguir trabajadores con el mismo nombre? Falta precisar comparación (espacios, mayúsculas y acentos) y colisiones con email. | A-10; UC-TRABAJADOR-001; nombre no es único y email sí. No seleccionar el primer homónimo ni inventar unicidad del nombre propio. |
| D-34 | **PENDIENTE DE DISEÑO E IMPLEMENTACIÓN:** recuperación por email futura. Definir solicitud, verificación, vigencia de enlace/código y cambio de contraseña cuando se aborde. | A-11. No existe endpoint ni servicio de envío implementado. |
| D-35 | **PARCIALMENTE RESUELTA:** «Continuar con Google» es autenticación Google, no email+contraseña local. ¿Reemplaza nombre/contraseña o coexiste? ¿Qué acceso se permite antes de implementarlo? | A-14 frente a A-10 y UC-TRABAJADOR-001. No publicar como definitivo el login local ni eliminarlo silenciosamente. |
| D-36 | Si se adopta Google, ¿se deja de generar contraseña temporal y exigir cambio inicial al trabajador? ¿Cómo se vincula la identidad Google al trabajador previamente registrado por UATRE? | A-14 frente a RN-140, RN-169, A-06/A-12 y UC-UATRE-002. El alta por UATRE sigue vigente; no aprobar autorregistro ni acceso automático a correos no registrados. |

## Correcciones documentales y de diseño (no nuevas reglas aprobadas)

| ID | Hallazgo | Tratamiento |
| --- | --- | --- |
| C-01 | PROJECT_GUIDE/roadmap conservaban changas y FIFO de atrasados; RN-005, RN-054 y RN-103/104 establecen socios y cantidad/antigüedad. | Guía y resumen del roadmap alineados; revisar diagramas al diseñar motor. |
| C-02 | architecture.md fue citado como realizado sin existir. | **Ausencia subsanada:** se creó arquitectura mínima; Fase 7 EN CONSOLIDACIÓN. El cierre previo no se presume comprobado. Pendientes detallados en architecture.md. |
| C-03 | Triggers responden a datos, no al paso del tiempo. | Alinear REQ-SISTEMA-001 y UC-TRABAJADOR-004 en diseño de jobs; RN-167 ya lo aclara. |
| C-04 | Diagrama de motor omite efectos de ANOTADO y sanciones y discrepa en elegibilidad. | Contrastar RN-034, RN-041 y SQL antes de cerrar motor. |
| C-05 | Sección 33 de business-rules tiene 13 tablas y campos texto, frente al modelo físico de 15 tablas y FKs. | Consolidar modelo detallado antes de persistencia; no alterar SQL en esta ronda. |
| C-06 | primera_vez_login aprobado pero ausente de BD/bd_uatre.sql. | Migración futura y alineación documental pendientes. |

## Criterio para cerrar Fase 8

Cada contrato debe trazar sus fuentes, permisos, entradas, respuestas, errores y
efectos transaccionales. Si depende de una duda abierta, marcarlo provisional.
La fase no se completa solo por generar Markdown o un archivo OpenAPI.
