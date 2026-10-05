# ATAR — Sistema de comisiones y liquidación (Billing)

> **Estado: DISEÑO (Fase 0).** Este documento es la propuesta técnica y de negocio.
> La implementación arranca una vez confirmadas las **decisiones de negocio** (§3).
> Principio rector: *Business Operations ≠ Commissions ≠ Billing ≠ Payments ≠ Tax* (§59 del pedido): responsabilidades separadas, trazable, auditable, idempotente y seguro.

---

## 1. Auditoría — qué existe hoy (fuente de verdad)

| Pregunta clave | Hallazgo en el código |
|---|---|
| ¿Qué entidad representa una **operación comercial cerrada**? | `Request` (RFQ) con `status = COMPLETED`. Se llega por el handshake: proveedor avanza la orden a `DELIVERED` → comprador ejecuta `CONFIRM_RECEIPT` (`requests.service.ts` `resolveProgressTransition`). |
| ¿Dónde está el **monto** y la **moneda** de la operación? | En la cotización adjudicada: `Request.awardedQuoteId → Quote.amount` (Float, Σ de `QuoteItem`) y `Quote.currency` (`"ARS"` por defecto, `"USD"` posible). |
| ¿Qué empresas intervienen? | `Request.buyerCompanyId` (comprador) y `Quote.supplierCompanyId` (proveedor adjudicado). Ambas son `Company`. |
| ¿Hay **pagos / MercadoPago / billing**? | **No.** Cero código de pagos, gateways, webhooks o comisiones. `paymentTerms` es solo texto de condiciones del proveedor; no es un medio de pago. |
| ¿Hay **cron / jobs**? | **No.** Sin `@nestjs/schedule` ni scheduler. La API es `nest start`. |
| ¿Datos fiscales de empresa? | Sí: `Company.legalName`, `Company.taxId` (CUIT), `Company.taxCondition`. |
| ¿Rol admin? | Existe `MembershipRole.ADMIN` e `isAdmin()` en services, pero **no hay panel admin** en la UI. |
| ¿Notificaciones? | Sistema multicanal robusto (in-app + web push + Expo + email Resend) con `href`/`metadata` y coalescing. **Reutilizable** para billing. |
| ¿Multimoneda? | El monto de cada operación tiene su moneda (ARS/USD). No hay conversión; **no se debe mezclar**. |
| ¿Modelo de monetización declarado? | **Success fee facturado** (no MP/escrow) — memoria del proyecto. |

**Conclusión:** el billing se conecta a `Request (COMPLETED)` + `awardedQuote` como **única fuente** del valor de la operación. No se duplica `order.total`; la comisión guarda referencia a `requestId`/`quoteId`.

---

## 2. El evento que genera comisión

> **La comisión se genera cuando una operación se cierra: `Request` pasa a `COMPLETED`.**

Razonamiento: es el único estado que representa una transacción comercial efectivamente concretada (doble confirmación comprador↔proveedor). Crear una solicitud o una cotización **no** genera comisión; adjudicar tampoco (todavía puede caerse en producción/entrega). Al pasar a `COMPLETED` se emite **0 o 1** comisión principal por operación.

Punto de enganche en el código: dentro de `progress(CONFIRM_RECEIPT)` (donde hoy se setea `COMPLETED` y se notifica), tras la transacción, se invoca el **motor de comisiones** (idempotente).

---

## 3. Decisiones de negocio (a confirmar — marcan la implementación)

Estas tres decisiones son del cliente y cambian la implementación; se dejan **configurables**, con el default recomendado:

| # | Decisión | Opciones | **Recomendado (default)** |
|---|---|---|---|
| D1 | **¿Quién paga la comisión?** | Proveedor adjudicado · Comprador · Ambos | **Proveedor adjudicado** (success fee sobre la venta ganada). Configurable por `BillingRule.payer`. |
| D2 | **% por defecto** | 1–5% / personalizado | **3 %** (vigencia desde hoy). Siempre configurable por regla; nunca hardcode. |
| D3 | **Medio de pago v1** | Manual (transferencia + comprobante) · MercadoPago · Ambos | **Manual v1** con validación admin, detrás de una abstracción `PaymentProvider`; **MercadoPago como fase futura** (requiere credenciales). |

Decisiones ya resueltas por la auditoría (documentadas, no requieren input):

- **Base de cálculo:** `awardedQuote.amount` (monto adjudicado de la operación, en su moneda). *No hay IVA discriminado en el modelo*, por lo que la base es el monto de la operación tal cual. Si en el futuro se modela IVA/envío/descuentos, la base se ajusta en **una sola función** (`computeCommissionBase`).
- **Moneda:** la de la operación (`awardedQuote.currency`). Las liquidaciones se agrupan **por empresa + período + moneda**. Sin conversión automática.
- **Período:** mensual, a **mes vencido** (ej. operaciones de septiembre → liquidación generada el 1/10, vence el 15/10 — ambas fechas configurables).

