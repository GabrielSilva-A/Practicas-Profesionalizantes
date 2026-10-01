---
name: uatre-development
description: Usar al analizar documentos, diseñar la API, implementar o revisar el sistema UATRE para recuperar contexto, mantener trazabilidad y resolver ambigüedades sin inventar reglas ni decisiones.
---

# Desarrollo contextualizado de UATRE

## Objetivo

Trabajar con evidencia del repositorio y decisiones aprobadas. Esta skill guía
el procedimiento; no sustituye las reglas de negocio ni garantiza por sí sola
la ausencia de errores.

Todas las rutas siguientes se resuelven desde la raíz del repositorio, no desde
la carpeta de esta skill.

## 1. Recuperar contexto

1. Leer `AGENTS.md` y sus decisiones aprobadas.
2. Leer `docs/PROJECT_GUIDE.md` y consultar `docs/project-roadmap.md`.
3. Identificar la tarea, la fase solicitada, el actor y el módulo afectados.
4. Comprobar que existen los entregables citados. No considerar un documento
   inexistente como una decisión técnica aprobada.
5. Leer los REQ, RN y UC relacionados, incluyendo las excepciones aplicables.
6. Consultar `docs/decisiones-pendientes.md` si existe. Si no existe, indicarlo
   cuando sea relevante y conservar las dudas identificadas en el resultado.

Leer solo lo pertinente después de recuperar el contexto inicial. No cargar
toda la documentación indiscriminadamente ni basarse únicamente en resúmenes
de sesiones anteriores. Tras una pérdida de contexto, volver a las fuentes.

## 2. Clasificar la evidencia

Para cada comportamiento relevante, distinguir:

- **Documentado:** fuente existente con regla o requerimiento identificable.
- **Aprobado:** decisión explícita del usuario, pendiente de consolidación si
  los documentos aún no la reflejan.
- **Propuesto:** alternativa técnica o funcional sin aprobación.
- **Pendiente:** información ausente, ambigua o contradictoria.

La selección del stack no aprueba automáticamente autenticación, paquetes,
infraestructura ni cambios en la lógica del motor.

## 3. Resolver ambigüedades sin bloquear todo el proyecto

Cuando una duda afecta el resultado:

1. Identificar fuentes e IDs afectados.
2. Describir un caso concreto y las interpretaciones posibles.
3. Explicar qué contrato o comportamiento depende de la decisión.
4. Preguntar al usuario antes de implementar esa parte.
5. Continuar con trabajo independiente que tenga especificación suficiente.
6. Registrar la decisión y actualizar las fuentes afectadas cuando el alcance
   y el modo permitan editar.

No volver a preguntar decisiones aprobadas salvo que un caso nuevo requiera
precisar su alcance. No convertir una propuesta del agente en aprobación.

## 4. Diseñar o implementar dentro de la fase

### Diseño de API — Fase 8

Por operación, documentar:

- Objetivo, actor autorizado y REQ/RN/UC relacionados.
- Método y ruta propuestos, entradas y validaciones.
- Respuesta y datos visibles para cada actor.
- Errores y conflictos de negocio.
- Efectos transaccionales y responsabilidad de API, SQL o worker.
- Dudas pendientes que impidan cerrar el contrato.

No crear contratos aparentemente definitivos para comportamientos sin resolver.
No iniciar la aplicación como efecto implícito de documentar la API.

### Implementación — cuando sea solicitada

- Inspeccionar estructura y convenciones existentes antes de editar.
- Identificar qué efectos ya ejecutan funciones y triggers antes de escribir
  lógica equivalente en Express o Prisma.
- Verificar autorización e independencia por seccional en el servidor.
- Obtener la identidad del actor autenticado del mecanismo de sesión aprobado,
  no de identificadores libremente suministrados por el cliente.
- Mantener separadas asistencia, ANOTADO, atrasos, sanciones, inhabilitaciones
  y designaciones; sus condiciones pueden coexistir.
- Distinguir el transcurso del tiempo de una operación sobre datos: un trigger
  PostgreSQL no se ejecuta por el mero paso de las horas.
- No asumir que el SQL actual cumple las reglas: contrastarlo con las fuentes.

## 5. Verificar según el cambio

- Documentación: comprobar archivos citados, enlaces, coherencia entre fuentes
  y trazabilidad de decisiones.
- API: revisar permisos, datos expuestos, casos normales y casos límite.
- Código: ejecutar las comprobaciones apropiadas disponibles; agregar pruebas
  significativas cuando el comportamiento lo requiera.
- Separar revisión estática, prueba ejecutada y comprobación pendiente.

Nunca declarar una fase completada solo porque sus archivos fueron creados.

## 6. Cerrar y preservar contexto

Resumir brevemente el resultado, las fuentes y decisiones utilizadas, las
verificaciones realizadas y las dudas que continúan abiertas. Mantener los
registros del proyecto alineados cuando forme parte del alcance autorizado.
No inventar horas de trabajo ni resultados de pruebas.

## Ejemplos de comportamiento esperado

| Situación | Respuesta esperada |
| --- | --- |
| El roadmap cita `architecture.md` pero no existe | Informar la ausencia; no afirmar que fue leído. |
| Una RN y un UC discrepan sobre cobertura excepcional | Exponer la contradicción y solicitar decisión antes de automatizarla. |
| El usuario ya aprobó JavaScript | Respetarlo; no cambiar a TypeScript por preferencia. |
| Se diseña cancelación con efectos ambiguos sobre atrasos | Marcar el efecto pendiente y avanzar con los contratos independientes. |
| No se ejecutaron pruebas | Indicar revisión estática o verificación pendiente, sin afirmar que pasaron. |

## Mantenimiento de la skill

Mantener aquí procedimientos, no copias extensas del negocio. Actualizar las
referencias cuando cambien las rutas y comprobar que las instrucciones no
introduzcan decisiones que el usuario no aprobó.
