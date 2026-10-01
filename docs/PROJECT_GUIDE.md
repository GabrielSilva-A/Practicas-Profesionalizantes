# PROJECT_GUIDE.md

# Sistema Web de Gestión y Asignación de Personal Eventual para UATRE

**Versión:** 1.0
**Estado:** Activo
**Fase actual:** Fase 7 completada — Arquitectura
**Propósito principal:** Contexto operativo para agentes de IA que participen en el desarrollo del sistema.

---

## 1. Propósito de este documento

Este documento es la puerta de entrada al proyecto.

Su objetivo es proporcionar a desarrolladores y agentes de inteligencia artificial el contexto necesario para comprender:

* qué problema se está resolviendo;
* qué sistema se está construyendo;
* quiénes lo utilizarán;
* cuáles son los conceptos principales del dominio;
* dónde se encuentran las especificaciones detalladas;
* qué decisiones ya fueron tomadas;
* qué decisiones todavía no fueron tomadas;
* cómo debe actuar un agente de IA antes de modificar el proyecto.

Este documento es una **síntesis operativa**.

No reemplaza las reglas de negocio ni los requerimientos detallados.

Antes de implementar o modificar una funcionalidad deberán consultarse las fuentes de verdad correspondientes.

---

# 2. Descripción general

El proyecto consiste en desarrollar un sistema web para gestionar la solicitud y asignación de personal eventual administrado por seccionales de UATRE para empresas del sector agrícola.

Actualmente las empresas solicitan trabajadores a personal encargado de UATRE y el nombramiento se realiza utilizando listas de trabajadores y reglas operativas propias del proceso.

El sistema busca digitalizar este procedimiento manteniendo las reglas de rotación y nombramiento existentes.

---

# 3. Problema

El proceso actualmente requiere que el encargado de UATRE gestione manualmente información relacionada con:

* pedidos de empresas;
* cantidad de trabajadores solicitados;
* tareas;
* horarios;
* establecimientos;
* asistencia;
* socios;
* changas;
* rotaciones;
* atrasados;
* anotados;
* sanciones;
* habilitaciones;
* designaciones;
* historial.

La combinación de estas condiciones determina qué trabajador debe recibir cada turno.

El sistema deberá automatizar parte de este proceso sin eliminar la capacidad de administración y supervisión del personal autorizado de UATRE.

---

# 4. Objetivo

Construir un sistema web multiseccional que permita gestionar digitalmente el proceso de solicitud, nombramiento y seguimiento de personal eventual.

El sistema deberá permitir:

* administrar seccionales;
* administrar empresas afiliadas;
* administrar establecimientos;
* administrar trabajadores;
* mantener listas de socios y changas;
* registrar asistencia;
* mantener rotaciones;
* gestionar atrasados;
* gestionar anotados;
* gestionar sanciones;
* gestionar habilitaciones;
* recibir pedidos;
* procesar pedidos programados e inmediatos;
* realizar designaciones;
* controlar disponibilidad laboral;
* visualizar pedidos mediante un pizarrón;
* conservar información histórica.

---

# 5. Organización multiseccional

El sistema deberá soportar múltiples seccionales desde su diseño inicial.

Cada seccional representa una operación independiente correspondiente a una localidad.

Conceptualmente:

```text
UATRE
│
├── Seccional A
│   ├── Empresas
│   ├── Trabajadores
│   ├── Listas
│   ├── Asistencias
│   ├── Pedidos
│   ├── Sanciones
│   └── Historial
│
└── Seccional B
    ├── Empresas
    ├── Trabajadores
    ├── Listas
    ├── Asistencias
    ├── Pedidos
    ├── Sanciones
    └── Historial
```

Las operaciones de una seccional no deberán mezclarse con las correspondientes a otra.

---

# 6. Actores principales

## 6.1 Personal UATRE

Representa al personal autorizado para administrar la operación de una seccional.

Entre sus responsabilidades se encuentran la gestión de trabajadores, empresas, asistencia, sanciones, habilitaciones, listas, pedidos y nombramientos.

Los permisos exactos deberán consultarse en `requirements.md`.

---

## 6.2 Empresa

Representa una empresa afiliada que requiere personal eventual.

