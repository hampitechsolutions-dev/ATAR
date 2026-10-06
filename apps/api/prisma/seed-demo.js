/*
 * Datos de prueba para VISUALIZAR la plataforma (admin + facturación + paneles).
 *
 * Crea: 1 admin de ATAR, 3 compradoras, 4 proveedoras, operaciones cerradas con
 * sus comisiones, liquidaciones del período 2026-09 en distintos estados de
 * pago (pagada / parcial / en validación / vencida) y 2 operaciones de 2026-10
 * sin liquidar (para probar "Generar/Emitir" en vivo).
 *
 * Idempotente: usa IDs fijos y upserts; correr de nuevo no duplica.
 *
 *   node prisma/seed-demo.js        (o: npm run prisma:seed-demo)
 */
const bcrypt = require('bcrypt');
const {
  PrismaClient,
  CompanyType,
  MembershipRole,
  UserStatus,
  RequestStatus,
  QuoteStatus,
  OrderFulfillmentStatus,
  BillingPayer,
  CommissionType,
  CommissionStatus,
  SettlementStatus,
  BillingPeriodStatus,
  BillingPaymentMethod,
  BillingPaymentStatus,
} = require('@prisma/client');

const prisma = new PrismaClient();

const PASSWORD = 'Atar.Demo2026';
const RATE = 1; // 1%
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const d = (iso) => new Date(iso);

// ---- Cuentas ----
const ADMIN = {
  key: 'admin',
  companyId: 'atar-plataforma',
  companyName: 'ATAR',
  companyType: CompanyType.HYBRID,
  role: MembershipRole.ADMIN,
  email: 'admin@atar.com',
  firstName: 'Admin',
  lastName: 'ATAR',
};

const BUYERS = [
  { key: 'andina', companyId: 'demo-buyer-andina', companyName: 'Constructora Andina', legalName: 'Constructora Andina S.A.', taxId: '30-70123456-7', city: 'Mendoza', email: 'compras@andina.com', firstName: 'Lucía', lastName: 'Fernández' },
  { key: 'litoral', companyId: 'demo-buyer-litoral', companyName: 'Agro del Litoral', legalName: 'Agro del Litoral S.R.L.', taxId: '30-71234567-8', city: 'Santa Fe', email: 'compras@litoral.com', firstName: 'Martín', lastName: 'Gómez' },
  { key: 'patagonia', companyId: 'demo-buyer-patagonia', companyName: 'Minera Patagonia', legalName: 'Minera Patagonia S.A.', taxId: '30-72345678-9', city: 'Neuquén', email: 'compras@patagonia.com', firstName: 'Sofía', lastName: 'Ruiz' },
];

const SUPPLIERS = [
  { key: 'metalurgica', companyId: 'demo-sup-metalurgica', companyName: 'Metalúrgica San Jorge', legalName: 'Metalúrgica San Jorge S.A.', taxId: '30-60111222-3', city: 'Rosario', email: 'ventas@sanjorge.com', firstName: 'Diego', lastName: 'Páez' },
  { key: 'plasticos', companyId: 'demo-sup-plasticos', companyName: 'Plásticos del Plata', legalName: 'Plásticos del Plata S.R.L.', taxId: '30-60222333-4', city: 'La Plata', email: 'ventas@plasticosdelplata.com', firstName: 'Carla', lastName: 'Méndez' },
  { key: 'bigbags', companyId: 'demo-sup-bigbags', companyName: 'Big Bags Córdoba', legalName: 'Big Bags Córdoba S.A.', taxId: '30-60333444-5', city: 'Córdoba', email: 'ventas@bigbagscba.com', firstName: 'Hernán', lastName: 'Luna' },
  { key: 'insumos', companyId: 'demo-sup-insumos', companyName: 'Insumos Industriales SRL', legalName: 'Insumos Industriales S.R.L.', taxId: '30-60444555-6', city: 'Buenos Aires', email: 'ventas@insumosind.com', firstName: 'Paula', lastName: 'Sosa' },
];

