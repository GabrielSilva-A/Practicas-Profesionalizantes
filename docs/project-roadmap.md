# Project Roadmap

# Sistema Web de Gestión y Asignación de Personal Eventual para UATRE

**Versión:** 1.0
**Estado:** Activo
**Objetivo:** Registrar las fases, entregables, decisiones y evolución del proyecto de Prácticas Profesionalizantes.

---

# 1. Propósito

Este documento define la hoja de ruta utilizada para desarrollar el Sistema Web de Gestión y Asignación de Personal Eventual para UATRE.

El proyecto forma parte de las Prácticas Profesionalizantes de la carrera y deberá representar un proceso de desarrollo equivalente a **300 horas de trabajo**.

El roadmap tiene como objetivos:

* dividir el desarrollo en fases;
* registrar qué trabajo se realizó;
* identificar qué documentación produce cada fase;
* evitar adelantar decisiones pertenecientes a etapas posteriores;
* permitir reconstruir posteriormente cómo evolucionó el proyecto;
* servir como registro para documentar las 300 horas;
* proporcionar contexto de avance a desarrolladores y agentes de IA.

---

# 2. Regla metodológica

Las fases deberán realizarse siguiendo el orden establecido en este documento.

Una fase podrá utilizar información obtenida en fases anteriores.

Cuando durante una fase se descubra que una decisión anterior necesita ser modificada, deberán actualizarse también los documentos afectados.

No deberá mantenerse deliberadamente documentación contradictoria entre fases.

Si durante una fase aparece una decisión necesaria que todavía no fue definida:

1. identificar la duda;
2. identificar qué requerimientos o reglas afecta;
3. no completar la información mediante suposiciones;
4. solicitar una decisión;
5. documentar la respuesta;
6. actualizar los documentos afectados;
7. continuar el proceso.

---

# 3. Estados utilizados

Cada fase podrá encontrarse en uno de los siguientes estados:

### PENDIENTE

La fase todavía no comenzó.

### EN PROCESO

La fase está siendo trabajada y todavía existen actividades pendientes.

### EN CONSOLIDACIÓN

El trabajo principal fue realizado, pero se está revisando o actualizando su documentación antes del cierre.

### COMPLETADA

Los objetivos y entregables previstos para la fase fueron realizados.

### REVISIÓN NECESARIA

Una decisión posterior modificó aspectos importantes de una fase previamente completada y su documentación necesita actualizarse.

---

# 4. Estado general

| Fase | Nombre                                      | Estado                                         |
| ---- | ------------------------------------------- | ---------------------------------------------- |
| 1    | Relevamiento del problema                   | COMPLETADA                                     |
| 2    | Reglas de negocio                           | COMPLETADA / requiere consolidación documental |
| 3    | Requerimientos funcionales y no funcionales | COMPLETADA                                     |
| 4    | Casos de uso                                | COMPLETADA                                     |
| 5    | Modelo de dominio                           | COMPLETADA                                     |
| 6    | Diseño de base de datos                     | COMPLETADA                                     |
| 7    | Arquitectura                                | EN CONSOLIDACIÓN — arquitectura mínima documentada |
| 8    | Diseño de API                               | EN PROCESO                                     |
| 9    | Diseño de frontend                          | PENDIENTE                                      |
| 10   | Desarrollo por iteraciones                  | PENDIENTE                                      |
| 11   | Testing                                     | PENDIENTE                                      |
| 12   | Documentación                               | PENDIENTE                                      |
| 13   | Deployment                                  | PENDIENTE                                      |
| 14   | Preparación de la defensa                   | PENDIENTE                                      |

---

# 5. Fase 1 — Relevamiento del problema

**Estado:** COMPLETADA

## Objetivo

Comprender el proceso real que se desea digitalizar antes de diseñar una solución.

## Trabajo realizado

Se relevó el funcionamiento actual mediante el cual empresas del sector agrícola solicitan personal eventual a UATRE.

Se identificaron inicialmente:

* seccionales;
* empresas;
* personal encargado de UATRE;
* socios;
* listas de nombramiento;
* pedidos;
* asistencia;
* tareas;
* habilitaciones;
* sanciones;
* atrasados;
* anotados;
* historial.

Se analizó el proceso manual utilizado actualmente para recibir pedidos y determinar trabajadores.

## Actores identificados

### Personal UATRE

Administra el proceso de nombramiento correspondiente a la seccional.

### Empresa

Solicita personal eventual para realizar una determinada tarea.

### Trabajador

Persona que puede participar del proceso de nombramiento como socio.

## Resultado

Se obtuvo una descripción suficiente del problema para comenzar a identificar las reglas que gobiernan el proceso.