La empresa podrá utilizar el sistema para gestionar sus pedidos.

Una cuenta empresarial será compartida por los empleados que la empresa autorice para realizar estas operaciones.

La empresa no tendrá acceso a las listas internas de nombramiento ni a la identidad de los trabajadores designados.

---

## 6.3 Trabajador

Cada trabajador tendrá una cuenta personal.

Existen dos categorías operativas:

### SOCIO

Trabajador que posee un número dentro de una lista de rotación de socios.

### CHANGA

Trabajador perteneciente a UATRE que participa en una lista de rotación independiente de changas.

Socios y changas poseen reglas específicas que deberán consultarse en `business-rules.md`.

---

# 7. Conceptos fundamentales del dominio

## 7.1 Lista de rotación

Representa el orden utilizado para determinar a quién corresponde un turno.

Existen listas independientes para:

* socios;
* changas.

La posición de estas listas persiste entre pedidos.

---

## 7.2 Número de socio

El número representa una posición dentro de la lista.

No constituye la identidad permanente del trabajador.

Un número puede quedar libre y ser asignado posteriormente a otra persona sin modificar la identidad histórica de quien lo utilizó anteriormente.

---

## 7.3 Asistencia

La asistencia registra la condición de los trabajadores durante una jornada.

La asistencia **no crea una segunda lista de trabajadores aptos**.

Los trabajadores permanecen dentro de sus listas originales.

El motor de nombramiento utiliza la lista original y consulta las condiciones correspondientes para decidir si una persona puede recibir un turno.

---

## 7.4 Anotado

ANOTADO representa una indisponibilidad voluntaria correspondiente a un turno.

El trabajador puede salir de esta condición:

1. cuando el turno correspondiente es consumido;
2. utilizando la función LIBERAR antes de que ese turno sea alcanzado.

ANOTADO puede coexistir con ATRASADO.

Mientras ambas condiciones existan, ANOTADO impide temporalmente la asignación pero no elimina el atraso.

---

## 7.5 Atrasado

Un trabajador puede quedar ATRASADO cuando la rotación vuelve a alcanzar su turno pero no puede cumplirlo porque se encuentra comprometido con otra designación o trabajando.

Los atrasados disponibles tienen prioridad sobre la rotación ordinaria.

Los atrasados se procesan utilizando FIFO.

Socios y changas mantienen sus respectivas colas de atrasados.

---

## 7.6 Sanción

Las sanciones se expresan exclusivamente mediante cantidad de turnos.

Cuando corresponde consumir un turno de sanción, el trabajador no puede ser asignado y se descuenta un turno de la sanción pendiente.

---

## 7.7 Habilitación

Un trabajador puede necesitar una habilitación específica para trabajar en determinada empresa.

La falta de habilitación empresarial impide la asignación para ese pedido, pero no consume el turno del trabajador por esa causa.

---

## 7.8 Designado

Un trabajador DESIGNADO ya fue reservado para un pedido.

Desde ese momento deja de estar disponible para recibir otra designación incompatible, aunque todavía no haya llegado el horario de ingreso.

---

## 7.9 Trabajando

Representa al trabajador cuya jornada asignada ya comenzó.

Desde el horario de inicio indicado por la empresa se aplica un bloqueo máximo de 12 horas.

El trabajador puede indicar que terminó antes de ese límite.

---

## 7.10 Pedido

Una empresa solicita trabajadores indicando la información correspondiente al trabajo requerido.

Los pedidos pueden ser:

* programados;
* inmediatos.

Las reglas exactas para determinar cuándo deben procesarse se encuentran en `business-rules.md` y `requirements.md`.

---

# 8. Principio fundamental del nombramiento

La elegibilidad de un trabajador no deberá determinarse creando una lista paralela de personas aptas.

El principio general es:

```text
LISTA DE ROTACIÓN
        +
ASISTENCIA / ESTADOS
        +
ATRASADOS
        +
ANOTADOS
        +
SANCIONES
        +
HABILITACIONES
        +
DESIGNACIONES
        +
TRABAJOS ACTIVOS
        ↓
MOTOR DE NOMBRAMIENTO
        ↓
RESULTADO
```

La lista responde:

> ¿A quién le corresponde el turno?