> La función `computeCommission(operation, rule)` es **centralizada**; la fórmula no se duplica.

---

## 4. Modelo de datos (Prisma)

Prefijo `Billing*` para aislar el dominio. Todo referencia a las entidades existentes por ID (sin duplicar montos de negocio salvo los **snapshots** necesarios para inmutabilidad histórica).

### 4.1 Enums

```
enum BillingPayer        { SUPPLIER  BUYER }
enum CommissionType      { SUCCESS_FEE }            // extensible
enum CommissionStatus    { PENDING CONFIRMED INVOICED PAID VOID ADJUSTED }
enum BillingPeriodStatus { OPEN PROCESSING GENERATED ISSUED PARTIALLY_PAID PAID OVERDUE CLOSED CANCELLED }
enum SettlementStatus    { DRAFT ISSUED PARTIALLY_PAID PAID OVERDUE VOID }
enum PaymentMethod       { MANUAL_TRANSFER MERCADOPAGO }
enum PaymentStatus       { PENDING CONFIRMED REJECTED REFUNDED }
enum AdjustmentType      { CREDIT DEBIT VOID REFUND CORRECTION }
```

### 4.2 `BillingRule` (regla configurable + versionada)

Define cómo se calcula la comisión. Versionada: cambiar el % crea una **nueva versión vigente**; las reglas viejas quedan para recalcular históricos.

```
id, version, label,
payer            BillingPayer   // D1
commissionType   CommissionType @default(SUCCESS_FEE)
ratePercent      Float?         // 3.0 = 3%
fixedAmount      Float?         // monto fijo opcional
minAmount        Float?  maxAmount Float?
currency         String?        // null = aplica a todas
scopeCompanyId   String?        // null = global; o por empresa
scopeCategory    String?        // futuro
effectiveFrom    DateTime  effectiveTo DateTime?
isActive         Boolean  createdByUserId  createdAt updatedAt
@@index([isActive, effectiveFrom])
```

### 4.3 `BillingCommission` (1 por operación comisionable)

Guarda **snapshots** de la regla al momento del cálculo (inmutable aunque la regla cambie — §8 versionado).

```
id
companyId          String   // empresa que PAGA (según payer)
requestId          String   @unique(commissionType) -> ver constraint
quoteId            String   // cotización adjudicada (traza)
ruleId             String   ruleVersion Int
commissionType     CommissionType
payer              BillingPayer
baseAmount         Float    // snapshot de la base
ratePercentSnapshot Float?  fixedAmountSnapshot Float?
commissionAmount   Float    // RESULTADO
currency           String
status             CommissionStatus @default(PENDING)
periodId           String?  // se setea al incluir en liquidación
settlementId       String?
generatedAt        DateTime  confirmedAt  voidedAt  paidAt
metadata           Json?
company Company  request Request  quote Quote  rule BillingRule
@@unique([requestId, commissionType])   // IDEMPOTENCIA: 1 operación → 0/1 comisión (§6)
@@index([companyId, status]) @@index([periodId]) @@index([settlementId])
```

### 4.4 `BillingPeriod` (período mensual por empresa+moneda) y `BillingSettlement` (liquidación)

Para no sobre-modelar, el **período** es global (`2026-09`, con ventanas de fecha) y la **liquidación** (`BillingSettlement`) agrupa las comisiones de **una empresa en una moneda** dentro de ese período. Es la unidad que la empresa ve y paga.

```
BillingPeriod:
  id, code "2026-09", startsAt, endsAt, status BillingPeriodStatus @default(OPEN),
  generatedAt, closedAt, dueAt, createdAt updatedAt
  @@unique([code])

BillingSettlement:   // "liquidación" de una empresa
  id, periodId, companyId, currency,
  payer BillingPayer,
  operationsCount Int,
  baseTotal Float, commissionTotal Float, adjustmentsTotal Float, grandTotal Float,
  status SettlementStatus @default(DRAFT),
  issuedAt, dueAt, paidAt, voidedAt,
  documentNumber String @unique,   // "ATAR-2026-09-000123"
  createdAt updatedAt
  commissions BillingCommission[]  adjustments BillingAdjustment[]  payments BillingPayment[]
  @@unique([periodId, companyId, currency])   // IDEMPOTENCIA liquidación (§34/§5 caso 5)
  @@index([companyId, status])
```