// ---- Operaciones (cerradas). month: periodo al que pertenece la comisión. ----
const OPS = [
  // Período 2026-09 (ya liquidado)
  { id: 'op1', buyer: 'andina', supplier: 'metalurgica', title: 'Estructura metálica para nave industrial', amount: 4800000, date: '2026-09-04', items: ['Vigas IPN 300', 'Columnas HEB 200'] },
  { id: 'op2', buyer: 'litoral', supplier: 'metalurgica', title: 'Chapas galvanizadas calibre 22', amount: 2600000, date: '2026-09-09', items: ['Chapa galvanizada C22'] },
  { id: 'op3', buyer: 'patagonia', supplier: 'metalurgica', title: 'Tanque de acero inoxidable 5000L', amount: 3100000, date: '2026-09-15', items: ['Tanque inox 5000L'] },
  { id: 'op4', buyer: 'andina', supplier: 'plasticos', title: 'Bidones HDPE 20L (x2000)', amount: 1900000, date: '2026-09-06', items: ['Bidón HDPE 20L'] },
  { id: 'op5', buyer: 'litoral', supplier: 'plasticos', title: 'Film stretch industrial', amount: 1200000, date: '2026-09-18', items: ['Film stretch 23µ'] },
  { id: 'op6', buyer: 'patagonia', supplier: 'bigbags', title: 'Big Bags 1000kg (x1500)', amount: 2250000, date: '2026-09-11', items: ['Big Bag FIBC 1000kg'] },
  { id: 'op7', buyer: 'andina', supplier: 'bigbags', title: 'Big Bags antiestáticos (x300)', amount: 980000, date: '2026-09-22', items: ['Big Bag antiestático tipo C'] },
  { id: 'op8', buyer: 'litoral', supplier: 'insumos', title: 'Lote de EPP (guantes y cascos)', amount: 640000, date: '2026-09-25', items: ['Guantes nitrilo', 'Cascos de seguridad'] },
  // Período 2026-10 (sin liquidar: para probar Generar/Emitir)
  { id: 'op9', buyer: 'patagonia', supplier: 'metalurgica', title: 'Perfiles estructurales (octubre)', amount: 1500000, date: '2026-10-02', items: ['Perfil C 100x50'] },
  { id: 'op10', buyer: 'andina', supplier: 'plasticos', title: 'Contenedores plásticos 1000L (octubre)', amount: 870000, date: '2026-10-03', items: ['Contenedor IBC 1000L'] },
];

// Comportamiento de pago por proveedor en 2026-09 (para mostrar estados).
const PAYMENT_PLAN = {
  metalurgica: { kind: 'full' }, // PAID
  plasticos: { kind: 'partial', amount: 15000 }, // PARTIALLY_PAID
  bigbags: { kind: 'pending' }, // ISSUED (pago en validación)
  insumos: { kind: 'none', overdue: true }, // OVERDUE
};

