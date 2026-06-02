# Deploy De Staging

Esta guia deja un camino concreto para publicar `ATAR` en un entorno de `staging` conectando:

- `apps/web` en `Vercel`;
- `apps/api` en `Render`, `Railway` o `Fly.io`;
- `Supabase` como base `PostgreSQL`.

## Objetivo

Tener un entorno compartido para:

- QA;
- demos internas;
- validacion funcional end to end;
- pruebas de integracion entre `web`, `api` y base de datos.

## Arquitectura Recomendada

- `web`: `https://staging.atar.app`
- `api`: `https://api-staging.atar.app`
- `database`: proyecto de `Supabase` separado de produccion

## Orden Recomendado

1. preparar la base en `Supabase`
2. desplegar la `api`
3. correr migracion inicial
4. ejecutar `seed` tecnico si quieres datos demo
5. desplegar la `web` apuntando a la `api`
6. validar `health`, auth y flujo de comprador/proveedor

## Variables De API

Tomar como base [`.env.staging.example`](file:///c:/Users/juans/Documents/trae_projects/ATAR/apps/api/.env.staging.example).

Variables minimas:

```env
DATABASE_URL=postgresql://postgres.PROJECT-REF:[YOUR-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT-REF.supabase.co:5432/postgres
JWT_SECRET=un-secreto-largo-y-distinto-por-entorno
JWT_EXPIRES_IN=7d
PORT=4000
APP_ENV=staging
CORS_ORIGIN=https://staging.atar.app,https://atar-staging.vercel.app
```

Notas:

- `DATABASE_URL` usa el `pooler` de `Supabase`;
- `DIRECT_DATABASE_URL` usa la conexion directa;
- `CORS_ORIGIN` admite multiples dominios separados por coma;
- si `Vercel` te genera una URL preview estable adicional, puedes sumarla a `CORS_ORIGIN`.

## Variables De Web

Tomar como base [`.env.staging.example`](file:///c:/Users/juans/Documents/trae_projects/ATAR/apps/web/.env.staging.example).

```env
NEXT_PUBLIC_API_URL=https://api-staging.atar.app/api
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_NAME=ATAR
```

## Build Y Start De API

En el proveedor que uses para la `api`, configurar:

- Install command: `npm install`
- Build command: `npm run build --workspace @atar/api`
- Start command: `npm run start:prod --workspace @atar/api`

Antes de abrir el entorno a QA, correr:

```bash
npm run prisma:migrate:deploy --workspace @atar/api
npm run prisma:seed --workspace @atar/api
```

Si tu proveedor permite un job post deploy, esos comandos pueden ir ahi. Si no, puedes ejecutarlos desde local con las mismas variables del entorno remoto.

## Deploy De Web

En `Vercel`:

- root del repo: monorepo completo
- framework: `Next.js`
- app objetivo: `apps/web`
- variable obligatoria: `NEXT_PUBLIC_API_URL=https://api-staging.atar.app/api`

Una vez publicada la web:

- agregar el dominio final de `staging` a `CORS_ORIGIN` de la `api`;
- redeployar la `api` si cambiaste variables.

## Checklist De Validacion

Validar estos endpoints y flujos:

- `GET https://api-staging.atar.app/api/health`
- login con usuario demo
- registro de nuevo comprador
- creacion de solicitud desde dashboard comprador
- visualizacion de oportunidades desde dashboard proveedor
- envio de cotizacion
- comparador detallado del comprador

## Credenciales Demo Del Seed

Si corriste `npm run prisma:seed --workspace @atar/api`, quedan:

- comprador: `comprador.demo@atar.test` / `Password123`
- proveedor: `proveedor.demo@atar.test` / `Password123`

## Riesgos A Vigilar

- `CORS_ORIGIN` incompleto y bloqueos desde la web;
- usar la URL directa de `Supabase` para runtime en vez del `pooler`;
- ejecutar seeds en una base equivocada;
- mezclar `staging` y `produccion` en el mismo proyecto de `Supabase`.

## Siguiente Paso Despues De Staging

- agregar deploy automatizado por rama;
- crear una estrategia de backups;
- introducir observabilidad y logs centralizados;
- separar seed tecnico de seed comercial si el producto crece.
