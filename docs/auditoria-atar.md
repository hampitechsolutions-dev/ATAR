# Auditoría integral de ATAR — Producto, UX/UI, lógica, datos y flujos

> Marketplace B2B industrial (Argentina). Monorepo: `apps/web` (Next.js), `apps/api` (NestJS + Prisma), `apps/mobile` (Expo).
> Método: auditoría sobre el **código del repositorio** (fuente de verdad del deploy), realizada por 4 auditores especializados (modelo/estados, comprador, proveedor/vendedor/permisos, transversal). Las citas son `archivo:línea`.
> Estado: **auditoría + propuesta**. No se implementaron cambios como parte de este informe (salvo que se indique en la sección J).

---

## A. Estado actual — qué funciona (no tocar)

ATAR está **sorprendentemente maduro** en varias áreas. Lo que ya está bien y NO debe romperse:

- **Separación de entidades correcta**: `Request` (RFQ del comprador) vs `RequestAssignment` (pipeline por empresa proveedora). Una misma RFQ puede estar `WON` para uno y `LOST` para otro (`schema.prisma:88-100,346`).
- **Adjudicación atómica y consistente** (`requests.service.ts:333` `award()` en `$transaction`): adjudica la ganadora, rechaza al resto, setea `awardedQuoteId`, sincroniza pipeline y notifica ganador/perdedores.
- **Máquina de cumplimiento validada** ISSUED→CONFIRMED→IN_PRODUCTION→DISPATCHED→DELIVERED, con transiciones estrictas y solo ejecutables por el proveedor adjudicado (`requests.service.ts:696-789,964`), más handshake final del comprador `CONFIRM_RECEIPT`.
- **Comparación de cotizaciones lado a lado real** (B2B, no una lista): columna por proveedor, fila por producto, precio unitario + subtotal, disponibilidad `UNAVAILABLE`/`ALTERNATIVE` con nota, cobertura "X/Y", badges Mejor precio/Más rápida/Asignada, total/plazo/condiciones (`comprador/solicitudes/[id]/page.tsx:77-248`).
- **RFQ multi-producto** con specs/cantidad/unidad por línea, campos dirigidos por catálogo, borrador autoguardado, unidades sugeridas por categoría, progressive disclosure (`comprador/solicitudes/nueva/page.tsx`).
- **Seguridad de base sólida**: membresías releídas de DB en cada request (no del JWT) → un vendedor expulsado pierde acceso al instante (`jwt.strategy.ts:22-60`); `ValidationPipe` global con whitelist (`main.ts:41-47`); guards de edición/borrado que bloquean RFQ con cotizaciones.
- **Notificaciones multicanal accionables**: in-app + web push (VAPID) + Expo push + email (Resend), con `href` al contexto y `metadata`; **coalescing de chat** para evitar spam (`notifications.service.ts:236-385`).
- **Honestidad anti-mock** donde importa: reseñas/métricas/ficha NO inventan datos ("No se inventan reseñas ni puntuaciones", `proveedor/resenas/page.tsx:151`; "No informado" en ficha).
- **Representación vendedor↔empresa** bien modelada (upsert de vínculo único vivo, `representation.service.ts:529-577`).
- **PDF de especificaciones** honesto (usa `items` reales) y **locale es-AR** presente en formateo.

---

## B. Problemas encontrados — listado priorizado

Leyenda categoría: SEG=seguridad · DAT=datos · LOG=lógica · UX · BE=backend · ARQ=arquitectura · PROD=producto.

### 🔴 P0 — Crítico (bloquea/rompe confianza o expone datos)