## Decisiones técnicas

Ninguna.

Durante esta fase no se definieron tecnologías, arquitectura ni estructura de implementación.

---

# 6. Fase 2 — Reglas de negocio

**Estado:** COMPLETADA / requiere consolidación documental

## Objetivo

Transformar el proceso relevado en reglas explícitas que describan cómo funciona el nombramiento.

## Áreas trabajadas

Se definieron reglas relacionadas con:

* socios;
* números;
* rotaciones;
* asistencia;
* ausencia;
* anotados;
* liberación de anotados;
* atrasados;
* orden de atrasados (cantidad DESC, fecha del primer atraso ASC, RN-103/RN-104);
* sanciones;
* habilitaciones;
* pedidos;
* rechazo de trabajos;
* designaciones;
* bloqueo laboral;
* cancelaciones;
* establecimientos;
* tipos de tareas.

## Decisiones principales

### Números reutilizables

El número perteneciente a una lista no representa permanentemente la identidad del trabajador.

Puede quedar libre y ser utilizado posteriormente por otra persona.

### Rotación persistente

La posición de las listas debe mantenerse entre pedidos.

### Lista vigente

RN-005 y RN-054 consolidaron una única lista de socios por seccional. Las
referencias históricas a changas no son una especificación vigente.

### Asistencia basada en estados

La asistencia no genera una segunda lista persistente de trabajadores aptos.

Se registran condiciones sobre los integrantes de las listas originales.

### Atrasados

Un trabajador puede quedar atrasado cuando la rotación vuelve a alcanzar su turno mientras se encuentra comprometido con una designación anterior o trabajando.

Los atrasados elegibles tienen prioridad por cantidad descendente y fecha del
primer atraso ascendente (RN-103 y RN-104). FIFO corresponde a pedidos habilitados.

### Anotado

ANOTADO corresponde a un turno.

Puede finalizar:

* consumiendo dicho turno;
* mediante LIBERAR antes de que sea alcanzado.

ANOTADO puede coexistir con ATRASADO.

ANOTADO impide temporalmente la asignación sin eliminar el atraso.

### Sanciones

Las sanciones se expresan en turnos pendientes o quita de atrasos (RN-039).

### Bloqueo laboral

Una jornada genera un bloqueo máximo de 12 horas desde el horario de inicio indicado por la empresa.

El trabajador puede indicar que terminó antes.

### Habilitaciones

Un trabajador puede estar habilitado para determinadas empresas y no para otras.

La inhabilitación impide designar y puede generar un atraso conforme a RN-049.

### Tareas

La combinación:

`EMPRESA + TAREA`

identifica el trabajo solicitado; no selecciona otra lista de origen (RN-054).

## Evolución durante la Fase 3

Al analizar los requerimientos se descubrieron mejoras necesarias sobre algunas reglas originalmente planteadas.

En particular se refinó:

* el concepto de asistencia;
* la coexistencia de estados/condiciones;
* ANOTADO;
* ATRASADO;
* designaciones futuras;
* procesamiento temporal de pedidos.

Estas modificaciones deberán quedar reflejadas en `business-rules.md`.

## Entregable

`docs/business-rules.md`

Este documento deberá consolidar la versión vigente de todas las reglas y eliminar interpretaciones anteriores que hayan quedado obsoletas.

---

# 7. Fase 3 — Requerimientos funcionales y no funcionales

**Estado:** COMPLETADA

## Objetivo

Transformar el relevamiento y las reglas de negocio en comportamientos concretos que deberá cumplir el software.

## Trabajo realizado

Se identificaron requerimientos correspondientes a:

* seccionales;
* usuarios;
* empresas;
* establecimientos;
* trabajadores;
* socios (la categoría «changa» del relevamiento se consolidó como socio, RN-005);
* listas;
* asistencia;
* estados;
* anotados;
* sanciones;
* habilitaciones;
* pedidos;
* pedidos programados;
* pedidos inmediatos;
* motor de nombramiento;
* designaciones;
* atrasados;
* cancelaciones;
* pizarrón;
* historial;
* overrides administrativos.

También se identificaron requerimientos no funcionales relacionados con:

* seguridad;
* integridad;
* usabilidad;
* automatización;
* mantenibilidad.

## Casos límite resueltos

Durante el cierre de esta fase se analizaron explícitamente cinco situaciones que permanecían pendientes.

### Pedido antes de la actualización de estados

El sistema utilizará el estado válido de la lista correspondiente al momento en que deba realizarse la designación.

Si el pedido debe resolverse antes de una actualización posterior, utilizará los estados actuales.

