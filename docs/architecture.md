# Arquitectura mínima — UATRE

**Fecha:** 2026-10-01

**Fase:** 7 — EN CONSOLIDACIÓN

**Estado:** Base arquitectónica definida; implementación pendiente

## 1. Alcance y evidencia

Este documento consolida la arquitectura mínima solicitada para preparar el
desarrollo. No acredita una aplicación ejecutable ni el cierre de todas las
decisiones de arquitectura.

### Decisiones aprobadas

- API Node.js + Express y cliente Vite + React, en JavaScript.
- PostgreSQL con Prisma.
- Monorepo simple con `backend/` y `frontend/`, cada uno con su `package.json`.
- Backend como monolito modular: una aplicación organizada por funcionalidades.
- PostgreSQL local para desarrollo: el usuario confirmó que está instalado.
  Versión, servicio activo, conexión y herramientas disponibles aún no comprobados.
- Proxy de Vite para `/api` en desarrollo.
- Conservar y revisar las funciones SQL existentes; no duplicar sus efectos en JS.

Fuentes: [PROJECT_GUIDE.md](./PROJECT_GUIDE.md),
[modelo-dominio.md](./modelo-dominio.md), [business-rules.md](./business-rules.md),
[requirements.md](./requirements.md), [api-design.md](./api-design.md),
[base_datos.md](./base_datos.md) y [README de BD](../BD/README.md).
Las interacciones se especifican en [uc-uatre.md](./uc-uatre.md),
[uc-empresa.md](./uc-empresa.md) y [uc-trabajador.md](./uc-trabajador.md).
Consultar [decisiones-pendientes.md](./decisiones-pendientes.md) para bloqueos.

### Fuera del alcance de esta consolidación

No se seleccionan bibliotecas de sesiones, jobs, validación o pruebas; tampoco
hosting ni despliegue. El acceso Google está aprobado para una etapa futura,
con coexistencia/sustitución del acceso local todavía pendiente (D-35/D-36).
La arquitectura permite crear la base técnica sin resolver esas dudas de acceso.

## 2. Componentes y comunicación

```text
Navegador
  └─ React servido por Vite durante desarrollo
       └─ HTTP / JSON por /api
            └─ Express
                 └─ Servicios por módulo
                      └─ Prisma / consultas SQL parametrizadas
                           └─ PostgreSQL local
                                ├─ Tablas y restricciones
                                ├─ Vistas
                                └─ Funciones y triggers revisados

Procesos programados del backend (implementación posterior)
  └─ Servicios compartidos / acceso PostgreSQL
```

El navegador no accede directamente a PostgreSQL ni ejecuta el motor.
La comunicación externa de la API se define en `api-design.md` y `openapi.yaml`.
Para operación se propone cliente y API bajo el mismo origen, mediante HTTPS;
su realización depende del entorno elegido en Fase 13.

## 3. Responsabilidades y límites

| Componente | Responsabilidad | Límite |
| --- | --- | --- |
| React | Formularios, navegación, estados visuales y validación orientativa. | No autoriza ni decide elegibilidad. |
| Rutas/middleware Express | Resolver operación, autenticar y controlar actor. | No concentran el motor ni toda la lógica del caso de uso. |
| Controlador | Traducir petición y resultado a HTTP. | No devuelve filas completas ni secretos internos. |
| Servicio del módulo | Ejecutar caso de uso, validaciones de negocio y transacción. | No repite efectos ya ejecutados en SQL. |
| Prisma | Acceso a datos y migraciones; SQL parametrizado cuando corresponda. | Su modelo no sustituye automáticamente todos los objetos PostgreSQL. |
| PostgreSQL | Integridad y lógica SQL que se preserve tras revisión. | Un trigger no se activa por el mero paso del tiempo. |
| Jobs | Invocar operaciones temporales compartidas. | No necesitan simular HTTP ni duplicar reglas del servicio. |

Flujo de referencia: petición → validación → autorización/contexto de seccional
→ servicio/transacción → resultado filtrado → respuesta. Las comprobaciones de
pertenencia se repiten donde sea necesario para preservar integridad.

## 4. Estructura prevista

Las rutas de este apartado son futuras; no se crean carpetas vacías para cada módulo.

```text
/
├─ AGENTS.md
├─ README.md                     # creación posterior
├─ .opencode/skills/uatre-development/SKILL.md
├─ docs/
├─ BD/                           # referencia SQL existente
├─ backend/
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ .env.example
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  └─ src/
│     ├─ app.js
│     ├─ server.js
│     ├─ config/
│     ├─ database/
│     ├─ middlewares/
│     ├─ modules/
│     └─ jobs/
└─ frontend/
   ├─ package.json
   ├─ package-lock.json
   ├─ .env.example
   └─ src/
      ├─ main.jsx
      ├─ app/
      ├─ components/
      ├─ features/
      ├─ services/
      └─ styles/
```