| ID | Problema | Archivo | Cat |
|----|----------|---------|-----|
| **P0-1** | **IDOR**: `GET /requests/:id/assignment` no valida visibilidad ni `privateRequest` antes de devolver la solicitud completa **y crear** un `RequestAssignment`. Enumerando IDs, un proveedor lee RFQ privadas ajenas (título, descripción, comprador) y se las inyecta en su bandeja. | `assignments.service.ts:169-212` | SEG/BE |
| **P0-2** | **Estado de pedidos inventado**: la lista de Pedidos mapea `request.status`→logística ficticia ("Entregado/En tránsito/60%") y nº de pedido/entrega falsos, **contradiciendo** el `order.fulfillmentStatus` real que sí usa el detalle. | `comprador/pedidos/page.tsx:41-83,295-297` | DAT/LOG |
| **P0-3** | **Adjuntos fantasma**: el wizard "sube" planos/PDF pero solo guarda **nombres**; `CreateRequestPayload` no tiene campo de archivo. El comprador cree que envió documentación y nunca llega al proveedor (solo el chat soporta adjuntos reales). | `comprador/solicitudes/nueva/page.tsx:844-854`; `[id]:1581-1612`; `cotizaciones/[id]:541-564`; `atar-api.ts:424-448` | DAT/UX |

### 🟠 P1 — Alto (afecta seriamente la experiencia/operación)

| ID | Problema | Archivo | Cat |
|----|----------|---------|-----|
| **P1-1** | **RFQ privada matcheada por nombre (string)**, no por ID: dos empresas homónimas pueden ver/cotizar RFQ privadas ajenas; frágil ante renombres. El DTO ya recibe `targetSupplierCompanyIds` pero no persiste el vínculo. | `requests.service.ts:1024`; `quotes.service.ts:339`; `assignments.service.ts:60` | SEG/DAT |
| **P1-2** | **`quotes/mine` sin scoping por vendedor**: un SELLER ve cotizaciones/montos/clientes de **toda la empresa** en home/catálogo/producción/reportes (contradice el scoping de inbox/métricas/clientes). | `quotes.service.ts:233-255`; `dashboard-hooks.ts:157-160` | SEG/LOG |
| **P1-3** | **Enums duplicados y divergentes**: `domain.enums.ts` redefine `RequestStatus`/`QuoteStatus` con **menos** valores que Prisma → validaciones desalineadas, bug silencioso. | `common/enums/domain.enums.ts:14,22` | ARQ |
| **P1-4** | **`CANCELLED` inalcanzable**: no hay acción/endpoint de cancelar RFQ; `remove()` bloquea y dice "cancelala", pero cancelar no existe → RFQ con cotizaciones quedan vivas para siempre. | `requests.service.ts:205,222` | BE/DAT |
| **P1-5** | **Dashboard del comprador no responde "¿qué hago ahora?"**: dos dashboards (marketing + KPIs) y ninguno muestra acciones pendientes (cotizaciones a decidir, entregas a confirmar, vencimientos, mensajes sin leer). | `comprador/page.tsx`; `panel/page.tsx:122-150` | UX/LOG |
| **P1-6** | **Entrega y specs aplanadas a `description` + regex**: dirección/fecha/contacto se concatenan como texto y se re-parsean; `dueDate` se pierde en "asap"/"rango". | `nueva:1009-1043`; `[id]:394-410` | LOG/DAT |
| **P1-7** | **Negociación sin versionado**: solo chat + último monto; no hay "qué se pidió → qué cambió → versión vigente". | `cotizaciones/[id]:314-334`; `[id]:665-706` | LOG/UX |
| **P1-8** | **"Verificado" siempre `true`** (hardcodeado) en pedidos, detalle de cotización y resumen del wizard → sello de confianza falso. | `pedidos:334`; `cotizaciones/[id]:414-417`; `nueva:2125` | DAT/UI |
| **P1-9** | **Badge de notificaciones del comprador fijo en "1"** (nunca cableado; el lado proveedor sí usa el contador real). | `buyer-marketplace-header.tsx:56`; `buyer-bottom-nav.tsx:111` | DAT/UX |
| **P1-10** | **Identidad fallback ficticia** "Martin Rodriguez"/"Textiles del Sur S.A." si la sesión tarda/falla. | `buyer-marketplace-header.tsx:130,134,144` | DAT/UX |
| **P1-11** | **`formatCurrency` fuerza ARS en listados** ignorando `quote.currency` (rompe montos en USD en país bimonetario); ~10 copias duplicadas del helper. | `comprador/cotizaciones/page.tsx:8`; `pedidos:9`; `proveedor/cotizaciones:14`, etc. | DAT |
| **P1-12** | **Sin datos fiscales AR**: `Company.taxId` existe pero no se captura ni muestra; no hay CUIT, condición IVA, razón social. Imprescindible para facturar/dar de alta proveedor. IVA ni se calcula ni discrimina. | `schema.prisma:186`; `cotizaciones/[id]:424` | PROD/DAT |
| **P1-13** | **No existe matching RFQ↔proveedor**: el proveedor tiene `categories/certifications/capabilities/supplierRole/leadTime/minimumOrder` pero la búsqueda no los usa ni hay sugerencia por categoría al publicar. El valor central del marketplace (descubrimiento) no está. | `users.service.ts:53-154`; `comprador/proveedores:63-77` | PROD |
| **P1-14** | **Mercado abierto no notifica**: solo las RFQ dirigidas disparan `REQUEST_RECEIVED`; un proveedor cuyo rubro matchea una RFQ pública no se entera. | `requests.service.ts:108` | PROD |