Si antes del horario de ingreso debe realizarse una nueva actualización válida, esperará dicha actualización.

### Momento de procesamiento de pedidos programados

Cuando ya existe una actualización válida correspondiente a la jornada, un pedido programado para más tarde puede procesarse inmediatamente.

Si la actualización correspondiente a esa jornada todavía no ocurrió y ocurrirá antes del ingreso, deberá aguardarse.

### Modificación de pedidos

Mientras un pedido todavía no tenga trabajadores asignados podrá modificarse según las reglas definidas.

Una vez realizada una asignación, el pedido no podrá modificarse.

### Cancelación

Un pedido podrá cancelarse únicamente antes de alcanzar su horario de inicio.

Si ya existen trabajadores designados:

* se cancelan sus designaciones;
* pasan a ATRASADO;
* quedan disponibles según la prioridad correspondiente.

Una vez comenzado el horario de inicio, el pedido no podrá cancelarse.

### Historial del trabajador

Los trabajadores podrán consultar:

* el pizarrón histórico por jornadas;
* su propio historial de designaciones.

Las estadísticas quedan reservadas para una posible funcionalidad posterior y no forman parte actualmente del alcance confirmado.

## Entregable

`docs/requirements.md`

Contendrá la especificación consolidada de requerimientos funcionales y no funcionales.

---

# 8. Fase 4 — Casos de uso

**Estado:** COMPLETADA

## Objetivo

Describir las interacciones entre los actores y el sistema.

## Entregables realizados

- [uc-uatre.md](./uc-uatre.md): casos de uso del personal autorizado de UATRE.
- [uc-empresa.md](./uc-empresa.md): casos de uso de Empresa.
- [uc-trabajador.md](./uc-trabajador.md): casos de uso de Trabajador.

## Entradas

La fase utilizará principalmente:

* `business-rules.md`;
* `requirements.md`.

## Trabajo previsto

Identificar casos de uso correspondientes a:

* UATRE;
* Empresa;
* Trabajador.

Para cada caso de uso deberán definirse posteriormente:

* actor;
* objetivo;
* precondiciones;
* flujo principal;
* flujos alternativos;
* postcondiciones;
* reglas relacionadas.

## Restricción

No deberá modificarse una regla de negocio para simplificar un caso de uso.

Si el análisis descubre una nueva ambigüedad, deberá volver a la documentación correspondiente.

---

# 9. Fase 5 — Modelo de dominio

**Estado:** COMPLETADA

## Objetivo

Representar los conceptos principales del negocio y sus relaciones sin depender todavía del modelo físico de base de datos.

## Entradas

* reglas de negocio;
* requerimientos;
* casos de uso.

## Resultado esperado

Un modelo que permita comprender entidades, relaciones, responsabilidades y conceptos del dominio.

## Entregable realizado

- [modelo-dominio.md](./modelo-dominio.md): modelo conceptual de entidades, relaciones, responsabilidades, estados, procesos e invariantes, independiente del diseño físico de persistencia.

---

# 10. Fase 6 — Diseño de base de datos

**Estado:** COMPLETADA

## Objetivo

Diseñar la persistencia necesaria para representar el dominio previamente modelado.

## Restricción

No deberán diseñarse tablas simplemente copiando las pantallas o utilizando un modelo improvisado.

La base de datos deberá derivarse del modelo de dominio y los requerimientos.

## Entregables realizados

- [../BD/bd_uatre.sql](../BD/bd_uatre.sql): DDL PostgreSQL consolidado de 15 tablas, integridad, vistas, triggers, funciones e índices (fuente única del esquema; `docs/database-sql.md` fue eliminado el 2026-10-01 por duplicarse byte a byte con este archivo).
- [base_datos.md](./base_datos.md): documentación técnica del esquema y sus automatismos.
- [diagrama-ER.md](./diagrama-ER.md): relaciones y cardinalidades del modelo físico.
- [../BD/README.md](../BD/README.md): instrucciones de ejecución y validación de los scripts ejecutables.
- [../BD/bd_uatre_test.sql](../BD/bd_uatre_test.sql): fixture de demostración y verificaciones.

---

# 11. Fase 7 — Arquitectura

**Estado:** EN CONSOLIDACIÓN

## Objetivo

Definir cómo se organizará técnicamente el sistema.

En esta fase podrán analizarse y justificarse decisiones relacionadas con:

* frontend;
* backend;
* responsabilidades;
* servicios;
* autenticación;
* comunicación;
* procesos programados;
* organización general del código.

## Restricción

Las decisiones deberán justificarse mediante necesidades del sistema y no únicamente por preferencia tecnológica.

