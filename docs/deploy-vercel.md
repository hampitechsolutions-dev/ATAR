# Deploy En Vercel

Esta guia deja `apps/web` lista para publicarse en `Vercel` dentro del monorepo `ATAR`, manteniendo la arquitectura correcta:

- `web` en `Vercel`;
- `api` en `Render`, `Railway`, `Fly.io` o infraestructura equivalente;
- `Supabase` como base de datos consumida unicamente por la `api`.

## Si La API Va En Railway

Para `apps/api`, Railway debe ejecutar la API en modo produccion.

No usar:

```bash
npm run start:dev --workspace @atar/api
```

Usar:

```bash
npm run build --workspace @atar/api
npm run start:prod --workspace @atar/api
```

El repositorio ya incluye:

- generacion automatica de `Prisma Client` durante `postinstall`;
- generacion de `Prisma Client` dentro del script de `build`;
- un `railway.toml` con comandos de build y start listos para `apps/api`.

## Regla Clave

El frontend **no** debe conectarse directo a `Supabase` ni a `PostgreSQL`.

El flujo correcto es:

`Vercel web -> API Nest remota -> Supabase`

## Requisitos Previos

Antes de desplegar la web:

1. tener la `api` publicada en una URL accesible por HTTPS;
2. tener `CORS_ORIGIN` configurado en la `api` con el dominio final de `Vercel`;
3. verificar que la `api` responda al menos:
   - `GET /api/health`
   - `POST /api/auth/login`
   - `POST /api/auth/register`

## Variables De Web

Tomar como base [`.env.production.example`](file:///c:/Users/juans/Documents/trae_projects/ATAR/apps/web/.env.production.example).

```env
NEXT_PUBLIC_API_URL=https://api.atar.app/api
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME=ATAR
```

Notas:

- `NEXT_PUBLIC_API_URL` es obligatoria en `Vercel`;
- si falta, el build falla intencionalmente para evitar publicar una web apuntando a `localhost`;
- en local, si no se define, el proyecto sigue usando el proxy dev hacia `http://localhost:4000/api`.

## Configuracion En Vercel

Al importar el repositorio:

- Project root: repositorio completo;
- Root Directory: `apps/web`;
- Framework Preset: `Next.js`;
- Install Command: `npm install`;
- Build Command: `npm run build`;
- Output Directory: dejar el valor por defecto de `Next.js`.

Variables recomendadas:

- `NEXT_PUBLIC_API_URL=https://api.atar.app/api`
- `NEXT_PUBLIC_APP_ENV=production`
- `NEXT_PUBLIC_APP_NAME=ATAR`

## Variables Opcionales Para Emails

Si queres habilitar emails transaccionales desde la `api`, agrega estas variables en `Railway`:

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=ATAR <notificaciones@tu-dominio.com>
APP_WEB_URL=https://tu-web.vercel.app
```

Notas:

- `RESEND_API_KEY` habilita el envio real de emails para notificaciones comerciales;
- `EMAIL_FROM` debe usar un remitente validado en el proveedor;
- `APP_WEB_URL` se usa para convertir links internos como `/dashboard/...` en URLs absolutas dentro del email.

## Configuracion En La API

En la `api` remota, asegurarse de incluir el dominio real de `Vercel` en `CORS_ORIGIN`.

Ejemplo:

```env
CORS_ORIGIN=https://atar.vercel.app,https://atar-git-main-tu-team.vercel.app
```

Si usas previews de ramas en `Vercel`, agrega tambien esos dominios o un dominio estable intermedio.

## Validacion Recomendada

Despues del deploy:

1. abrir la web publicada;
2. probar registro de comprador;
3. probar login con usuario demo;
4. validar carga de dashboard;
5. confirmar que las llamadas salen hacia la `api` remota y no a `localhost`.

## Credenciales Demo

Si la base remota tiene el seed cargado:

- comprador: `comprador.demo@atar.test` / `Password123`
- proveedor: `proveedor.demo@atar.test` / `Password123`
