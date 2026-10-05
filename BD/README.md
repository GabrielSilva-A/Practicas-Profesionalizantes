# Scripts PostgreSQL

## Contenido

- `bd_uatre.sql`: DDL completo del diseño de base de datos y **fuente única del esquema físico**. La copia `docs/database-sql.md` fue eliminada el 2026-10-01 por duplicarse byte a byte con este archivo.
- `bd_uatre_test.sql`: datos de demostración y verificaciones del esquema. Requiere que `bd_uatre.sql` se haya ejecutado previamente.

## Ejecución

Los scripts están diseñados para una **base PostgreSQL vacía** y deben ejecutarse con parada ante el primer error:

```powershell
psql -U <usuario> -d <base_vacia> -v ON_ERROR_STOP=1 -f .\BD\bd_uatre.sql
psql -U <usuario> -d <base_vacia> -v ON_ERROR_STOP=1 -f .\BD\bd_uatre_test.sql
```

No se deben ejecutar directamente sobre una base existente con datos: no son migraciones incrementales. Una migración desde el esquema anterior de 13 tablas deberá planificarse y validarse por separado.

## Validación realizada

El 2026-09-22 se ejecutaron ambos scripts en una base temporal PostgreSQL 18.6 con `ON_ERROR_STOP=1`. La validación completó correctamente y verificó:

- creación de 15 tablas y sus relaciones;
- creación de vistas, índices, funciones y triggers;
- registro y uso de `TAREAS_EMPRESA` y `ESTABLECIMIENTOS`;
- cobertura de un pedido de demostración.

