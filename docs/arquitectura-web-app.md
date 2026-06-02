# Arquitectura Recomendada - Web + App

## 1. Objetivo

Definir una arquitectura inicial que permita construir ATAR como pagina web y aplicacion mobile sin duplicar logica de negocio ni generar dos productos desconectados.

## 2. Principios De Arquitectura

- un solo backend y una sola fuente de verdad;
- una sola base de datos principal;
- roles y permisos compartidos;
- experiencia adaptada segun dispositivo;
- crecimiento modular por dominios;
- trazabilidad desde el MVP.

## 3. Recomendacion General

La opcion mas conveniente para esta etapa es:

- `web`: Next.js;
- `app`: React Native con Expo;
- `backend`: NestJS;
- `base de datos`: PostgreSQL;
- `auth`: JWT o proveedor gestionado con RBAC;
- `storage`: S3 compatible;
- `notificaciones`: email al inicio y push en segunda etapa.

## 4. Por Que Esta Opcion

### Next.js En Web

Conviene porque:

- permite construir paneles empresariales con rapidez;
- sirve para marketing site y aplicacion web;
- tiene ecosistema solido para formularios, tablas y auth.

### React Native + Expo En App

Conviene porque:

- permite una app real para iOS y Android;
- acelera desarrollo y testing;
- comparte lenguaje y parte de la logica con la web.

### NestJS En Backend

Conviene porque:

- ordena bien dominios complejos;
- facilita roles, validaciones y APIs;
- escala mejor que una API improvisada cuando aparecen modulos de negocio.

## 5. Estructura Logica Del Sistema

### Capa 1 - Clientes

- web publica institucional;
- web app para comprador, proveedor, vendedor y admin;
- mobile app para comprador y vendedor, con soporte operativo a proveedor.

### Capa 2 - API Y Servicios

Modulos sugeridos:

- autenticacion;
- empresas y usuarios;
- pedidos;
- catalogo;
- cotizaciones;
- adjudicaciones;
- CRM;
- auditoria;
- notificaciones.

### Capa 3 - Datos

- PostgreSQL para datos transaccionales;
- S3 compatible para archivos adjuntos;
- Redis opcional mas adelante para colas, cache y sesiones.

## 6. Estrategia De Producto Multiplataforma

No conviene replicar todo en ambos canales desde el dia 1.

### Funciones Prioritarias En Web

- onboarding completo;
- alta y edicion de empresa;
- carga extensa de pedidos;
- comparador de cotizaciones;
- administracion;
- carga documental;
- reportes iniciales.

### Funciones Prioritarias En App

- login;
- dashboard resumido;
- notificaciones;
- respuesta rapida a pedidos;
- seguimiento de oportunidades;
- consulta de estado;
- acciones cortas y frecuentes.

## 7. Backend Compartido

El backend debe exponer APIs consumidas tanto por web como por app.

Recomendacion:

- REST en MVP por simplicidad;
- versionado de API desde el inicio;
- validacion server-side de permisos y estados;
- eventos de auditoria en operaciones clave.

Endpoints base esperables:

- `/auth`
- `/users`
- `/companies`
- `/requests`
- `/quotes`
- `/awards`
- `/crm`
- `/admin`

## 8. Modelo De Autenticacion

Recomendacion inicial:

- email + password;
- refresh token;
- roles por usuario;
- membresia a una o mas empresas;
- permisos por rol y por recurso.

Roles MVP:

- comprador;
- proveedor;
- vendedor;
- admin.

## 9. Modelo De Datos Base

Entidades principales:

- `User`
- `Company`
- `Membership`
- `Request`
- `RequestAttachment`
- `SupplierProfile`
- `Product`
- `Quote`
- `QuoteAttachment`
- `Award`
- `CrmOpportunity`
- `CrmActivity`
- `AuditEvent`

## 10. Flujos Tecnicos Criticos

### Pedido

1. comprador crea pedido en web o app;
2. backend valida rol y empresa;
3. guarda pedido;
4. genera auditoria;
5. notifica a proveedores seleccionados.

### Cotizacion

1. proveedor abre pedido;
2. backend valida acceso;
3. proveedor envia propuesta;
4. backend registra cotizacion;
5. comprador ve comparador actualizado.

### Adjudicacion

1. comprador selecciona propuesta;
2. backend valida permisos y estado;
3. registra adjudicacion;
4. cierra pedido o lo marca adjudicado;
5. notifica a participantes.

## 11. Monorepo Recomendado

Para mantener orden, conviene un monorepo.

Estructura sugerida:

```text
ATAR/
  apps/
    web/
    mobile/
    api/
  packages/
    ui/
    types/
    config/
    utils/
  docs/
```

Ventajas:

- comparte tipos;
- comparte reglas comunes;
- simplifica mantenimiento;
- acelera consistencia entre web y app.

## 12. Librerias Sugeridas

### Web

- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form
- TanStack Query

### Mobile

- Expo
- React Native
- TypeScript
- Expo Router
- TanStack Query

### API

- NestJS
- Prisma
- PostgreSQL
- Zod o class-validator

## 13. Infraestructura Inicial

Para MVP:

- frontend web en Vercel;
- backend en Railway, Render o similar;
- base de datos PostgreSQL gestionada;
- storage S3 compatible;
- monitoreo basico y logs.

## 14. Seguridad Basica Desde El Inicio

- hash seguro de passwords;
- tokens con expiracion;
- control de acceso por rol;
- validacion de archivos adjuntos;
- auditoria de operaciones criticas;
- terminos y privacidad visibles.

## 15. Trazabilidad Necesaria

Eventos que conviene guardar desde el MVP:

- registro de usuario;
- aprobacion de empresa;
- publicacion de pedido;
- envio de cotizacion;
- cambio de estado;
- adjudicacion;
- actividad del vendedor;
- intervencion administrativa.

## 16. Plan Tecnico Recomendado

### Fase A

- definir monorepo;
- crear apps `web`, `mobile` y `api`;
- configurar auth, base de datos y roles.

### Fase B

- construir flujo de pedidos;
- construir flujo de cotizaciones;
- construir comparador y adjudicacion.

### Fase C

- agregar CRM del vendedor;
- agregar panel admin;
- agregar notificaciones y metricas.

## 17. Decisiones Que Conviene Tomar Ya

- si la app mobile sale en `iOS` y `Android` desde el MVP;
- si la web incluye tambien landing comercial;
- si el vendedor entra en MVP o en fase 2;
- si la administracion sera solo web;
- si el backend sera monolito modular o servicios a futuro.

## 18. Recomendacion Final

La mejor estrategia para ATAR hoy es:

- construir primero un backend robusto y compartido;
- lanzar web como canal mas completo;
- lanzar app mobile enfocada en velocidad operativa;
- mantener un solo dominio de negocio para todas las experiencias.

Eso permite validar mercado sin perder la posibilidad de escalar a una plataforma profesional real.
