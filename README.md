# ATAR

ATAR es una plataforma B2B para el mercado industrial argentino y latinoamericano que conecta demanda, oferta y fuerza comercial en un mismo sistema.

Debe funcionar como:

- pagina web,
- aplicacion mobile,
- plataforma operativa unificada con backend compartido.

La propuesta central es profesionalizar el proceso comercial industrial mediante:

- publicacion de necesidades y licitaciones por parte de clientes,
- cotizacion privada y comparativa por parte de proveedores,
- participacion optativa de vendedores humanos o agentes de IA,
- herramientas de CRM y reputacion para mejorar conversion, cumplimiento y transparencia.

## Vision

Convertirse en la infraestructura comercial digital para industrias, distribuidores, compradores y vendedores tecnicos de la region.

## Problema Que Resuelve

Hoy gran parte del comercio industrial funciona con procesos fragmentados:

- telefono,
- WhatsApp,
- Excel,
- relaciones historicas,
- seguimiento manual,
- baja trazabilidad comercial,
- poca comparacion objetiva entre proveedores.

ATAR busca centralizar ese flujo y transformar contactos dispersos en oportunidades, cotizaciones y operaciones gestionadas de forma profesional.

## Propuesta De Valor

Para clientes:

- publicar necesidades concretas,
- recibir multiples cotizaciones sin exponer la oferta entre competidores,
- comparar proveedores por precio, plazo, calidad, reputacion y servicio,
- elegir compra automatica o acompanamiento humano.

Para proveedores:

- acceder a demanda calificada,
- responder licitaciones y pedidos privados,
- administrar catalogo, plazos, documentacion tecnica y condiciones comerciales,
- ampliar alcance sin depender solo de fuerza de ventas tradicional.

Para vendedores humanos:

- operar con un mini CRM propio,
- proteger cartera y origen de oportunidades,
- recibir asignacion o participacion en operaciones,
- certificar experiencia y especialidad.

## Alcance Inicial

La primera etapa debe enfocarse en validar adopcion con un MVP simple:

1. registro y perfiles de clientes, proveedores y vendedores;
2. publicacion de pedidos y licitaciones;
3. carga de catalogo y condiciones comerciales sin necesidad de stock/precio obligatorios;
4. cotizaciones privadas comparables por el cliente;
5. adjudicacion y trazabilidad basica;
6. CRM comercial minimo;
7. reglas iniciales de reputacion, reclamos y cumplimiento.

## Documentacion

- Ver `docs/fundacion-producto.md` para el detalle funcional, operativo y tecnico inicial.
- Ver `docs/prd-mvp-web-app.md` para la definicion del MVP con enfoque web y app.
- Ver `docs/arquitectura-web-app.md` para la propuesta tecnica multiplataforma.
- Ver `docs/identidad-visual.md` para la direccion inicial de branding, UI y tono visual.
- Ver `docs/entornos.md` para el montaje de desarrollo, staging y produccion.
- Ver `docs/supabase-github-setup.md` para el setup externo actual de base de datos y repositorio.
- Ver `docs/deploy-staging.md` para publicar `web` + `api` en un staging real conectado a `Supabase`.

## Base Tecnica Actual

El repositorio ya esta preparado como monorepo inicial con:

- `apps/web`: aplicacion web en Next.js;
- `apps/mobile`: aplicacion mobile en Expo/React Native;
- `apps/api`: backend en NestJS;
- `packages/shared`: espacio para tipos y configuraciones compartidas.

Vistas web base ya incorporadas:

- `home` institucional;
- `acceso` con login/registro conectado a la API;
- `proveedores`;
- `dashboard comprador`;
- `dashboard proveedor`.

Flujo web ya funcional:

- registro o login desde `/acceso`;
- comprador crea solicitudes desde `dashboard comprador`;
- comprador ve cotizaciones de una solicitud;
- proveedor ve oportunidades abiertas desde `dashboard proveedor`;
- proveedor envia cotizaciones reales a pedidos publicados.

La API ya incluye:

- autenticacion inicial con JWT;
- roles de `ADMIN`, `BUYER`, `SUPPLIER` y `SELLER`;
- modelo de datos base con Prisma;
- soporte de `PostgreSQL` preparado para `Supabase`;
- flujo inicial de pedidos y cotizaciones.

Setup externo ya definido:

- `Supabase` creado como destino previsto para `PostgreSQL`;
- `GitHub` definido en `https://github.com/hampitechsolutions-dev/ATAR.git`.

## Comandos Iniciales

Desde la raiz del proyecto:

1. `npm install`
2. copiar `apps/api/.env.example` a `apps/api/.env` si no existe;
3. copiar `apps/web/.env.example` a `apps/web/.env.local`;
4. copiar `apps/mobile/.env.example` a `apps/mobile/.env.local` si vas a usar mobile;
5. completar `DATABASE_URL` y `DIRECT_DATABASE_URL` en `apps/api/.env`;
6. `npm run prisma:generate --workspace @atar/api`
7. `npm run prisma:migrate:deploy --workspace @atar/api`
8. `npm run prisma:seed --workspace @atar/api`
9. `npm run dev:web`
10. `npm run dev:api`
11. `npm run dev:mobile`

Atajos desde la raiz:

- `npm run dev`: levanta `api` + `web`
- `npm run dev:all`: levanta `api` + `web` + `mobile`
- `npm run dev:mobile:web`: abre la superficie mobile en navegador

Notas de base de datos:

- `DATABASE_URL` se usa para runtime de la API;
- `DIRECT_DATABASE_URL` se usa para migraciones y tareas administrativas;
- en `Supabase`, usar `pooler` para `DATABASE_URL` y conexion directa para `DIRECT_DATABASE_URL`;
- en `PostgreSQL` local, ambas pueden apuntar a la misma base.
- existe una migracion inicial versionada en `apps/api/prisma/migrations`;
- existe un `seed` demo idempotente con comprador y proveedor de ejemplo.

## Endpoints Base Del Backend

- `GET /api/health`
- `GET /api/catalog/bootstrap`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/requests`
- `GET /api/requests/mine`
- `GET /api/requests/open`
- `GET /api/requests/:id`
- `GET /api/requests/:id/quotes`
- `POST /api/quotes/request/:requestId`
- `GET /api/quotes/mine`

## Principios Del Producto

- transparencia para el comprador;
- competencia real entre proveedores;
- proteccion del rol del vendedor humano;
- trazabilidad comercial y operativa;
- cumplimiento legal y proteccion de datos desde el inicio;
- construccion por fases para validar antes de escalar.

## Proximos Pasos Recomendados

1. generar la primera migracion versionada de Prisma sobre PostgreSQL;
2. definir estrategia de datos semilla para staging;
3. modelar reglas de comision y originacion;
4. incorporar deploy de API conectado a Supabase;
5. disenar flujos UX principales multiplataforma restantes;
6. crear backlog de implementacion priorizado por impacto.