Las condiciones del trabajador responden:

> ¿Puede aprovechar ese turno en este pedido?

El motor combina ambas respuestas.

---

# 9. Condiciones simultáneas

No deberá asumirse que toda la situación operativa de un trabajador puede representarse mediante un único estado excluyente.

Pueden existir condiciones simultáneas.

Ejemplos:

```text
PRESENTE + DESIGNADO
```

```text
ATRASADO + ANOTADO
```

La implementación futura deberá respetar este principio.

La forma técnica de representarlo todavía deberá definirse durante las fases correspondientes de modelado y diseño.

---

# 10. Funcionamiento general de un pedido

Conceptualmente:

```text
EMPRESA
   ↓
CREA PEDIDO
   ↓
PROGRAMADO / INMEDIATO
   ↓
determinar momento de procesamiento
   ↓
consultar estado actual correspondiente
   ↓
determinar SOCIOS / CHANGAS
según EMPRESA + TAREA
   ↓
procesar ATRASADOS
   ↓
procesar ROTACIÓN
   ↓
validar condiciones
   ↓
proponer / asignar trabajador
   ↓
actualizar rotación
   ↓
actualizar pizarrón
   ↓
conservar historial
```

Este flujo es solamente una representación general.

Las reglas detalladas deberán obtenerse de `business-rules.md` y `requirements.md`.

---

# 11. Pedidos programados y actualización de estados

El sistema deberá decidir las asignaciones utilizando el estado válido de las listas correspondiente al momento operativo del pedido.

Si un pedido debe cumplirse antes de una próxima actualización de estados, podrá procesarse utilizando el estado actual.

Si existe una actualización de estados que debe ocurrir antes del horario de ingreso del pedido, el pedido deberá esperar dicha actualización antes de definir trabajadores.

Una vez disponible una actualización válida para la jornada, los pedidos correspondientes podrán procesarse utilizando esa información.

La especificación detallada deberá mantenerse en las reglas de negocio.

---

# 12. Designaciones futuras

Una persona puede quedar designada con anticipación para un trabajo posterior.

Desde el momento de la designación queda comprometida con ese pedido.

Si la rotación vuelve a alcanzar su número mientras continúa designada o trabajando y por ello no puede aprovechar un nuevo turno, deberá aplicarse la regla correspondiente de ATRASADO.

---

# 13. Pizarrón e historial

El sistema deberá mantener un pizarrón operativo con los pedidos correspondientes.

También deberá conservar el pizarrón históricamente por jornada.

El personal autorizado de UATRE podrá consultar jornadas anteriores.

Los trabajadores podrán consultar:

* pizarrones históricos;
* sus propias designaciones históricas.

Las estadísticas futuras no forman parte actualmente de esta especificación.

---

# 14. Fuentes de verdad

La documentación se divide por responsabilidad.

```text
docs/
│
├── PROJECT_GUIDE.md
├── project-roadmap.md
├── business-rules.md
└── requirements.md
```

## PROJECT_GUIDE.md

Proporciona contexto general y reglas de trabajo.

No contiene el detalle completo del comportamiento funcional.

## project-roadmap.md

Define las fases del proyecto, su orden y estado.

## business-rules.md

Contiene las reglas detalladas del dominio y del proceso de nombramiento.

Debe consultarse antes de modificar lógica de negocio.

## requirements.md

Contiene los requerimientos funcionales y no funcionales aprobados.

Define qué comportamientos debe proporcionar el sistema.

---

# 15. Uso de la documentación por agentes de IA

Antes de implementar una funcionalidad, el agente deberá:

1. leer este documento;
2. identificar los requerimientos afectados en `requirements.md`;
3. consultar las reglas correspondientes en `business-rules.md`;
4. verificar en `project-roadmap.md` si la decisión pertenece a la fase actual;
5. identificar posibles ambigüedades o contradicciones;
6. recién entonces proponer o realizar cambios.

La documentación deberá utilizarse como contexto previo a la generación o modificación de código.

---

# 16. Reglas obligatorias para agentes de IA

Todo agente que trabaje sobre este proyecto deberá respetar las siguientes reglas.

### 16.1 No inventar

No inventar reglas, comportamientos, entidades, permisos ni restricciones que no estén definidos.