// ---- Pipeline: operaciones en TODOS los estados (sin facturar). ----
// Cubre RequestStatus (DRAFT→CANCELLED), QuoteStatus (DRAFT/SUBMITTED/AWARDED/
// REJECTED/WITHDRAWN) y OrderFulfillmentStatus (ISSUED→DELIVERED).
const PIPELINE = [
  { id: 'p1', buyer: 'andina', status: RequestStatus.DRAFT, title: 'Borrador — Rejas perimetrales', items: ['Reja modular galvanizada'], quotes: [] },
  {
    id: 'p2', buyer: 'litoral', status: RequestStatus.PUBLISHED, title: 'Válvulas industriales (comparando ofertas)',
    items: ['Válvula esférica 2"', 'Actuador neumático'],
    quotes: [
      { supplier: 'metalurgica', amount: 1350000, status: QuoteStatus.SUBMITTED },
      { supplier: 'plasticos', amount: 1180000, status: QuoteStatus.SUBMITTED },
      { supplier: 'insumos', amount: 1420000, status: QuoteStatus.SUBMITTED },
      { supplier: 'bigbags', amount: 1250000, status: QuoteStatus.DRAFT },
    ],
  },
  {
    id: 'p3', buyer: 'patagonia', status: RequestStatus.REVIEWING, title: 'Cintas transportadoras',
    items: ['Cinta transportadora 800mm'],
    quotes: [
      { supplier: 'metalurgica', amount: 2900000, status: QuoteStatus.SUBMITTED },
      { supplier: 'bigbags', amount: 3050000, status: QuoteStatus.SUBMITTED },
      { supplier: 'plasticos', amount: 2800000, status: QuoteStatus.WITHDRAWN },
    ],
  },
  {
    id: 'p4', buyer: 'andina', status: RequestStatus.AWARDED, title: 'Portones industriales',
    items: ['Portón corredizo automatizado'], awarded: 'metalurgica',
    quotes: [
      { supplier: 'metalurgica', amount: 1750000, status: QuoteStatus.AWARDED },
      { supplier: 'plasticos', amount: 1900000, status: QuoteStatus.REJECTED },
      { supplier: 'insumos', amount: 1820000, status: QuoteStatus.REJECTED },
    ],
  },
  {
    id: 'p5', buyer: 'litoral', status: RequestStatus.NEGOTIATING, title: 'Estanterías metálicas (en negociación)',
    items: ['Estantería rack selectivo'], awarded: 'bigbags',
    quotes: [
      { supplier: 'bigbags', amount: 2100000, status: QuoteStatus.AWARDED },
      { supplier: 'metalurgica', amount: 2250000, status: QuoteStatus.REJECTED },
    ],
  },
  {
    id: 'p6', buyer: 'patagonia', status: RequestStatus.ORDER_ISSUED, title: 'Bombas centrífugas',
    items: ['Bomba centrífuga 5HP'], awarded: 'metalurgica',
    quotes: [{ supplier: 'metalurgica', amount: 1600000, status: QuoteStatus.AWARDED }],
    order: { fulfillment: 'ISSUED', notes: 'Orden emitida, a la espera de confirmación del proveedor.' },
  },
  {
    id: 'p7', buyer: 'andina', status: RequestStatus.ORDER_ISSUED, title: 'Compresores de aire',
    items: ['Compresor 100L'], awarded: 'insumos',
    quotes: [{ supplier: 'insumos', amount: 980000, status: QuoteStatus.AWARDED }],
    order: { fulfillment: 'CONFIRMED', notes: 'Proveedor confirmó el pedido.' },
  },
  {
    id: 'p8', buyer: 'litoral', status: RequestStatus.ORDER_ISSUED, title: 'Big bags a medida (en producción)',
    items: ['Big Bag especial 1200kg'], awarded: 'bigbags',
    quotes: [{ supplier: 'bigbags', amount: 1450000, status: QuoteStatus.AWARDED }],
    order: { fulfillment: 'IN_PRODUCTION', notes: 'En producción, 50% avanzado.' },
  },
  {
    id: 'p9', buyer: 'patagonia', status: RequestStatus.ORDER_ISSUED, title: 'Tuberías HDPE',
    items: ['Caño HDPE 110mm'], awarded: 'plasticos',
    quotes: [{ supplier: 'plasticos', amount: 1320000, status: QuoteStatus.AWARDED }],
    order: { fulfillment: 'DISPATCHED', notes: 'Despachado, en tránsito.' },
  },
  {
    id: 'p10', buyer: 'litoral', status: RequestStatus.ORDER_ISSUED, title: 'Tolvas de acero',
    items: ['Tolva de acero 2m³'], awarded: 'metalurgica',
    quotes: [{ supplier: 'metalurgica', amount: 2400000, status: QuoteStatus.AWARDED }],
    order: { fulfillment: 'DELIVERED', notes: 'Entregado. Pendiente confirmación de recepción.' },
  },
  {
    id: 'p11', buyer: 'andina', status: RequestStatus.CANCELLED, title: 'Compra cancelada — Grupos electrógenos',
    items: ['Grupo electrógeno 20kVA'],
    quotes: [
      { supplier: 'insumos', amount: 3500000, status: QuoteStatus.WITHDRAWN },
      { supplier: 'metalurgica', amount: 3700000, status: QuoteStatus.REJECTED },
    ],
  },
];

