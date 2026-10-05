# Migraciones Prisma

La migración `0001_init` reproduce exactamente `BD/bd_uatre.sql` (fuente de
verdad ya revisada: 15 tablas, FKs, índices, 7 vistas del motor, 9 triggers y
3 funciones). No se reescribió su contenido para evitar divergencias con el
script aprobado.

Falta además aplicar `BD/bd_uatre_test.sql` sobre la base de pruebas; ese
script no forma parte de las migraciones de Prisma porque no modifica el
esquema, solo carga datos de referencia para pruebas manuales/automatizadas.

Para aplicar este esquema sobre una base vacía (`uatre_dev` o `uatre_test`)
una vez configurado `DATABASE_URL` en `.env`:

```powershell
npx prisma migrate deploy
```

Si en cambio la base ya fue creada manualmente ejecutando
`BD/bd_uatre.sql` con `psql` (ver `BD/README.md`), hay que marcar la
migración como aplicada sin volver a ejecutarla:

```powershell
npx prisma migrate resolve --applied 0001_init
```