### Backend

`app.js` configura Express sin abrir el puerto; `server.js` inicia la escucha
y coordina cierre ordenado. Esto permite verificar la app sin iniciar siempre
un proceso servidor real. Configuración valida entorno antes de aceptar peticiones.
`database/` mantiene un cliente Prisma compartido por proceso, no uno por petición.

Cada funcionalidad crea rutas, controlador, servicio y validación cuando los
necesite. Acceso a datos puede empezar en el servicio; extraerlo si el módulo
crece. No exigir un repositorio genérico ni un CRUD por tabla.

Los módulos se basan en áreas del dominio: administración e identidad;
asistencia/disponibilidad/rotación; pedidos/designaciones; pizarrón/historial.
La separación concreta evoluciona con las iteraciones.

### Frontend

`features/` organiza pantallas y lógica por funcionalidad; `components/` contiene
elementos realmente compartidos; `services/` centraliza comunicación HTTP y errores.
`app/` compone aplicación y navegación. Biblioteca de routing y otras dependencias
no se seleccionan implícitamente por esta estructura.

## 5. Persistencia y migraciones

1. Revisar [BD/bd_uatre.sql](../BD/bd_uatre.sql) frente a RN, UC y REQ.
2. Representar tablas y relaciones en `schema.prisma` sin perder constraints,
   índices parciales, vistas, funciones ni triggers.
3. Incorporar objetos no representados por Prisma como SQL revisado en migraciones.
4. Verificar desde una base vacía la secuencia completa de creación y cambios.
5. Separar datos de demostración de datos operativos.

`BD/` se conserva durante la transición. Hoy su README exige mantener el SQL y
`docs/database-sql.md` idénticos; no se elimina esa fuente ni se cambia el flujo
sin documentar la transición. Futuramente las migraciones deberán ser el registro
reproducible de cambios, sin editar migraciones ya aplicadas.

No ejecutar el DDL actual sobre una base con datos como si fuera incremental;
no sustituir migraciones revisadas por sincronización automática del esquema.
`primera_vez_login` está aprobado, pero todavía no existe en SQL (C-06) y su uso
en el acceso trabajador debe considerar D-36.

### Motor y efectos

RN-167 sitúa el motor en PostgreSQL. Servicios invocarán funciones con parámetros,
dentro de la transacción correspondiente. No construir SQL concatenando entradas.

Antes de habilitar cada efecto, documentar quién lo realiza: servicio, función o
trigger. Ejemplos: atraso inicial y descuento de atraso ya aparecen como triggers;
el cierre llama al procesamiento correspondiente conforme a RN-167. El SQL
actual no se da por correcto solo por ejecutar: C-04 y D-01 a D-14 siguen abiertos.

## 6. Identidad, autorización y privacidad

- La sesión identifica usuario, actor y entidad asociada; no confiar en roles o
  seccionales que React envíe para operaciones autenticadas.
- UATRE administra su seccional; empresa sus recursos; trabajador su estado y
  acciones propias, además del pizarrón compartido permitido.
- Verificar pertenencia en consultas y mutaciones, también en referencias a
  empresas, tareas, establecimientos y trabajadores.
- Serializar respuestas explícitas por actor. Empresa no recibe números,
  identidades ni rotación de trabajadores (RN-117).
- No exponer credenciales, hashes, cookies, SQL interno ni stack traces.
- HTTPS en operación; protección CSRF y alcance de cookies deben cerrarse al
  seleccionar sesiones y despliegue.

Base documentada: bcrypt y sesiones servidor con cookies HttpOnly/Secure/SameSite.
JWT no está aprobado. Biblioteca, almacenamiento persistente de sesión y mecanismo
CSRF están pendientes; no se sustituye persistencia operativa por memoria del proceso.

No bloquear por cantidad de intentos fallidos. La sesión de una hora se renueva
con navegación/interacción, no con refrescos automáticos. D-29 mantiene pendiente
el mecanismo de acreditación de actividad y alcance por actor.

Google futuro no implica autorregistro ni acceso automático de todo correo Gmail.
UATRE mantiene el alta. D-35/D-36 se aplazan según lo solicitado por el usuario.

## 7. Transacciones y concurrencia

- Delimitar transacción en el servicio del caso de uso y utilizar su cliente
  transaccional en todas las consultas participantes.
- Cambios de una operación se confirman completos o se revierten completos.
- Reducir trabajo externo dentro de transacciones: no enviar notificaciones o
  esperar interacción humana mientras se mantienen bloqueos.
