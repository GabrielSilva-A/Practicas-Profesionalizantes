# Instrucciones para agentes — UATRE

## Contexto y alcance

Este repositorio contiene el Sistema Web de Gestión y Asignación de Personal
Eventual para UATRE. Antes de trabajar, leer `docs/PROJECT_GUIDE.md` y consultar
`docs/project-roadmap.md`. Verificar la existencia de los archivos citados: una
referencia documental no demuestra que el archivo exista ni que una fase esté
completada.

Para analizar, diseñar, implementar o revisar el sistema, cargar la skill
`uatre-development`, ubicada en `.opencode/skills/uatre-development/SKILL.md`.
Si no está disponible mediante la herramienta de skills, leer ese archivo.

## Fuentes y decisiones

- Reglas de negocio: `docs/business-rules.md`.
- Funcionalidades: `docs/requirements.md`.
- Interacciones: `docs/uc-uatre.md`, `docs/uc-empresa.md` y
  `docs/uc-trabajador.md`.
- Modelo conceptual: `docs/modelo-dominio.md`.
- Persistencia: `BD/bd_uatre.sql`, `docs/database-sql.md` y
  `docs/base_datos.md`; comprobar su consistencia, no asumirla.
- Dudas y decisiones: consultar `docs/decisiones-pendientes.md` cuando exista.

No copiar las reglas completas en las instrucciones ni en la skill. Consultar
las fuentes relacionadas con la tarea. Si discrepan, indicar la contradicción
con rutas e identificadores RN, REQ o UC; no elegir silenciosamente una versión.

## Decisiones aprobadas por el usuario

- API: Node.js y Express, en JavaScript.
- Cliente: Vite y React, en JavaScript.
- Persistencia: PostgreSQL con Prisma.
- Organización: monorepo simple con `backend/` y `frontend/`, cada uno con su
  propio `package.json` cuando se creen.
- Arquitectura mínima en `docs/architecture.md`: monolito modular, PostgreSQL
  local de desarrollo y proxy Vite `/api`. El usuario confirmó tener PostgreSQL
  instalado; versión/conexión pendientes. Preservar y revisar SQL sin duplicar efectos.
- Primero consolidar documentación y estandarizar el repositorio.
- La siguiente fase solicitada es Fase 8 — Diseño de API, después de preparar
  estas instrucciones. No confundir diseño de API con implementación.
- Reemplazar manualmente un designado aplica un turno de sanción, conforme a
  la respuesta del usuario sobre RN-083. Los documentos que indiquen un atraso
  para ese reemplazo necesitan alineación. No extender esta decisión a la
  cancelación de un pedido.
- Estados internos de pedido: `PENDIENTE`, `EN_PROCESO`, `CUBIERTO`,
  `NO_CUBIERTO`, `CANCELADO`; la empresa tiene una vista simplificada. La
  equivalencia completa para casos sin cobertura o cancelados debe precisarse.
- Agregar `primera_vez_login` a `USUARIOS` para el cambio obligatorio de
  contraseña del trabajador. Esta aprobación no demuestra que ya se haya
  agregado al esquema.
- El mecanismo de notificación de designaciones queda pendiente.
- No bloquear login por cantidad de intentos fallidos. La sesión de una hora se
  renueva con navegación e interacción del usuario, no con refrescos automáticos.
- Trabajador puede ingresar con el nombre propio consignado en el formulario de
  registro o con email, siempre con contraseña. Resolver homónimos antes de
  implementar la identificación; no inventar alias únicos ni autorregistro del trabajador.
- Contraseña nueva: mínimo 8 caracteres y al menos una mayúscula, una minúscula,
  un número y un símbolo. El cambio inicial del trabajador sigue siendo obligatorio.
- Recuperación de contraseña por email queda para implementación futura.
- Usar y guardar un correo válido de Gmail para el trabajador. El ingreso con
  Gmail se implementará después mediante «Continuar con Google»: modalidad de
  autenticación Google aprobada, todavía no implementada. Precisar si sustituye
  acceso por nombre/contraseña y efectos sobre cambio inicial antes de cerrar login.
  No elegir bibliotecas ni habilitar autorregistro implícito; no confundir formato
  válido con titularidad verificada.

JWT, librerías de jobs, herramientas de pruebas y hosting no están aprobados.
El caso de uso de acceso ya describe bcrypt y sesiones con cookies: leerlo
antes de proponer cambios de autenticación.

## Reglas permanentes

1. No inventar reglas, permisos, datos personales ni decisiones técnicas.
2. Distinguir hechos comprobados, decisiones aprobadas, propuestas y dudas.
3. Pedir decisión si una ambigüedad cambia el comportamiento del negocio.
   Continuar con las partes independientes que estén suficientemente definidas.
4. No exigir autorización para detalles internos reversibles que respeten el
   alcance, las convenciones existentes y las reglas aprobadas.
5. No alterar reglas para facilitar la implementación ni avanzar a otra fase
   sin que el usuario lo solicite.
6. Mantener aislamiento por seccional, permisos por actor y privacidad de los
   datos en el servidor, no solo en la interfaz.
7. Preservar la separación entre identidad y número de lista, entre recorrido
   y elegibilidad y entre asistencia, disponibilidad y designación.
8. No representar todas las condiciones de un trabajador como un único estado
   excluyente. Evitar duplicar efectos entre API, motor SQL y triggers.
9. Modificar únicamente lo necesario. No eliminar trabajo existente ni hacer
   commits, pushes o renombres masivos sin solicitud.
10. Informar verificaciones reales. No afirmar que un archivo fue leído, una
    prueba ejecutada o una funcionalidad implementada sin evidencia.

## Mantenimiento

Cuando el usuario apruebe una decisión, registrarla en las fuentes afectadas
como parte del alcance autorizado. Mantener este resumen alineado con ellas;
no usarlo como sustituto de la especificación detallada. Las dudas que no
bloquean una tarea pueden mantenerse abiertas con su impacto explícito.
