# Montaje De Entornos

Esta guia define como montar `ATAR` en `desarrollo`, `staging` y `produccion` con una base comun: la API ya queda preparada para `PostgreSQL` y `Supabase`.

## Objetivo

Separar claramente:

- configuracion local de desarrollo;
- entorno de pruebas integradas;
- entorno productivo estable.

## Estructura Recomendada

El proyecto tiene tres superficies principales:

- `apps/web`
- `apps/api`
- `apps/mobile`

Cada una consume variables segun el entorno activo.

## Entornos Recomendados

### Desarrollo

Uso:

- trabajo diario;
- pruebas locales;
- debugging;
- cambios de UI y backend.

Configuracion sugerida:

- `web`: `http://localhost:3000`
- `api`: `http://localhost:4000`
- `mobile`: `Expo` apuntando a la API local o a una IP de red local
- base de datos: `PostgreSQL` local o proyecto de `Supabase` de desarrollo

### Staging

Uso:

- QA;
- demo interna;
- validacion funcional antes de publicar;
- pruebas integradas entre web, mobile y API.

Configuracion sugerida:

- `web`: dominio separado, por ejemplo `staging.atar.app`
- `api`: dominio separado, por ejemplo `api-staging.atar.app`
- `mobile`: build interna o preview build apuntando a staging
- base de datos: `PostgreSQL` separado de produccion

### Produccion

Uso:

- entorno real de usuarios;
- datos productivos;
- monitoreo y backups formales.

Configuracion sugerida:

- `web`: `atar.app` o dominio definitivo
- `api`: `api.atar.app`
- `mobile`: release builds apuntando al backend productivo
- base de datos: `PostgreSQL` administrado

## Variables Por App

### API

Archivo esperado:

- `apps/api/.env`

Plantilla base:

```env
DATABASE_URL="postgresql://postgres.PROJECT-REF:[YOUR-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"
DIRECT_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT-REF.supabase.co:5432/postgres"
JWT_SECRET="replace-with-a-strong-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
APP_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

Notas:

- `DATABASE_URL` debe apuntar a la URL de runtime;
- en `Supabase`, para runtime conviene usar el `pooler`;
- `DIRECT_DATABASE_URL` se usa para migraciones y tareas administrativas de Prisma;
- si usas `PostgreSQL` local, ambas URLs pueden ser la misma;
- `JWT_SECRET` debe cambiar por entorno;
- `CORS_ORIGIN` admite uno o varios dominios separados por coma;
- nunca compartir la base de `staging` con `produccion`.

### Web

Crear:

- `apps/web/.env.local` para desarrollo;
- `apps/web/.env.staging` para staging;
- `apps/web/.env.production` para produccion.

Variables sugeridas:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=ATAR
```

Para staging:

```env
NEXT_PUBLIC_API_URL=https://api-staging.atar.app/api
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_NAME=ATAR
```

Para produccion:

```env
NEXT_PUBLIC_API_URL=https://api.atar.app/api
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME=ATAR
```

### Mobile

Crear:

- `apps/mobile/.env.local` para desarrollo;
- variables de build para staging y produccion.

Variables sugeridas:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:4000/api
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_NAME=ATAR
```

Notas:

- para `Expo`, si pruebas en celular real, no uses `localhost`;
- usa la IP local de tu maquina;
- en staging y produccion conviene usar dominios HTTPS.

## Flujo Recomendado De Montaje

### 1. Desarrollo Local

Desde la raiz:

```bash
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
copy apps\mobile\.env.example apps\mobile\.env.local
```

Editar `apps/api/.env` y definir las credenciales reales del `PostgreSQL` que vayas a usar.

Si trabajas con `Supabase`:

- `DATABASE_URL`: URL del pooler;
- `DIRECT_DATABASE_URL`: URL directa del proyecto.

Si trabajas con `PostgreSQL` local:

- puedes usar la misma URL para `DATABASE_URL` y `DIRECT_DATABASE_URL`.

Preparar Prisma:

```bash
npm run prisma:generate --workspace @atar/api
npm run prisma:migrate:deploy --workspace @atar/api
npm run prisma:seed --workspace @atar/api
```

Si mas adelante incorporas migraciones versionadas:

```bash
npm run prisma:migrate:dev --workspace @atar/api
```

El `seed` actual crea:

- un comprador demo;
- un proveedor demo;
- un pedido publicado;
- una cotizacion asociada para validar el flujo end to end.

Levantar servicios:

```bash
npm run dev:api
npm run dev:web
npm run dev:mobile
```

## URLs Locales

- `web`: `http://localhost:3000`
- `api`: `http://localhost:4000/api`
- `health`: `http://localhost:4000/api/health`

## Estrategia De Infraestructura Recomendada

### Desarrollo

- `PostgreSQL` local o `Supabase` de desarrollo;
- variables en archivos locales no versionados;
- migraciones versionadas y `seed` reproducible.

### Staging

- deploy de `web` en `Vercel`;
- deploy de `api` en `Railway`, `Render` o `Fly.io`;
- `PostgreSQL` administrado o proyecto separado de `Supabase`;
- storage externo si luego suben archivos.

### Produccion

- `web`: `Vercel` o hosting equivalente;
- `api`: contenedor o servicio administrado;
- `database`: `PostgreSQL` con backups;
- monitoreo: logs centralizados y alertas;
- secretos manejados por plataforma, no por archivos commiteados.

## Convencion De Archivos

Sugerencia:

- `apps/api/.env`
- `apps/api/.env.staging.example`
- `apps/api/.env.staging`
- `apps/api/.env.production`
- `apps/web/.env.local`
- `apps/web/.env.staging.example`
- `apps/web/.env.staging`
- `apps/web/.env.production`
- `apps/mobile/.env.local`
- `apps/mobile/.env.staging.example`
- `apps/mobile/.env.staging`
- `apps/mobile/.env.production`

## Recomendacion Practica Para ATAR Hoy

Etapa actual:

1. `desarrollo` con `PostgreSQL` local o `Supabase`;
2. `staging` con `PostgreSQL` separado;
3. `produccion` despues de cerrar deploy, backups y observabilidad.

## Siguiente Paso Tecnico

Conviene seguir con:

- primera migracion versionada de Prisma;
- estrategia de datos semilla para `staging`;
- deploy automatizado por rama;
- separacion formal de secretos por plataforma.
- guia operativa de staging en `docs/deploy-staging.md`.