- Los procesos que modifican la misma rotación deben coordinarse por seccional;
  el mecanismo concreto de bloqueo debe definirse y probarse al revisar el motor.
- Un reintento, doble cierre o ejecución repetida de job no debe crear designaciones
  ni descuentos duplicados. Esto exige guardas por estado/restricciones y pruebas,
  no una afirmación genérica de que toda operación POST es idempotente.
- Definir nivel de aislamiento y tratamiento de conflictos para operaciones
  críticas antes de habilitarlas. No basta validar y escribir sin protección concurrente.

## 8. Procesos programados

Responsabilidades futuras: procesar cola habilitada, DESIGNADO → TRABAJANDO,
liberar al vencer 12 horas y renovar pizarrón a medianoche. Fuentes: RN-066/085/098/118,
RN-167 y REQ-SISTEMA-001 a 004.

Los jobs pertenecen al backend y reutilizan servicios/SQL. Su entrada puede
separarse del servidor HTTP posteriormente; no se define despliegue ni biblioteca
ahora. Necesitan detectar operaciones vencidas tras reinicio, evitar ejecuciones
duplicadas y respetar el cierre real/jornada válida una vez resueltas D-02/D-03.
Polling del cliente no sustituye ejecución de jobs ni renueva sesión.

## 9. Entorno local y configuración

- Usar PostgreSQL instalado localmente; comprobar versión y conexión al iniciar
  el bloque técnico. No se incorpora Docker como requisito.
- Preparar una base exclusiva de desarrollo; para integración, otra base de pruebas.
  Nombres y creación se definirán al preparar persistencia; no se creó ninguna ahora.
- Ejecutar Vite y Express en puertos distintos, configurables. Vite redirige `/api`
  al backend; el cliente utiliza rutas relativas como `/api/v1/health`.
- Propuesta de configuración backend: `DATABASE_URL`, `PORT`, `NODE_ENV`;
  otras variables se incorporan al seleccionar bibliotecas y funciones.
- Variables secretas solo en backend; `.env.example` contiene valores de ejemplo,
  nunca credenciales reales. Variables publicadas por Vite son públicas.
- Elegir versiones compatibles de Node LTS, Express, Vite, React y Prisma;
  registrar versiones y lockfiles al crear las aplicaciones.
- Comparaciones operativas en hora Argentina (RN-168). Configuración prevista
  `America/Argentina/Buenos_Aires` en PostgreSQL y manejo consistente en Node.
  Verificar conversión de TIMESTAMP actuales antes de operar fechas reales.
- Cierre ordenado: dejar de aceptar peticiones, terminar trabajo en curso y
  desconectar Prisma. Las políticas de tiempo de espera se definen al implementarlo.

## 10. Primer bloque de código y criterios de aceptación

Después de esta consolidación, preparar estandarización y base técnica:

1. Crear Express y Vite + React con scripts y configuración mínima documentada.
2. Conectar Prisma a PostgreSQL local sin ejecutar el motor.
3. Crear salud de API y comprobación separada de disponibilidad de BD; contratos
   precisos en Fase 8, sin exponer configuración interna.
4. Mostrar en React resultado de comunicación con la API.
5. Documentar comandos de ejecución y comprobación en README.

Aceptar el bloque solo tras verificar inicio, build del cliente, comunicación por
proxy, consulta mínima a BD, errores por configuración/conexión y cierre de recursos.
No se requieren reglas ambiguas de nombramiento para este recorrido técnico.

## 11. Pendientes y cierre de arquitectura

| Pendiente | Momento en que debe resolverse |
| --- | --- |
| Versiones y variables finales | Creación de base técnica. |
| Sesiones, CSRF, auditoría y actividad | Antes de habilitar acceso protegido; D-29/D-30/D-32. |
| Google y contraseña inicial | Iteración de acceso trabajador; D-35/D-36 aplazadas. |
| Migraciones e integridad SQL | Iteración de persistencia; C-04 a C-06. |
| Bloqueos, aislamiento y reintentos | Antes de habilitar motor concurrente. |
| Biblioteca/ejecución de jobs y recuperación | Antes del ciclo laboral automático. |
| Hosting, backups y restauración | Diseño de operación y Fase 13; RNF-004. |
| Herramientas de pruebas y calidad | Selección explícita al preparar verificaciones. |

La base mínima queda documentada; Fase 7 pasa a EN CONSOLIDACIÓN. No marcarla
COMPLETADA por crear el documento: revisar pendientes aplicables y coherencia con
API, modelo físico y reglas antes de cerrar la arquitectura correspondiente.
