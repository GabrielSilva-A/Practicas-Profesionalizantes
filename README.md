# Sistema de Gestión y Asignación de Personal Eventual — UATRE

Proyecto de Prácticas Profesionalizantes de la Tecnicatura Superior en
Programación. Su objetivo es digitalizar la solicitud y asignación de personal
eventual para empresas del sector agrícola, preservando las reglas operativas
de las seccionales de UATRE.

## Estado del proyecto

El repositorio contiene documentación funcional, diseño de datos, scripts
PostgreSQL, arquitectura mínima y un contrato inicial parcial de API.

- **Fase 7 — Arquitectura:** en consolidación.
- **Fase 8 — Diseño de API:** en proceso, por módulo.
- **Aplicación web:** primer bloque técnico (scaffolding) creado y validado en
  `backend/` y `frontend/`. Implementa healthchecks, login/logout de
  EMPRESA/SECCIONAL y registros públicos de seccionales y empresas; todavía no
  implementa lógica de negocio (motor, asistencia, pedidos, designaciones,
  pizarrón, historial). Ver [la arquitectura mínima](docs/architecture.md) §10.
- **Estandarización:** README y configuración de Git y formato incorporados.

El estado detallado se mantiene en [el roadmap](docs/project-roadmap.md).
Las decisiones pendientes no se consideran comportamientos implementados.

## Funcionamiento previsto

1. UATRE administra empresas, trabajadores y lista de rotación de su seccional.
2. El encargado registra y cierra la asistencia diaria.
3. Las empresas crean pedidos con cantidad, tarea, establecimiento y horario.
4. El sistema determina cuándo procesarlos y evalúa atrasados y rotación ordinaria.
5. Se gestionan designaciones, disponibilidad y cobertura excepcional conforme
   a las reglas y decisiones que se consoliden.
6. Los actores consultan el pizarrón y los históricos permitidos.

La operación está aislada por seccional. La empresa no accede a la identidad ni
a los números de los trabajadores designados. Las condiciones del trabajador
pueden coexistir: no se reducen a un único estado global.

## Tecnologías aprobadas

| Área | Tecnología |
| --- | --- |
| API | Node.js + Express, JavaScript |
| Cliente | Vite + React, JavaScript |
| Persistencia | PostgreSQL + Prisma |
| Organización | Monorepo simple con package.json por aplicación |
| Desarrollo local | PostgreSQL local y proxy Vite `/api` hacia Express |

Versiones efectivamente instaladas en el scaffolding (ver `package.json` de cada
aplicación): Express 5.2.1, React 19.3.0, Vite 8.3.2, Prisma/`@prisma/client`
6.19.3. Se fijó Prisma en la rama 6.x porque la versión 7 cambia el formato de
configuración del datasource (requiere `prisma.config.ts` y adapters) y rompe el
patrón `url = env("DATABASE_URL")` simple que describe la arquitectura. Consultar
[la arquitectura mínima](docs/architecture.md).

## Estructura actual

```text
/
├── README.md
├── AGENTS.md
├── .gitignore
├── .editorconfig
├── .gitattributes
├── .opencode/skills/             # skills uatre-* (lista en AGENTS.md)
├── BD/
│   ├── README.md
│   ├── bd_uatre.sql
│   └── bd_uatre_test.sql
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/0001_init/migration.sql
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── database/
│       ├── middlewares/
│       ├── modules/health/
│       └── jobs/
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── app/App.jsx
│       ├── services/api.js
│       ├── styles/
│       ├── components/
│       └── features/
└── docs/
```

La estructura prevista y las responsabilidades de cada carpeta están en el
documento de arquitectura. `backend/` y `frontend/` contienen por ahora el
scaffolding técnico con los flujos de acceso iniciales: servidor Express,
cliente Vite + React, esquema Prisma, healthchecks (`/health` y `/health/db`),
login/logout de EMPRESA/SECCIONAL y registros públicos de seccionales y
empresas. La lógica de negocio todavía no está implementada.

## Documentación

> El índice canónico de **fuentes de verdad**, reglas para agentes y skills
> está en [`AGENTS.md`](AGENTS.md); la tabla de abajo es solo un atajo.

| Documento | Contenido |
| --- | --- |
| [Guía del proyecto](docs/PROJECT_GUIDE.md) | Contexto y mapa de fuentes. |
| [Roadmap](docs/project-roadmap.md) | Fases y avance del proyecto. |
| [Plan de ejecución](docs/execution-plan.md) | Bloqueadores antes de implementar. |
| [Reglas de negocio](docs/business-rules.md) | Comportamiento operativo y excepciones. |
| [Requerimientos](docs/requirements.md) | Funcionalidades y requisitos no funcionales. |
| [Casos de uso UATRE](docs/uc-uatre.md) | Administración de la seccional. |
| [Casos de uso Empresa](docs/uc-empresa.md) | Pedidos y consultas empresariales. |
| [Casos de uso Trabajador](docs/uc-trabajador.md) | Estado, disponibilidad y consultas personales. |
| [Modelo de dominio](docs/modelo-dominio.md) | Conceptos y relaciones del negocio. |
| [Arquitectura](docs/architecture.md) | Componentes, responsabilidades y entorno previsto. |
| [Diseño de API](docs/api-design.md) | Convenciones y contratos iniciales. |
| [OpenAPI parcial](docs/openapi.yaml) | Contrato formal inicial, no API ejecutable. |
| [Decisiones y dudas](docs/decisiones-pendientes.md) | Definiciones aprobadas y preguntas pendientes. |
| [Base de datos](docs/base_datos.md) | Documentación técnica del esquema. |
| [SQL del esquema](BD/bd_uatre.sql) | Fuente única del esquema físico. |
| [Scripts de BD](BD/README.md) | Ejecución y validaciones documentadas del SQL. |