async function upsertAccount(acc, type) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await prisma.company.upsert({
    where: { id: acc.companyId },
    update: { name: acc.companyName, type, legalName: acc.legalName ?? null, taxId: acc.taxId ?? null, city: acc.city ?? null },
    create: { id: acc.companyId, name: acc.companyName, type, country: 'AR', legalName: acc.legalName ?? null, taxId: acc.taxId ?? null, city: acc.city ?? null },
  });

  const user = await prisma.user.upsert({
    where: { email: acc.email },
    update: { passwordHash, firstName: acc.firstName, lastName: acc.lastName, status: UserStatus.ACTIVE },
    create: { email: acc.email, passwordHash, firstName: acc.firstName, lastName: acc.lastName, status: UserStatus.ACTIVE },
    include: { memberships: true },
  });

  const has = user.memberships.find((m) => m.companyId === acc.companyId && m.role === acc.role);
  if (!has) {
    await prisma.membership.create({
      data: { userId: user.id, companyId: acc.companyId, role: acc.role, isPrimary: user.memberships.length === 0 },
    });
  }
  return { userId: user.id, companyId: acc.companyId };
}

async function seedPipeline(buyerIds, supplierIds) {
  let orderSeq = 0;
  for (const op of PIPELINE) {
    const reqId = `demo-preq-${op.id}`;
    const buyerCompanyId = buyerIds[op.buyer];

    await prisma.request.upsert({
      where: { id: reqId },
      update: { title: op.title, status: op.status },
      create: {
        id: reqId,
        buyerCompanyId,
        title: op.title,
        description: `Operación demo en estado ${op.status}: ${op.title}.`,
        category: 'Industria',
        status: op.status,
      },
    });

    await prisma.requestItem.deleteMany({ where: { requestId: reqId } });
    if (op.items.length > 0) {
      await prisma.requestItem.createMany({
        data: op.items.map((productName, index) => ({ requestId: reqId, position: index, productName, category: 'Industria' })),
      });
    }

    let awardedQuoteId = null;
    for (const q of op.quotes) {
      const quoteId = `demo-pq-${op.id}-${q.supplier}`;
      await prisma.quote.upsert({
        where: { id: quoteId },
        update: { amount: q.amount, status: q.status },
        create: {
          id: quoteId,
          requestId: reqId,
          supplierCompanyId: supplierIds[q.supplier],
          amount: q.amount,
          currency: 'ARS',
          leadTimeDays: 15,
          paymentTerms: '30 días fecha factura',
          status: q.status,
        },
      });
      if (op.awarded && q.supplier === op.awarded) {
        awardedQuoteId = quoteId;
      }
    }

    await prisma.request.update({ where: { id: reqId }, data: { awardedQuoteId } });

    if (op.order) {
      orderSeq += 1;
      const orderId = `demo-ord-${op.id}`;
      await prisma.purchaseOrder.upsert({
        where: { id: orderId },
        update: { fulfillmentStatus: OrderFulfillmentStatus[op.order.fulfillment], notes: op.order.notes ?? null },
        create: {
          id: orderId,
          requestId: reqId,
          orderNumber: `ORD-DEMO-${String(orderSeq).padStart(4, '0')}`,
          fulfillmentStatus: OrderFulfillmentStatus[op.order.fulfillment],
          promisedDate: d('2026-11-15T00:00:00Z'),
          notes: op.order.notes ?? null,
        },
      });
    } else {
      await prisma.purchaseOrder.deleteMany({ where: { requestId: reqId } });
    }
  }
  console.log(`Pipeline: ${PIPELINE.length} operaciones en todos los estados.`);
}

