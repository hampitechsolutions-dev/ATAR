# Supabase Y GitHub

Esta guia deja registrado el setup externo actual del proyecto.

## Estado Actual

- repositorio remoto previsto: `https://github.com/hampitechsolutions-dev/ATAR.git`
- proyecto de base de datos creado en `Supabase`
- conexion directa disponible para tareas administrativas y migraciones
- `transaction pooler` disponible para runtime
- API preparada para `Prisma + PostgreSQL`

## Cadenas Compartidas

Usar siempre reemplazando `YOUR-PASSWORD` por la clave real y sin commitear secretos:

```env
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.moocictolvaqqrikokqf.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres.moocictolvaqqrikokqf:[YOUR-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```

## Uso Recomendado

- `DIRECT_DATABASE_URL`: migraciones, introspeccion, tareas administrativas
- `DATABASE_URL`: runtime de la API, conexiones desde backend desplegado

## Estado Tecnico Actual

El datasource de `Prisma` ya debe quedar apuntando a `postgresql` en [schema.prisma](file:///c:/Users/juans/Documents/trae_projects/ATAR/apps/api/prisma/schema.prisma).

Eso implica:

- la API usa `DATABASE_URL` para runtime;
- Prisma puede usar `DIRECT_DATABASE_URL` para migraciones;
- la base `SQLite` historica en `apps/api/prisma/dev.db` queda como legado local y no se migra automaticamente;
- si quieres preservar datos de `SQLite`, hay que hacer una importacion aparte.

## Migracion Recomendada A Supabase

1. copiar `apps/api/.env.example` a `apps/api/.env`
2. completar `DATABASE_URL` con el `pooler` y `DIRECT_DATABASE_URL` con la conexion directa
3. regenerar cliente Prisma
4. aplicar la migracion inicial versionada
5. ejecutar el seed demo si quieres poblar desarrollo o staging tecnico
6. levantar la API y validar endpoints base
7. correr pruebas e2e contra una base aislada de staging o desarrollo

Comandos utiles:

```bash
npm run prisma:generate --workspace @atar/api
npm run prisma:migrate:dev --workspace @atar/api
npm run prisma:migrate:deploy --workspace @atar/api
npm run prisma:seed --workspace @atar/api
```

El `seed` actual deja:

- un comprador demo;
- un proveedor demo;
- un pedido publicado;
- una cotizacion enviada para comparar en web.

## Variables Sugeridas

Para `staging` o `produccion` de la API:

```env
DATABASE_URL=postgresql://postgres.moocictolvaqqrikokqf:[YOUR-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.moocictolvaqqrikokqf.supabase.co:5432/postgres
JWT_SECRET=definir-secreto-seguro
JWT_EXPIRES_IN=7d
APP_ENV=staging
PORT=4000
CORS_ORIGIN=https://staging.atar.app,https://atar-staging.vercel.app
```

Si usas `PostgreSQL` local en desarrollo:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atar
DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atar
JWT_SECRET=atar-dev-secret
JWT_EXPIRES_IN=7d
APP_ENV=development
PORT=4000
```

Para la `web`:

```env
NEXT_PUBLIC_API_URL=https://api-staging.atar.app/api
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_NAME=ATAR
```

## GitHub

El remoto esperado del proyecto es:

```text
https://github.com/hampitechsolutions-dev/ATAR.git
```

Pasos recomendados en local:

1. inicializar el repo si todavia no existe `.git`
2. agregar `origin`
3. revisar `.gitignore`
4. hacer primer commit cuando quieras versionar esta base
5. recien despues empujar a `main` o a una rama de trabajo

## Deploy Recomendado

La guia operativa para publicar `web` + `api` en un entorno de `staging` real esta en [deploy-staging.md](file:///c:/Users/juans/Documents/trae_projects/ATAR/docs/deploy-staging.md).

## Seguridad

- no guardar passwords reales en `.env.example`
- no commitear `.env`
- usar secretos del proveedor de deploy para `staging` y `produccion`
- preferir rotacion de credenciales si alguna vez se expusieron