## Preparar y comprobar la base de datos

Para ejecutar los scripts existentes se requiere PostgreSQL y `psql` disponible.
Usar una **base vacía y exclusiva de desarrollo o pruebas**. Estos scripts son DDL
y datos de demostración, no migraciones incrementales para una base con datos.

Desde la raíz del repositorio, en PowerShell:

```powershell
psql -U <usuario> -d uatre_test -v ON_ERROR_STOP=1 -f ".\BD\bd_uatre.sql"
psql -U <usuario> -d uatre_test -v ON_ERROR_STOP=1 -f ".\BD\bd_uatre_test.sql"
```

Usar una base `uatre_test` vacía y exclusiva: `bd_uatre_test.sql` trunca las
tablas y carga datos de demostración. No ejecutar esos scripts sobre una base
con datos que se quieran conservar. La base de desarrollo `uatre_dev` se prepara
con la migración Prisma, no con los fixtures de prueba:
`cd backend; npm run prisma:migrate:deploy`. No guardar contraseñas reales en
documentación o comandos versionados. Consultar [BD/README.md](BD/README.md)
para el alcance de las comprobaciones; ejecutar los scripts no acredita que el
motor cumpla todas las reglas de negocio pendientes de revisión.

> **Entorno local verificado:** PostgreSQL 18.6; `uatre_dev` tiene aplicada la
> migración inicial y `uatre_test` tiene el esquema y los datos de demostración.
> El backend se conecta usando el `DATABASE_URL` guardado en `backend/.env`
> (ignorado por Git). La base preexistente `uatre_db`, con un esquema distinto
> de 13 tablas, no fue modificada.

## Ejecutar el scaffolding técnico (backend + frontend)

Requiere Node.js (probado con v24) y, para persistencia real, PostgreSQL con una
base vacía de desarrollo.

### 1. Backend (Express + Prisma)

```powershell
cd backend
copy .env.example .env   # completar DATABASE_URL local; no compartir ni versionar .env
npm install
npm run prisma:generate
npm test
npm run dev               # o: npm start
```

- Si la base de datos ya existe con el esquema de `BD/bd_uatre.sql` aplicado
  manualmente, marcar la migración como aplicada en lugar de ejecutarla:
  `npx prisma migrate resolve --applied 0001_init` (ver
  `backend/prisma/migrations/README.md`).
- Si la base está vacía, aplicar la migración con `npm run prisma:migrate:deploy`.
- Verificación rápida una vez levantado (puerto 3000 por defecto):
  - `GET /api/v1/health` → `200 {"status":"ok"}` (no toca la base de datos).
  - `GET /api/v1/health/db` → `200` si la base responde, `503` si no.
- `npm test` ejecuta las pruebas HTTP del bloque inicial con el runner nativo
  `node:test`; no requiere una base de datos activa porque Prisma se aísla en esas
  pruebas.

### 2. Frontend (Vite + React)

```powershell
cd frontend
copy .env.example .env    # no contiene secretos; placeholder documentado
npm install
npm run dev                # http://localhost:5173, con proxy /api → :3000
npm run build               # build de producción a dist/
```

Con ambos servidores corriendo, `http://localhost:5173` consume
`/api/v1/health` y `/api/v1/health/db` a través del proxy de Vite y muestra el
estado de la API y de la base de datos por separado, sin mezclar ambos checks.

No versionar los archivos `.env` reales; solo `.env.example` queda en el repositorio.

## Convenciones del repositorio

- Archivos de texto en UTF-8 y finales de línea LF, según `.editorconfig` y
  `.gitattributes`. No se renormalizaron masivamente los archivos existentes.
- Indentación general de dos espacios; SQL de cuatro espacios. Markdown conserva
  los espacios finales que pueden representar saltos de línea.
- No versionar `.env`, dependencias, builds, cobertura, logs ni backups locales.
- Conservar plantillas `.env.example` sin secretos y lockfiles de las aplicaciones.
- `.opencode/` conserva su configuración local de exclusiones; sus skills son
  versionables y no constituyen las dependencias del backend/frontend.
- Cambios pequeños, coherentes con las fuentes y verificaciones acordes al alcance.

## Trabajo con agentes

Leer [AGENTS.md](AGENTS.md) y cargar la skill `uatre-*` que corresponda al
área de la tarea (lista de skills vigentes en `AGENTS.md`).
Consultar las RN, REQ y UC afectados antes de diseñar o implementar; las
ambigüedades que cambian el negocio requieren una decisión, no una suposición.

## Próximo bloque

Con el scaffolding técnico validado (servidor, cliente, proxy, Prisma y
healthchecks), el siguiente trabajo es cerrar el contrato de API (Fase 8) de
cada módulo de negocio antes de implementar su lógica, siguiendo el orden del
roadmap. Las decisiones pendientes de acceso Google, sesiones y motor se
abordarán cuando afecten al módulo correspondiente, sin asumir respuestas no
acordadas.
