# Cotizaciones, Chat y Cantidad

## Objetivo

Este bloque simplifica el flujo de solicitud para compradores y agrega un canal de mensajeria persistente entre comprador y proveedor sin romper el dominio actual basado en `requests` y `quotes`.

## Cambios funcionales

### 1. Central de cotizaciones del comprador

- Nueva ruta: `apps/web/src/app/dashboard/comprador/cotizaciones/page.tsx`
- Acceso directo desde la sidebar del comprador.
- Lista agregada de cotizaciones con:
  - estado (`SUBMITTED`, `AWARDED`, `REJECTED`)
  - monto total
  - vencimiento
  - nombre del proveedor
  - acceso al detalle

### 2. Solicitud rapida desde producto

- Nueva ruta: `apps/web/src/app/productos/[slug]/page.tsx`
- Nuevo catalogo base: `apps/web/src/lib/product-catalog.ts`
- El comprador puede:
  - ingresar cantidad
  - validar minimo `1`
  - bloquear cantidades superiores al stock informado
  - ver costo estimado en tiempo real
  - publicar la solicitud sin volver a cargar el contexto del producto

### 3. Chat contextual persistente

- Nuevo modulo backend: `apps/api/src/conversations`
- Contextos soportados:
  - `PRODUCT`
  - `QUOTE`
  - `REQUEST` reservado para evolucion posterior
- Soporta:
  - listado de conversaciones
  - detalle con busqueda por texto
  - filtros por fecha
  - mensajes persistentes
  - adjuntos base64 hasta `10 MB`
  - marcado de lectura
  - polling en cliente cada `2s`

## Cambios tecnicos

### Backend

- `schema.prisma`
  - se agregan campos de negocio en `Request`
  - se agregan `Conversation` y `ConversationMessage`
  - se agrega `ConversationContextType`
- Endpoints nuevos:
  - `GET /conversations`
  - `GET /conversations/:id`
  - `POST /conversations/product`
  - `POST /conversations/quote/:quoteId`
  - `POST /conversations/:id/messages`
  - `POST /conversations/:id/read`

### Web

- Componentes nuevos:
  - `apps/web/src/components/chat/conversation-panel.tsx`
  - `apps/web/src/components/chat/conversations-inbox.tsx`
- Nuevas rutas:
  - `dashboard/comprador/cotizaciones/[id]`
  - `dashboard/proveedor/cotizaciones/[id]`
  - `dashboard/comprador/mensajes/[id]`
  - `dashboard/proveedor/mensajes/[id]`
  - `dashboard/proveedor/mensajes`

## Validacion realizada

- `npm run prisma:generate --workspace @atar/api`
- `npm run build --workspace @atar/api`
- `npm run lint:web`
- `npm run build:web`

## Limitaciones actuales

- La entrega "tiempo real" se implementa hoy con polling cada `2s`, no con WebSocket.
- El campo `emailNotificationQueuedAt` deja trazabilidad de cola, pero no hay proveedor SMTP integrado todavia.
- Las pruebas de usabilidad con 10 compradores no pueden automatizarse desde este entorno; queda preparado el flujo para testeo manual con usuarios reales.
- El catalogo de productos sigue siendo una capa controlada de demo sobre el dominio real de `requests/quotes`.

## Siguiente evolucion recomendada

1. Reemplazar polling por WebSocket o SSE.
2. Integrar proveedor real de correo para notificaciones.
3. Agregar storage externo para adjuntos en lugar de base64 en base de datos.
4. Unificar `producto` real en backend para eliminar el catalogo demo.