### 4.5 `BillingAdjustment` (ajustes, nunca borrar histórico — §18/§19/§20)

```
id, settlementId, commissionId?,  type AdjustmentType,
amount Float (signo según tipo), currency,
reason String, note String?,
previousAmount Float?, newAmount Float?,
createdByUserId, createdAt
```

### 4.6 `BillingPayment` (pago; manual o gateway — §24/§28)

```
id, settlementId, method PaymentMethod, status PaymentStatus @default(PENDING),
amount Float, currency,
externalReference String @unique,   // "ATAR-BILLING-2026-09-COMPANY-<id>-<uuid>" (§26)
providerPaymentId String?,          // id del gateway
receiptUrl String?,                 // comprobante (pago manual)
registeredByUserId String?,         // quién lo registró (manual)
confirmedByUserId String?,          // quién lo validó (manual requiere aprobación)
paidAt, confirmedAt, rejectedAt,
metadata Json?, createdAt updatedAt
@@index([settlementId, status])
```

### 4.7 `BillingWebhookEvent` (idempotencia de webhooks — §27)

```
id, provider String, eventId String, payload Json,
status "RECEIVED"|"PROCESSED"|"IGNORED"|"ERROR", processedAt, createdAt
@@unique([provider, eventId])   // un webhook repetido no duplica pagos
```

### 4.8 `BillingAuditLog` (auditoría — §33)

```
id, actorUserId, action, entity, entityId,
previousValue Json?, newValue Json?, reason String?, createdAt
@@index([entity, entityId]) @@index([createdAt])
```

### 4.9 `BillingSettings` (config sin tocar código — §52)

Fila única (o por clave) con: `isEnabled`, `generationDayOfMonth` (1), `dueDays` (15), `defaultRuleId`, `paymentProviderDefault`. Reglas de % viven en `BillingRule` (versionadas).

---

## 5. Máquinas de estado

**Comisión:** `PENDING → CONFIRMED → INVOICED → PAID`; ramas `VOID` (anulada antes de liquidar) y `ADJUSTED` (corregida vía ajuste). Nunca se edita el monto histórico.

**Liquidación (`BillingSettlement`):** `DRAFT → ISSUED → (PARTIALLY_PAID) → PAID`; `OVERDUE` al pasar `dueAt` sin pago total; `VOID` con ajuste explícito.

**Período (`BillingPeriod`):** `OPEN → PROCESSING → GENERATED → ISSUED → … → CLOSED` (y `CANCELLED`). Cerrar un período no modifica comisiones silenciosamente (§17).

**Pago:** `PENDING → CONFIRMED` (confirmación server-side: webhook del gateway o aprobación admin del manual) / `REJECTED` / `REFUNDED`. **Nunca** se marca pagado por retorno del frontend (§25/§32).

---

## 6. Cálculo (centralizado)

```
computeCommissionBase(operation): Float   // hoy: awardedQuote.amount
computeCommission(base, rule): { amount, snapshots }
   amount = clamp( base * rate% + fixed , min, max )
```
Una sola implementación; la comisión persiste el resultado + snapshots (rate/fixed/base/currency/ruleVersion).

---

## 7. Proceso mensual (idempotente — §34/§35)

Job (manual trigger + cron cuando se agregue `@nestjs/schedule`):
1. Detectar período a liquidar (mes vencido, `OPEN`→`PROCESSING`).
2. Tomar comisiones `CONFIRMED` sin `settlementId` de ese período.
3. Agrupar por `companyId + currency` → `BillingSettlement` (upsert por `@@unique([periodId,companyId,currency])` → **re-ejecutar no duplica**).
4. Totales, `documentNumber`, `dueAt`.
5. Período `GENERATED`; opcional `ISSUED` + notificaciones.
Todo con logs, manejo de error y seguro ante doble ejecución.

---

## 8. Pagos y abstracción

`PaymentProvider` (interfaz): `createCharge(settlement) → {externalReference, redirectUrl?}`, `verify(reference)`, `handleWebhook(payload)`.
- **v1: `ManualTransferProvider`** — la empresa marca "pagué" y sube comprobante; queda `PENDING` hasta aprobación admin.
- **Futuro: `MercadoPagoProvider`** — preference + `external_reference` + webhook validado + idempotente + conciliación. Confirmación **siempre server-side**.
Billing no se acopla a MP (§24).

---

## 9. Seguridad y permisos (§31/§32)

- Empresa: ve **solo lo suyo** (liquidaciones/comisiones/detalle), puede pagar y descargar. No modifica montos/estados/`company_id`.
- ATAR Admin: ve todo, configura reglas, cierra períodos, genera, ajusta, anula, registra/valida pagos, reportes.
- Montos, estados y `company_id` **solo** server-side; el cliente nunca los setea. Guards por rol + scope por empresa (patrón ya usado en el resto de la API).