async function main() {
  console.log('Sembrando datos demo…');

  // Cuentas
  const admin = await upsertAccount(ADMIN, ADMIN.companyType);
  const buyerIds = {};
  for (const b of BUYERS) {
    const r = await upsertAccount({ ...b, role: MembershipRole.BUYER }, CompanyType.BUYER);
    buyerIds[b.key] = r.companyId;
  }
  const supplierUserIds = {};
  const supplierIds = {};
  for (const s of SUPPLIERS) {
    const r = await upsertAccount({ ...s, role: MembershipRole.SUPPLIER }, CompanyType.SUPPLIER);
    supplierIds[s.key] = r.companyId;
    supplierUserIds[s.key] = r.userId;
  }

  // Regla de comisión + settings (por si no corrió ensureDefaults del API)
  const rule = await prisma.billingRule.upsert({
    where: { id: 'demo-rule-success-fee' },
    update: { ratePercent: RATE, isActive: true },
    create: {
      id: 'demo-rule-success-fee',
      version: 1,
      label: 'Success fee 1% (demo)',
      payer: BillingPayer.SUPPLIER,
      commissionType: CommissionType.SUCCESS_FEE,
      ratePercent: RATE,
      effectiveFrom: d('2026-01-01T00:00:00Z'),
      isActive: true,
    },
  });
  await prisma.billingSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', dueDays: 15, defaultRuleId: rule.id },
  });

  // Operaciones: request + items + quote adjudicada + comisión
  for (const op of OPS) {
    const buyerCompanyId = buyerIds[op.buyer];
    const supplierCompanyId = supplierIds[op.supplier];
    const reqId = `demo-req-${op.id}`;
    const quoteId = `demo-q-${op.id}`;
    const commissionAmount = round2((op.amount * RATE) / 100);

    await prisma.request.upsert({
      where: { id: reqId },
      update: { title: op.title, status: RequestStatus.COMPLETED },
      create: {
        id: reqId,
        buyerCompanyId,
        title: op.title,
        description: `Operación demo cerrada: ${op.title}.`,
        category: 'Industria',
        status: RequestStatus.COMPLETED,
        createdAt: d(`${op.date}T12:00:00Z`),
      },
    });

    await prisma.requestItem.deleteMany({ where: { requestId: reqId } });
    await prisma.requestItem.createMany({
      data: op.items.map((productName, index) => ({
        requestId: reqId,
        position: index,
        productName,
        category: 'Industria',
      })),
    });

    await prisma.quote.upsert({
      where: { id: quoteId },
      update: { amount: op.amount, status: QuoteStatus.AWARDED },
      create: {
        id: quoteId,
        requestId: reqId,
        supplierCompanyId,
        amount: op.amount,
        currency: 'ARS',
        status: QuoteStatus.AWARDED,
      },
    });

    await prisma.request.update({ where: { id: reqId }, data: { awardedQuoteId: quoteId } });

    await prisma.billingCommission.upsert({
      where: { requestId_commissionType: { requestId: reqId, commissionType: CommissionType.SUCCESS_FEE } },
      update: { baseAmount: op.amount, commissionAmount },
      create: {
        id: `demo-cm-${op.id}`,
        companyId: supplierCompanyId,
        requestId: reqId,
        quoteId,
        ruleId: rule.id,
        ruleVersion: rule.version,
        commissionType: CommissionType.SUCCESS_FEE,
        payer: BillingPayer.SUPPLIER,
        baseAmount: op.amount,
        ratePercentSnapshot: RATE,
        commissionAmount,
        currency: 'ARS',
        status: CommissionStatus.CONFIRMED,
        generatedAt: d(`${op.date}T12:00:00Z`),
        confirmedAt: d(`${op.date}T12:00:00Z`),
      },
    });
  }

  // ---- Liquidaciones del período 2026-09 ----
  const periodCode = '2026-09';
  const dueAt = d('2026-10-16T00:00:00Z');
  const period = await prisma.billingPeriod.upsert({
    where: { code: periodCode },
    update: { status: BillingPeriodStatus.ISSUED, dueAt, generatedAt: d('2026-10-01T09:00:00Z') },
    create: {
      id: 'demo-period-2026-09',
      code: periodCode,
      startsAt: d('2026-09-01T00:00:00Z'),
      endsAt: d('2026-10-01T00:00:00Z'),
      dueAt,
      status: BillingPeriodStatus.ISSUED,
      generatedAt: d('2026-10-01T09:00:00Z'),
    },
  });

  const septOps = OPS.filter((op) => op.date.startsWith('2026-09'));
  let seq = 0;
  for (const s of SUPPLIERS) {
    const ops = septOps.filter((op) => op.supplier === s.key);
    if (ops.length === 0) {
      continue;
    }
    seq += 1;
    const plan = PAYMENT_PLAN[s.key];
    const baseTotal = round2(ops.reduce((sum, op) => sum + op.amount, 0));
    const commissionTotal = round2(ops.reduce((sum, op) => sum + (op.amount * RATE) / 100, 0));
    const settlementId = `demo-stl-2026-09-${s.key}`;
    const documentNumber = `ATAR-2026-09-${String(seq).padStart(6, '0')}`;

    const isPaid = plan.kind === 'full';
    const isPartial = plan.kind === 'partial';
    const isOverdue = plan.kind === 'none' && plan.overdue;
    const status = isPaid
      ? SettlementStatus.PAID
      : isPartial
        ? SettlementStatus.PARTIALLY_PAID
        : isOverdue
          ? SettlementStatus.OVERDUE
          : SettlementStatus.ISSUED;
    const settlementDueAt = isOverdue ? d('2026-09-20T00:00:00Z') : dueAt;

    await prisma.billingSettlement.upsert({
      where: { id: settlementId },
      update: {
        status,
        operationsCount: ops.length,
        baseTotal,
        commissionTotal,
        grandTotal: commissionTotal,
        dueAt: settlementDueAt,
        paidAt: isPaid ? d('2026-10-05T10:00:00Z') : null,
      },
      create: {
        id: settlementId,
        periodId: period.id,
        companyId: supplierIds[s.key],
        currency: 'ARS',
        payer: BillingPayer.SUPPLIER,
        status,
        documentNumber,
        operationsCount: ops.length,
        baseTotal,
        commissionTotal,
        adjustmentsTotal: 0,
        grandTotal: commissionTotal,
        issuedAt: d('2026-10-01T09:00:00Z'),
        dueAt: settlementDueAt,
        paidAt: isPaid ? d('2026-10-05T10:00:00Z') : null,
        overdueNotifiedAt: isOverdue ? d('2026-09-21T09:00:00Z') : null,
      },
    });

    // Vincular las comisiones del proveedor a la liquidación
    await prisma.billingCommission.updateMany({
      where: { id: { in: ops.map((op) => `demo-cm-${op.id}`) } },
      data: {
        settlementId,
        periodId: period.id,
        status: isPaid ? CommissionStatus.PAID : CommissionStatus.INVOICED,
        paidAt: isPaid ? d('2026-10-05T10:00:00Z') : null,
      },
    });

    // Pago (según plan)
    const paymentId = `demo-pay-2026-09-${s.key}`;
    if (plan.kind === 'none') {
      await prisma.billingPayment.deleteMany({ where: { id: paymentId } });
    } else {
      const amount = plan.kind === 'partial' ? plan.amount : commissionTotal;
      const confirmed = plan.kind !== 'pending';
      await prisma.billingPayment.upsert({
        where: { id: paymentId },
        update: {
          amount,
          status: confirmed ? BillingPaymentStatus.CONFIRMED : BillingPaymentStatus.PENDING,
        },
        create: {
          id: paymentId,
          settlementId,
          method: BillingPaymentMethod.MANUAL_TRANSFER,
          status: confirmed ? BillingPaymentStatus.CONFIRMED : BillingPaymentStatus.PENDING,
          amount,
          currency: 'ARS',
          externalReference: `ATAR-BILLING-2026-09-${s.key}-demo`,
          registeredByUserId: supplierUserIds[s.key],
          confirmedByUserId: confirmed ? admin.userId : null,
          confirmedAt: confirmed ? d('2026-10-05T10:00:00Z') : null,
          paidAt: confirmed ? d('2026-10-04T15:00:00Z') : null,
          metadata: { note: 'Transferencia demo' },
        },
      });
    }
  }

  await seedPipeline(buyerIds, supplierIds);

  printCredentials();
}

function printCredentials() {
  const line = (label, email) => `  ${label.padEnd(26)} ${email.padEnd(32)} ${PASSWORD}`;
  console.log('\n=============================================================');
  console.log('  DATOS DEMO LISTOS — credenciales (contraseña única)');
  console.log('=============================================================');
  console.log(`\n  Contraseña para TODAS las cuentas:  ${PASSWORD}\n`);
  console.log('  ADMIN DE ATAR (panel /dashboard/admin)');
  console.log(line('Admin', ADMIN.email));
  console.log('\n  COMPRADORES (panel /dashboard/comprador)');
  for (const b of BUYERS) console.log(line(b.companyName, b.email));
  console.log('\n  PROVEEDORES (panel /dashboard/proveedor)');
  for (const s of SUPPLIERS) console.log(line(s.companyName, s.email));
  console.log('\n=============================================================\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