### 🟡 P2 — Medio (mejora importante, no bloqueante)

| ID | Problema | Archivo | Cat |
|----|----------|---------|-----|
| **P2-1** | **Cotizar sin control de asignación**: un SELLER puede crear/**sobrescribir** la cotización de una oportunidad de otro vendedor (`existingQuote` por empresa, no por vendedor). | `quotes.service.ts:30-60` | BE/LOG |
| **P2-2** | **No existe modelo de Producto del proveedor**: el "catálogo" es analítico con **botones muertos** ("Nuevo item"/"Ver detalle"/lápiz sin `onClick`); la oferta es solo `SupplierProfile.mainProducts String[]`. No hay estándar/configurable/a medida/servicio, specs, unidad, precio, estado, SKU. | `catalogo/page.tsx:152-160,200-204,323-381`; `schema.prisma:268` | PROD/LOG |
| **P2-3** | **Cumplimiento monolítico**: `PurchaseOrder.fulfillmentStatus` único para RFQ multi-producto → sin entrega parcial ni por línea, sin estados de excepción (CANCELLED/FAILED/RETURNED). | `schema.prisma:454-462` | DAT/ARQ |
| **P2-4** | **Campos legacy duplicados**: `Request.{productName,category,quantityRequested,referenceUnitPrice,estimatedTotalCost}` y `Quote.amount` conviven con `RequestItem`/`QuoteItem` → doble fuente de verdad. | `schema.prisma:319-324,373` | DAT |
| **P2-5** | **Estados muertos**: `OpportunityStatus.IN_RESPONSE`/`NEGOTIATING` nunca se escriben (métrica negotiating siempre 0); `Quote.WITHDRAWN`/`DRAFT` inalcanzables (sin retiro de cotización). | `assignments.service.ts:319`; `quotes.service.ts:123,187` | BE/LOG |
| **P2-6** | **Visibilidad por substring de nombre** en inbox (`contains: company.name`) mientras el permiso usa igualdad exacta → una privada se **lista** a empresas con nombre substring. | `assignments.service.ts:60` | SEG/BE |
| **P2-7** | **`supplierProfile` GET exige `assertManager`** pero el front lo pide para todo proveedor → el SELLER recibe 403 (se traga), pierde pre-carga de ficha en cotización y configuración. | `companies.service.ts:96`; `proveedor/solicitudes/[id]:141` | BE/UX |
| **P2-8** | **Conversación con FKs débiles** (`buyerCompanyId`/`supplierCompanyId` sin relación) y `contextType PRODUCT` huérfano (no hay modelo Product). | `schema.prisma:467-489` | DAT |
| **P2-9** | **Adjuntos en base64 dentro de Postgres** (`attachmentBase64`) → filas enormes, presión en DB/backups. | `schema.prisma:489-499` | ARQ |
| **P2-10** | **Spam en `QUOTE_UPDATED`/`ORDER_UPDATED`**: cada edición dispara push+email sin coalescing (a diferencia de chat). | `quotes.service.ts:149`; `requests.service.ts:682` | UX |
| **P2-11** | **Notificaciones no se marcan leídas al clic** (solo "marcar todo"); el endpoint existe. | `comprador/notificaciones/page.tsx:182-186` | UX |
| **P2-12** | **Condiciones de pago sin estructura** (`paymentTerms` texto libre): imposible comparar/automatizar; validez de oferta y mínimo guardados como texto dentro de `technicalComment`. | `schema.prisma:377`; `proveedor/solicitudes/[id]:213-219` | LOG |
| **P2-13** | **Búsqueda 100% client-side y pobre**: trae todo el directorio y filtra en JS; no filtra por certificación/rol/lead time/mínimo; no escala. | `comprador/proveedores:63-77` | LOG/PROD |
| **P2-14** | **Estadísticas de marketing inventadas** en landing ("450+ empresas", "12.000+ productos", "38.000+ cotizaciones", conteos por categoría). Riesgo reputacional/publicidad. | `app/page.tsx:120-152` | DAT |
| **P2-15** | **Cantidades/moneda falsas en listas**: `unidades = cotizaciones×100`; USD a tasa fija 1040; iniciales de proveedor falsas `['PB','BL','AR']`. | `solicitudes:368,396`; `pedidos:26` | DAT |
| **P2-16** | **Toda RFQ es privada** (paso 4 obligatorio, `privateRequest=true` forzado): no hay forma de publicar "abierta a todos" desde el wizard. | `nueva:960-963,1047` | UX/LOG |
| **P2-17** | **Botones inertes**: "Guardar borrador" solo muestra toast; "Filtros"/"Exportar" en Pedidos y "Filtros" en Solicitudes no hacen nada. | `[id]:1731`; `pedidos:199-215`; `solicitudes:167` | UX |
| **P2-18** | **Editar solicitud pierde specs estructuradas** (reconstruye con `specSelections:{}`, solo texto plano); match de proveedores por nombre. | `nueva:284-299,595-606` | LOG |
| **P2-19** | **Sin modelo de reseñas/rating**: la UI habla de "Calificaciones" pero no hay entidad; no se puede calificar tras completar. | `proveedor/resenas/page.tsx` | PROD |
| **P2-20** | **"Verificado" sin respaldo** (qué se verificó: CUIT/AFIP/domicilio); seed pone `isVerified:true` en demos. | `schema.prisma:261`; `seed.js:781,809` | PROD |

### 🟢 P3 — Bajo (polish / futuro)

| ID | Problema | Archivo | Cat |
|----|----------|---------|-----|
| P3-1 | Sin expiración por `dueDate` ni auto-complete tras DELIVERED (operaciones colgadas si nadie actúa). | `schema.prisma:328`; `requests.service.ts:471` | BE |
| P3-2 | `Company.taxId` nullable/no único; `Membership.isPrimary` sin garantía de único por usuario. | `schema.prisma:186,208` | DAT |
| P3-3 | `ISSUE_ORDER` no acepta `promisedDate`/`notes` (requiere 2 pasos con `upsertOrder`). | `requests.service.ts:484,604` | BE |
| P3-4 | Endpoints públicos (`catalog`, `public/companies/suppliers`) sin rate-limit/paginación; directorio enumerable. | `catalog.controller.ts`; `users.service.ts:53` | SEG |
| P3-5 | `isManager ?? true` en el provider: parpadean botones de manager para vendedores (backend lo bloquea). | `workspace-provider.tsx:113` | UX/SEG |
| P3-6 | `NotificationType.REQUEST_UPDATED` definido pero nunca emitido (tipo muerto). | `schema.prisma`; `atar-api.ts:501` | DAT |
| P3-7 | Seed: nombres de empresa hardcodeados como strings en el timeline demo (frágil). | `seed.js:639-693` | DAT |
| P3-8 | `minimumOrder` se muestra sin símbolo de moneda (ambiguo $ vs unidades). | `supplier-detail.tsx:544-546` | UI |
| P3-9 | Sin track record público del proveedor (% a tiempo, operaciones, antigüedad) pese a existir los datos. | `PurchaseOrder`/`RequestEvent` | PROD |
| P3-10 | Capa "Cotizaciones" redundante; stat "Mejor oferta" vacío hasta adjudicar (usa `awardedQuote?.amount`). | `cotizaciones/page.tsx:126-129` | UX |
| P3-11 | `Number.parseInt` trunca cantidades decimales (p. ej. 2.5 toneladas). | `nueva:991` | LOG |
| P3-12 | Creación perezosa de `RequestAssignment`: proveedor que nunca abrió la bandeja no registra LOST → métricas subestimadas. | `assignments.service.ts:78` | DAT |

---

## C. Flujos actuales (conceptual)

### Comprador (hoy)
```
Home (marketing)  ─┐
Panel (KPIs)      ─┴→ Nueva solicitud (wizard 5 pasos) → [privada, ≥1 proveedor]
   → Lista de solicitudes → Detalle
        → Comparación lado a lado ✔ → Adjudicar
        → Iniciar negociación (solo chat) → Emitir orden → Seguimiento fulfillment ✔ → Confirmar recepción → COMPLETED
   → Cotizaciones (capa redundante → reenvía al detalle) → Detalle de cotización + chat
   → Pedidos (estado logístico INVENTADO, no usa fulfillment real ✗)
```
Huecos: adjuntos no viajan; entrega/fecha en texto plano; sin "qué hacer ahora"; sin cancelar; negociación sin versión.

### Proveedor (hoy)
```
Dashboard (counters reales ✔) → Bandeja/Inbox (oportunidades con pipeline)
   → [FALTA aceptar/rechazar/declinar] → Cotizar por línea ✔ (disponibilidad/nota ✔, validez/mínimo como texto libre ✗)
   → Pedido → Confirmar → Producción → Despacho → Entrega ✔ (un solo estado, sin parcial ✗)
Catálogo: pantalla analítica con botones muertos ✗ (no hay modelo Product)
```

### Vendedor (hoy)
```
Scoping correcto en inbox/métricas/clientes ✔
  PERO home/catálogo/producción/reportes/cotizaciones ven TODA la empresa ✗ (quotes/mine sin filtro)
  y puede sobrescribir cotizaciones de otros vendedores ✗
```

---

## D. Flujos propuestos (paso a paso)

### D.1 Comprador — RFQ → entrega (objetivo)
1. **Publicar RFQ**: elegir "Dirigida (elijo proveedores)" **o** "Abierta (el sistema sugiere/notifica por rubro)". Persistir destinatarios como `RequestTargetSupplier(requestId, companyId)` (no string).
2. **Entrega estructurada**: dirección/ventana de entrega como campos del modelo (no `description`); `dueDate` derivado también de "asap"/rango.
3. **Adjuntos reales** (o quitar la promesa): subir a storage, referenciar por URL en `RequestItem`/`Request`.
4. **Comparar** ✔ (ya existe) → **adjudicar total o parcial por línea**.
5. **Negociar con versionado**: ronda de contraoferta que crea una nueva versión de la cotización con diff (monto/plazo/condiciones/fecha); el chat queda como canal, no como fuente de verdad.
6. **Orden** emitida en un paso con `promisedDate`/notas.
7. **Seguimiento** con `fulfillmentStatus` real (ya existe) + **entrega parcial por línea**.
8. **Cierre** por `CONFIRM_RECEIPT` + recordatorio/auto-cierre configurable.
9. **Cancelar** en cualquier estado abierto → `CANCELLED` (rechaza cotizaciones, marca assignments LOST, notifica).

### D.2 Comprador — Dashboard "qué hacer ahora"
Bloque **"Requieren tu atención"** al tope, ordenado por urgencia:
- Cotizaciones nuevas sin adjudicar (N).
- Órdenes `DELIVERED` sin confirmar recepción.
- RFQ con `dueDate` próxima / sin cotizaciones.
- Mensajes sin leer (del contador real).
- Cambios del proveedor pendientes de revisar (precio/fecha).
Debajo: operaciones activas, luego métricas. Unificar los dos dashboards en uno.

### D.3 Proveedor — responder RFQ
`Recibida → (Aceptar participar | Declinar) → [Pedir aclaración] → Cotizar (precio/plazo/validez/mínimo estructurados, disponibilidad por línea ✔) → Enviar`. Nuevo estado `DECLINED` en `OpportunityStatus`; `markInResponse` al abrir.

### D.4 Catálogo del proveedor (mínimo viable)
Corto plazo: **desactivar los botones muertos** (o rutearlos a configuración). Mediano: modelar `SupplierProduct` (tipo: estándar/configurable/a-medida/servicio; unidad; specs; rango de precio/mínimo; estado activo).

---

## E. Máquina de estados — tabla completa y transiciones

### E.1 `Request` (`RequestStatus`)
| De → A | Quién | Disparador | Efecto | Estado |
|---|---|---|---|---|
| ∅ → DRAFT/PUBLISHED | BUYER | `create()` | items + evento; si dirigida, notifica proveedores | OK |
| PUBLISHED → REVIEWING | (SUPPLIER) | 1ª cotización | notifica comprador | OK |
| PUBLISHED/REVIEWING → AWARDED | BUYER | `award()` | gana/rechaza/asigna | OK |
| AWARDED → NEGOTIATING | BUYER | `progress(START_NEGOTIATION)` | notifica | OK (pero no sincroniza pipeline del proveedor) |
| AWARDED/NEGOTIATING → ORDER_ISSUED | BUYER | `progress(ISSUE_ORDER)` | crea PurchaseOrder | OK |
| ORDER_ISSUED → COMPLETED | BUYER | `CONFIRM_RECEIPT` (si fulfillment=DELIVERED) | cierra | OK |
| **cualquiera abierto → CANCELLED** | BUYER | — | **NO EXISTE** (P1-4) | ❌ faltante |
| **ORDER_ISSUED → NEGOTIATING** | — | renegociar post-orden | **NO EXISTE** | ❌ faltante |
| **AWARDED → REVIEWING** | — | des-adjudicar si proveedor cae | **NO EXISTE** | ❌ faltante |

### E.2 `Quote` (`QuoteStatus`)
| De → A | Quién | Disparador | Estado |
|---|---|---|---|
| ∅ → SUBMITTED | SUPPLIER | `create()` (siempre directo a SUBMITTED) | OK |
| SUBMITTED → AWARDED | BUYER | `award()` | OK |
| SUBMITTED/DRAFT → REJECTED | BUYER | `award()` (resto) | OK |
| **→ WITHDRAWN** | SUPPLIER | retirar oferta | ❌ inalcanzable (P2-5) |
| **DRAFT** (borrador) | SUPPLIER | guardar sin enviar | ❌ inalcanzable (P2-5) |

### E.3 `OrderFulfillmentStatus`
`ISSUED → CONFIRMED → IN_PRODUCTION → DISPATCHED → DELIVERED` (lineal, proveedor). **Faltan**: `PARTIALLY_DELIVERED`, `CANCELLED`/`FAILED`/`RETURNED`, y cumplimiento **por línea** (P2-3).

### E.4 `OpportunityStatus` (pipeline proveedor)
`NEW, UNASSIGNED, ASSIGNED, IN_RESPONSE, QUOTED, NEGOTIATING, WON, LOST`. **`IN_RESPONSE` y `NEGOTIATING` nunca se escriben** (código/estado muerto, métrica en 0) — P2-5.

> Además: el enum espejo manual `common/enums/domain.enums.ts` está **desalineado** de Prisma (P1-3). Debe eliminarse y usarse `@prisma/client`.

---

## F. Mejoras UX (Problema → Solución)

- **Dashboard sin foco** → bloque "Requieren tu atención" + unificar los dos dashboards (P1-5).
- **Badge "1" fijo / identidad "Martin Rodriguez"** → cablear `unreadCount` real y quitar fallbacks ficticios (P1-9, P1-10).
- **"Verificado" falso** → usar `isVerified` real; ocultar si no verificado (P1-8).
- **Negociación = chat** → panel de versiones con diff (P1-7).
- **Botones inertes** (borrador/filtros/exportar) → implementar o eliminar (P2-17).
- **Notificación no marca leída** → `markAsRead(id)` en el clic (P2-11).
- **Spam de updates** → coalescing/debounce en `QUOTE_UPDATED`/`ORDER_UPDATED` (P2-10).
- **Confirmaciones con `window.confirm`** → modales propios para decisiones de alto valor.
- **Mobile**: tablas de Pedidos/Solicitudes/comparación necesitan layout apilado en < md (hoy dependen de scroll horizontal); CTAs táctiles.

## G. Mejoras funcionales (Problema → Solución)

- **Matching RFQ↔proveedor** (P1-13) + **notificar mercado abierto por rubro** (P1-14): búsqueda server-side con filtros (categoría/ubicación/certificación/rol/lead time/mínimo) y sugerencia automática al publicar.
- **Cancelación de RFQ** (P1-4) y **retiro de cotización** (P2-5) como acciones de primera clase.
- **Entrega parcial / por línea** (P2-3): `PurchaseOrderItem` con estado propio.
- **Condiciones estructuradas** (P2-12): `Quote.validUntil`, `minimumOrder`, anticipo %, plazo en días, medio de pago.
- **Productos del proveedor** (P2-2): modelo `SupplierProduct` o desactivar CTAs hasta tenerlo.
- **Rating/reputación** (P2-19) habilitado al `REQUEST_COMPLETED`.

## H. Mejoras técnicas (Problema → Solución)

- **Fix IDOR** (P0-1): validar visibilidad antes de `getAssignmentOrCreate`; no auto-crear assignment para RFQ no visible.
- **Scoping de `quotes/mine`** por vendedor (P1-2); **control de asignación al cotizar** (P2-1); **match exacto** en inbox (P2-6); **lectura de ficha para vendedores** (P2-7).
- **Eliminar `domain.enums.ts`** y usar `@prisma/client` (P1-3).
- **Persistir destinatarios por ID** (`RequestTargetSupplier`) (P1-1).
- **Helper único `formatCurrency(value, currency)`** en `lib/` (P1-11).
- **Entrega estructurada** en el modelo/payload (P1-6); **adjuntos a storage** (P0-3, P2-9).
- **Desduplicar campos legacy** definiendo líneas como fuente de verdad (P2-4).
- **FKs reales en Conversation** (P2-8); **jobs** de vencimiento/recordatorio/auto-cierre (P3-1).

## I. Casos excepcionales — comportamiento esperado

| Caso | Hoy | Propuesto |
|---|---|---|
| Proveedor no responde | RFQ queda abierta indefinida | Recordatorio + cierre/expiración por `dueDate` |
| Nadie cotiza | Sin aviso | Aviso al comprador al vencer; sugerir ampliar proveedores |
| Cotización vence | No existe validez | `Quote.validUntil` + estado/ aviso `QUOTE_EXPIRED` |
| Comprador cambia cantidad/spec/fecha post-cotización | Edición bloqueada, sin aviso | Permitir revisión con re-notificación/renegociación versionada |
| Proveedor no puede cumplir | No hay salida | Retiro de cotización (`WITHDRAWN`) / declinar oportunidad (`DECLINED`) |
| Entrega parcial | No soportada | `PARTIALLY_DELIVERED` + por línea |
| Retraso | Sin alerta | Job compara `promisedDate` → alerta accionable |
| Cancelar pedido | No existe | `CANCELLED` con efectos (rechazos/assignments/notif) |
| Selección parcial de una cotización | No soportada | Adjudicar por línea |
| Falta documentación | Sin control | Requerir/pedir adjunto estructurado |
| Comprador no confirma recepción | Orden colgada | Recordatorio + auto-cierre configurable |

## J. Implementación (qué se modificó)

### Tanda 0 — Seguridad + quick wins ✅ (hecha)
- **P0-1 IDOR cerrado**: `getAssignmentOrCreate` ahora valida visibilidad (pública, o privada con match **exacto** de nombre, o asignación preexistente) antes de devolver/crear; un proveedor ya no puede leer ni materializar RFQ privadas ajenas (`assignments.service.ts`). De paso endurece el match substring (P2-6).
- **P0-2 Pedidos con estado real**: la lista deriva el estado de `order.fulfillmentStatus` (no de `request.status`), con barra de progreso por % real, nº de orden honesto ("Sin orden emitida" si no hay), fecha prometida real y sin el "USD a 1040" inventado (`comprador/pedidos/page.tsx`).
- **P0-3 Adjuntos honestos**: se quitaron las tarjetas de "archivos adjuntos" fabricadas (detalle de solicitud → "Hoja de especificaciones" real; detalle de cotización → removida); el wizard ya no filtra nombres de archivo como specs al proveedor y aclara que los documentos se comparten por el chat.
- **P1-8 "Verificado" real**: se eliminó el sello hardcodeado siempre-true en pedidos, detalle de cotización y resumen del wizard (la ficha pública sigue usando el `isVerified` real).
- **P1-9 badge de notificaciones**: contador real de no leídas (`useBuyerNotificationCount`) cableado al header y bottom-nav del comprador; se quitó el "1" fijo.
- **P1-10 identidad fallback**: se quitaron "Martin Rodriguez"/"Textiles del Sur S.A."/"MR"; ahora usa datos reales de sesión o genéricos neutros.
- **P1-11 formatCurrency**: helper único `lib/format.ts` que respeta `currency`; aplicado en Pedidos.
- **P1-3 enums duplicados**: eliminado `common/enums/domain.enums.ts`; `catalog.controller` usa los enums de `@prisma/client`.

*Typecheck API y web en 0. No se tocó el modelo de datos (salvo lectura). Sin romper funcionalidades existentes.*

### Pendiente de las demás tandas
Ver K.

## K. Pendientes / plan de implementación sugerido

Orden recomendado (de mayor valor/menor riesgo a mayor alcance):

1. ~~**Tanda 0 — Seguridad/confianza (P0 + quick wins P1)**~~ ✅ **HECHA** (ver J): IDOR, pedidos reales, adjuntos honestos, "Verificado" real, badge/identidad, `formatCurrency` único, borrado de `domain.enums.ts`. *Pendiente de esta tanda: adjuntos con storage real (se optó por quitar la promesa) y completar `formatCurrency` en las copias del lado proveedor.*
2. **Tanda 1 — Integridad de flujo (P1)**: cancelación de RFQ (P1-4), destinatarios por ID (P1-1), scoping `quotes/mine` (P1-2), dashboard "qué hacer ahora" (P1-5), entrega estructurada + `dueDate` (P1-6).
3. **Tanda 2 — Valor de marketplace (P1/P2)**: matching + notificación por rubro (P1-13/P1-14), negociación versionada (P1-7), datos fiscales AR mínimos/CUIT (P1-12).
4. **Tanda 3 — Robustez operativa (P2)**: control de asignación al cotizar (P2-1), entrega parcial (P2-3), condiciones estructuradas (P2-12), modelo de producto (P2-2), rating (P2-19), desduplicar legacy (P2-4).
5. **P3**: polish y jobs programados, cuando no generen ruido.

> Regla rectora en cada cambio: *complejidad interna, simplicidad externa*; reutilizar lo que ya conoce el sistema; no romper lo que ya funciona (sección A).