## Entregable mínimo creado — 2026-10-01

- [architecture.md](./architecture.md): monolito modular, responsabilidades,
  estructura prevista, PostgreSQL local, proxy de desarrollo, persistencia y
  transacciones, sesión, procesos temporales y criterios del primer bloque técnico.

Se subsana la ausencia detectada al iniciar Fase 8. No se considera comprobado
el cierre anterior ni completada toda la arquitectura. Bibliotecas de sesiones/jobs,
migraciones concretas, concurrencia y despliegue conservan pendientes documentados.
El scaffolding técnico posterior ya creó `backend/` y `frontend/`: Express,
Prisma, Vite y React; el detalle de su alcance se mantiene en
`architecture.md`. La arquitectura continúa EN CONSOLIDACIÓN porque persisten
pendientes de sesiones, concurrencia, jobs, persistencia y despliegue.

---

# 12. Fase 8 — Diseño de API

**Estado:** EN PROCESO

## Objetivo

Definir las operaciones mediante las cuales se comunicarán las partes correspondientes del sistema.

## Resultado esperado

Especificación de las operaciones necesarias para soportar los casos de uso y requerimientos.

## Avance inicial — 2026-10-01

- [decisiones-pendientes.md](./decisiones-pendientes.md): decisiones aprobadas,
  preguntas abiertas y su impacto sobre contratos.
- [api-design.md](./api-design.md): convenciones y contratos iniciales de acceso
  y administración, con restricciones provisionales identificadas.
- [openapi.yaml](./openapi.yaml): contrato parcial inicial de sesión y consultas
  de identidad/estado; no representa toda la API.
- Implementación inicial: healthchecks, registro público de seccionales y
  empresas, login/logout y consulta de sesión para cuentas EMPRESA y SECCIONAL.
  Las demás rutas descritas en el contrato son futuras o provisionales hasta que
  exista su implementación y se cierren sus decisiones dependientes.
- Administración autenticada: contratos de perfil de seccional, consulta y
  actividad de empresas, y administración de trabajadores trazados en
  `api-design.md` y `openapi.yaml`. A-23 consolida las credenciales de alta
  manual empresarial; el cambio obligatorio de contraseña para EMPRESA requiere
  migración y rutas futuras.

Pendiente: cerrar decisiones que afecten contratos, completar operaciones de
administración, asistencia, pedidos, designaciones, pizarrón e historial y
ampliar/validar OpenAPI. La implementación inicial no acredita el cierre de Fase 8
ni habilita los módulos de negocio aún pendientes.

---

# 13. Fase 9 — Diseño de frontend

**Estado:** PENDIENTE

## Objetivo

Diseñar la experiencia de utilización del sistema para sus diferentes actores.

Se deberán contemplar especialmente:

* uso desde dispositivos móviles;
* toma rápida de asistencia;
* pizarrón;
* pedidos;
* perfil del trabajador;
* administración UATRE.

---

# 14. Fase 10 — Desarrollo por iteraciones

**Estado:** PENDIENTE

## Objetivo

Implementar progresivamente el sistema utilizando como guía toda la documentación anterior.

## Regla

Cada iteración deberá tener un alcance definido y estar relacionada con requerimientos existentes.

Antes de generar código deberá comprobarse que la funcionalidad está suficientemente especificada.

---

# 15. Fase 11 — Testing

**Estado:** PENDIENTE

## Objetivo

Comprobar que el sistema implementado cumple las reglas y requerimientos definidos.

Las pruebas deberán contemplar tanto funcionamiento normal como casos límite relevantes del nombramiento.

---

# 16. Fase 12 — Documentación

**Estado:** PENDIENTE

## Objetivo

Consolidar la documentación funcional y técnica generada durante el proyecto.

Esta fase no implica que las fases anteriores deban trabajar sin documentación.

La documentación se mantendrá desde el comienzo y esta fase realizará su consolidación final.

---

# 17. Fase 13 — Deployment

**Estado:** PENDIENTE

## Objetivo

Preparar una versión ejecutable del sistema en un entorno apropiado para su demostración y utilización.

Las decisiones concretas de infraestructura todavía no están definidas.

---

# 18. Fase 14 — Preparación de la defensa

**Estado:** PENDIENTE

## Objetivo

Preparar la presentación final del proyecto.

La defensa deberá poder explicar el recorrido completo:

`PROBLEMA → ANÁLISIS → REGLAS → REQUERIMIENTOS → DISEÑO → IMPLEMENTACIÓN → PRUEBAS → RESULTADO`

La documentación generada durante las fases anteriores deberá utilizarse como evidencia del proceso realizado.

---

# 19. Registro de las 300 horas