---

## 10. Diagrama de flujo

```text
OPERACIÓN (Request → COMPLETED)
    ↓  ¿comisionable? (hay awardedQuote + regla vigente)
COMMISSION (PENDING → CONFIRMED)         1 operación → 0/1 comisión (unique)
    ↓  cierre de mes (job idempotente)
BILLING SETTLEMENT (por empresa+moneda)  DRAFT → ISSUED
    ↓
PAGO (manual/gateway) → confirmación server-side (webhook/aprobación)
    ↓
SETTLEMENT PAID   (período → … → CLOSED)

Alternativos:
OPERACIÓN → CANCELACIÓN → (antes de liquidar: VOID) / (después: AJUSTE/REVERSIÓN)
SETTLEMENT → vence dueAt → OVERDUE → PAGO
```

---

## 11. Plan de implementación por fases

| Fase | Contenido | Toca schema |
|---|---|---|
| **1** | Modelo de datos (enums + tablas Billing*) + migración (`db push`) + `BillingSettings`/`BillingRule` semilla. | Sí |
| **2** | Motor de cálculo (`computeCommission*`) + generación de `BillingCommission` al `COMPLETED` (idempotente) + tests de cálculo. | — |
| **3** | Liquidaciones: job mensual idempotente + generación manual (admin) + preview. | — |
| **4** | Dashboard ATAR (admin): resumen, por período, por empresa, reglas, cierre, ajustes, reportes/export. | — (UI) |
| **5** | Dashboard empresa: mis liquidaciones, detalle trazable, documento descargable. | — (UI) |
| **6** | Pagos: `PaymentProvider` + manual (registro + validación admin) + external_reference. | — |
| **7** | Webhooks (idempotentes/persistidos) — se activa con MercadoPago. | — |
| **8** | Notificaciones (generada / por vencer / vencida / pago recibido / rechazado). | enum notif |
| **9** | Reportes + export CSV + reconciliación. | — |
| **10** | QA: tests de cálculo, liquidación (regeneración/duplicación/cierre), pagos (webhook duplicado/orden), seguridad (cross-company, manipulación). | — |

---

## 12. Endpoints previstos (nuevos)

```
# Empresa (scope propio)
GET  /billing/me/settlements                 lista de mis liquidaciones
GET  /billing/me/settlements/:id             detalle (comisiones + ajustes)
GET  /billing/me/settlements/:id/document    documento descargable
POST /billing/me/settlements/:id/pay         inicia pago (provider) / registra manual

# Admin ATAR
GET  /billing/admin/overview                 KPIs (facturado/pendiente/vencido/cobrado)
GET  /billing/admin/periods                  períodos + estado
POST /billing/admin/periods/:code/generate   generar liquidaciones (idempotente)
POST /billing/admin/periods/:code/close      cerrar período
GET  /billing/admin/settlements              filtros (período/empresa/estado/moneda)
POST /billing/admin/settlements/:id/adjust   ajuste (motivo/monto)
POST /billing/admin/settlements/:id/void     anular (con ajuste)
POST /billing/admin/payments/:id/confirm     validar pago manual
GET  /billing/admin/rules  POST /billing/admin/rules   reglas (versionado)
GET  /billing/admin/export                   CSV
# Webhooks
POST /billing/webhooks/:provider             idempotente + validado
```

---

## 13. Variables de entorno

```
BILLING_ENABLED=true
BILLING_GENERATION_DAY=1
BILLING_DUE_DAYS=15
# MercadoPago (fase futura)
MP_ACCESS_TOKEN=...
MP_WEBHOOK_SECRET=...
BILLING_PUBLIC_BASE_URL=...        # para redirect/webhook
```
Solo secretos/config técnica en env; las reglas de negocio (%/vencimiento) viven en `BillingSettings`/`BillingRule`.

---

## 14. Pendientes / recomendaciones futuras

- Integración fiscal (AFIP / factura electrónica) — hoy **fuera de alcance**; la liquidación es independiente de la factura fiscal (§39).
- MercadoPago real (credenciales + webhook) — Fase 7.
- Intereses/multas por mora — modelo preparado, no implementado (§23).
- Cron real (`@nestjs/schedule`) — v1 con trigger manual admin + idempotencia.
- Conversión de moneda — no se hace; si el negocio la requiere, regla explícita de TC.

---

> **Siguiente paso:** confirmar D1/D2/D3 (§3) y arrancar Fase 1 (modelo de datos). El resto se implementa por fases con checkpoints.
