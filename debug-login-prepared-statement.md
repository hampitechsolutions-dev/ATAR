# Debug Session: login-prepared-statement [OPEN]

## Sintoma
- En Railway, `POST /api/auth/login` responde `500`.
- Prisma falla con `prepared statement "s0" does not exist`.

## Hipotesis
- H1: `DATABASE_URL` en Railway apunta al pooler transaccional de Supabase sin los parametros compatibles con Prisma.
- H2: `DIRECT_DATABASE_URL` y `DATABASE_URL` estan invertidas o una de ellas quedo mal armada.
- H3: Prisma en produccion esta abriendo conexiones a traves de PgBouncer y necesita `pgbouncer=true` para evitar prepared statements persistentes.
- H4: Railway arranco con variables viejas y el deploy actual no tomo las URLs correctas de Supabase.

## Evidencia inicial
- Log de Railway con `PrismaClientUnknownRequestError`.
- Error Postgres `26000`.
- Mensaje exacto: `prepared statement "s0" does not exist`.

## Evidencia adicional
- Con `Direct connection` en ambas variables, Railway falla con `P1001`.
- Mensaje exacto: `Can't reach database server at db.moocictolvaqqrikokqf.supabase.co:5432`.

## Estado de hipotesis
- H1: Confirmada. `Transaction Pooler` sin parametros compatibles rompe Prisma por prepared statements.
- H2: Rechazada. El problema ya no es una inversion de variables sino el tipo de endpoint usado.
- H3: Confirmada. Prisma necesita evitar `Transaction Pooler` simple.
- H4: Rechazada por la nueva evidencia.

## Conclusión provisional
- Railway no puede usar de forma estable la `Direct connection` de Supabase en este entorno.
- La configuracion mas razonable para Railway es usar `Session Pooler` en runtime.
- Si hace falta destrabar migraciones desde Railway, se puede usar tambien `Session Pooler` temporalmente en `DIRECT_DATABASE_URL`.

## Proximo paso
- Cambiar `DATABASE_URL` y `DIRECT_DATABASE_URL` a `Session Pooler` con `sslmode=require`, redeployar y reintentar login.