El proyecto deberá representar aproximadamente 300 horas de trabajo de Prácticas Profesionalizantes.

Las horas no deberán inventarse retroactivamente.

A partir del momento en que se establezca el mecanismo de registro deberán documentarse las actividades realizadas.

Formato previsto:

| Fecha     | Fase | Actividad | Resultado/Entregable | Horas |
| --------- | ---- | --------- | -------------------- | ----: |
| Pendiente | —    | —         | —                    |     — |

## Total

**Horas registradas:** pendiente de comenzar registro formal.
**Objetivo del proyecto:** 300 horas.

---

# 20. Registro de cambios de fase

Cuando una decisión tomada durante una fase posterior modifique una fase anterior deberá registrarse.

Formato:

| Fecha     | Fase origen | Fase que detectó el cambio | Cambio | Documentos afectados |
| --------- | ----------- | -------------------------- | ------ | -------------------- |
| 2026-10-01 | 2, 3, 4 | 8 | Registrar dudas y alinear decisión de sanción por reemplazo; actualizar síntesis de reglas vigentes. | decisiones-pendientes.md, PROJECT_GUIDE.md, requirements.md, business-rules.md, uc-uatre.md |
| 2026-10-01 | 7 | 8 | Detectar ausencia de architecture.md; revisar estado declarado. | PROJECT_GUIDE.md, project-roadmap.md |
| 2026-10-01 | 7 | 8 | Crear arquitectura mínima solicitada con PostgreSQL local; pasar Fase 7 a EN CONSOLIDACIÓN y actualizar referencias. | architecture.md, PROJECT_GUIDE.md, api-design.md, decisiones-pendientes.md, AGENTS.md |
| 2026-10-01 | 2, 4 | 8 | Consolidar complejidad obligatoria de contraseña, nombre propio de ingreso y renovación con navegación/interacción; homónimos pendientes. | business-rules.md, uc-trabajador.md, decisiones-pendientes.md, api-design.md, openapi.yaml, PROJECT_GUIDE.md, AGENTS.md |
| 2026-10-01 | 7, 8 | 8 | Alinear el estado de arquitectura y API con el scaffolding técnico y las rutas iniciales ya creadas. | PROJECT_GUIDE.md, project-roadmap.md, architecture.md |
| 2026-10-01 | 2, 3, 4 | 8 | Consolidar las credenciales del alta manual empresarial y su cambio obligatorio inicial. | business-rules.md, requirements.md, uc-uatre.md, decisiones-pendientes.md, api-design.md, openapi.yaml, project-roadmap.md |
| 2026-10-01 | 2, 3, 4 | 8 | Consolidar baja operativa y reactivación de trabajadores con conservación de identidad. | business-rules.md, requirements.md, uc-uatre.md, decisiones-pendientes.md, api-design.md, openapi.yaml, project-roadmap.md |
| 2026-10-01 | 2, 3, 4 | 8 | Consolidar el ajuste seguro de tamaño de lista sin reasignaciones ni overrides automáticos. | business-rules.md, requirements.md, uc-uatre.md, decisiones-pendientes.md, api-design.md, openapi.yaml, project-roadmap.md |
| 2026-10-01 | 2, 3, 4, 6 | 8 | Consolidar verificación y cierre de asistencia; registrar migración y revisión de triggers requeridas. | business-rules.md, uc-uatre.md, decisiones-pendientes.md, api-design.md, project-roadmap.md |
| 2026-10-02 | 2, 3, 4, 5, 6, 7 | 8 | Limpieza documental (fases B-F): propagar D-26/D-30/D-33/D-35/A-06/A-28/C-01/C-05/C-06; alinear esquema (verificado, primera_vez_login, sesiones, 15 tablas); señalar D-09/D-15/D-27; unificar fuentes de verdad en AGENTS.md; podar estado obsoleto. | requirements.md, uc-*.md, business-rules.md, base_datos.md, architecture.md, modelo-dominio.md, diagrama-*.md, PROJECT_GUIDE.md, README.md, execution-plan.md, decisiones-pendientes.md, AGENTS.md, skills uatre-* |

Esto permitirá reconstruir por qué evolucionaron determinadas reglas durante el desarrollo.

---

# 21. Próximo paso

Continuar **FASE 8 — DISEÑO DE API**: resolver dudas al abordar cada módulo,
consolidar contratos y revisar trazabilidad. La arquitectura mínima está documentada
y conserva pendientes. El siguiente bloque técnico propuesto es estandarizar y
crear la base ejecutable dentro del alcance de desarrollo que se solicite;
no considerar Fases 8/9 completadas por iniciar ese bloque.