### 16.2 No completar ambigüedades

Si existe más de una interpretación razonable, no seleccionar una arbitrariamente.

Se deberá explicar:

* cuál es la ambigüedad;
* qué funcionalidad afecta;
* qué alternativas existen;
* qué decisión es necesaria.

Luego deberá solicitarse confirmación.

### 16.3 No modificar reglas para facilitar código

Una regla de negocio no deberá modificarse simplemente porque otra alternativa resulte técnicamente más sencilla.

### 16.4 Consultar antes de modificar

Antes de modificar una funcionalidad existente deberán identificarse los requerimientos y reglas relacionados.

### 16.5 No adelantarse a fases posteriores

No deberán tomarse decisiones definitivas sobre arquitectura, base de datos, API, frontend u otras áreas mientras dichas decisiones correspondan a una fase todavía no realizada.

### 16.6 No asumir tecnologías

La ausencia de una tecnología especificada no constituye autorización para elegirla definitivamente.

### 16.7 Señalar contradicciones

Si dos documentos contienen instrucciones incompatibles, el agente no deberá elegir silenciosamente una.

Deberá señalar la contradicción antes de continuar.

### 16.8 Mantener separación entre dominio e implementación

Las reglas de negocio deberán mantenerse conceptualmente separadas de la forma técnica utilizada para implementarlas.

### 16.9 Evitar modificaciones innecesarias

Una tarea deberá modificar únicamente las partes necesarias para cumplir su objetivo y los requerimientos relacionados.

### 16.10 Validar contra los requerimientos

Una implementación no deberá considerarse terminada solamente porque funcione técnicamente.

Deberá comprobarse que respeta los requerimientos y reglas de negocio correspondientes.

---

# 17. Manejo de nuevas decisiones

Durante el desarrollo pueden descubrirse casos que todavía no hayan sido definidos.

Cuando ocurra:

```text
NUEVA DUDA
    ↓
identificar regla/requerimiento afectado
    ↓
NO implementar una suposición
    ↓
solicitar decisión
    ↓
documentar decisión aprobada
    ↓
actualizar documentos afectados
    ↓
implementar
```

Las decisiones posteriores que modifiquen reglas anteriores deberán actualizar las fuentes correspondientes para evitar documentación contradictoria.

---

# 18. Metodología

El proyecto sigue una metodología dividida en 14 fases.

La descripción completa se encuentra en:

`docs/project-roadmap.md`

Las fases deberán utilizarse como guía para evitar adelantar decisiones sin disponer previamente del análisis necesario.

---

# 19. Estado actual

Actualmente se encuentran trabajadas:

* Fase 1 — Relevamiento del problema.
* Fase 2 — Reglas de negocio.
* Fase 3 — Requerimientos funcionales y no funcionales.
* Fase 4 — Casos de uso.
* Fase 5 — Modelo de dominio.
* Fase 6 — Diseño de base de datos.
* Fase 7 — Arquitectura.

La siguiente fase será:

**Fase 8 — Diseño de API.**

El detalle de objetivos, entregables y estados de todas las fases se encuentra en
`docs/project-roadmap.md`.

---

# 20. Decisiones técnicas todavía no definidas

Este documento no autoriza a asumir decisiones definitivas sobre:

* arquitectura;
* lenguaje o framework de backend;
* framework de frontend;
* ORM;
* autenticación técnica;
* infraestructura;
* hosting;
* estructura de API;
* estructura definitiva de carpetas del código;
* estrategia concreta de procesos programados;
* librerías.

PostgreSQL y el modelo físico de datos ya fueron definidos durante la Fase 6. Las
decisiones de arquitectura se definieron en `docs/architecture.md`. Los contratos de
API, pantallas, detalles de migraciones y decisiones de deployment deberán abordarse
en las fases correspondientes.

---

# 21. Regla final

Ante una duda entre:

> asumir un comportamiento para continuar

y

> detener la decisión y solicitar aclaración,

se deberá elegir siempre:

**SOLICITAR ACLARACIÓN.**

El objetivo no es generar código rápidamente.

El objetivo es construir un sistema que respete de forma controlada las reglas y requerimientos definidos para el proyecto.
