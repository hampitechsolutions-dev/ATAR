const bcrypt = require('bcrypt');
const {
  PrismaClient,
  CompanyType,
  MembershipRole,
  OrderFulfillmentStatus,
  QuoteStatus,
  RequestEventType,
  RequestStatus,
  UserStatus,
} = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123';

function buildSupplierProfileData(overrides = {}) {
  return {
    genericCode: overrides.genericCode ?? 'ATAR-DEMO',
    leadTimeDays: overrides.leadTimeDays ?? 7,
    minimumOrder: overrides.minimumOrder ?? 100000,
    logisticsSummary: overrides.logisticsSummary ?? 'Entrega coordinada en AMBA y transporte nacional.',
    financingSummary: overrides.financingSummary ?? '30 dias fecha factura para cuentas aprobadas.',
  };
}

async function ensureUserWithCompany(input) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      memberships: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!existingUser) {
    const createdUser = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: UserStatus.ACTIVE,
        memberships: {
          create: {
            role: input.role,
            isPrimary: true,
            company: {
              create: {
                name: input.companyName,
                type: input.companyType,
                country: input.country ?? 'AR',
                city: input.city ?? null,
                supplierProfile:
                  input.companyType === CompanyType.SUPPLIER ||
                  input.companyType === CompanyType.HYBRID
                    ? {
                        create: buildSupplierProfileData(input.supplierProfile),
                      }
                    : undefined,
              },
            },
          },
        },
      },
      include: {
        memberships: {
          include: {
            company: true,
          },
        },
      },
    });

    return {
      userId: createdUser.id,
      companyId: createdUser.memberships[0].company.id,
    };
  }

  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      status: UserStatus.ACTIVE,
    },
  });

  const currentMembership = existingUser.memberships.find((membership) => membership.role === input.role);

  if (currentMembership) {
    await prisma.company.update({
      where: { id: currentMembership.companyId },
      data: {
        name: input.companyName,
        type: input.companyType,
        country: input.country ?? 'AR',
        city: input.city ?? null,
        supplierProfile:
          input.companyType === CompanyType.SUPPLIER || input.companyType === CompanyType.HYBRID
            ? {
                upsert: {
                  create: buildSupplierProfileData(input.supplierProfile),
                  update: buildSupplierProfileData(input.supplierProfile),
                },
              }
            : undefined,
      },
    });

    return {
      userId: existingUser.id,
      companyId: currentMembership.companyId,
    };
  }

  const company = await prisma.company.create({
    data: {
      name: input.companyName,
      type: input.companyType,
      country: input.country ?? 'AR',
      city: input.city ?? null,
      supplierProfile:
        input.companyType === CompanyType.SUPPLIER || input.companyType === CompanyType.HYBRID
          ? {
              create: buildSupplierProfileData(input.supplierProfile),
            }
          : undefined,
    },
  });

  await prisma.membership.create({
    data: {
      userId: existingUser.id,
      companyId: company.id,
      role: input.role,
      isPrimary: existingUser.memberships.length === 0,
    },
  });

  return {
    userId: existingUser.id,
    companyId: company.id,
  };
}

async function ensureDemoRequest(buyerCompanyId) {
  const title = 'Compra demo ATAR - Chapas galvanizadas';
  const existingRequest = await prisma.request.findFirst({
    where: {
      buyerCompanyId,
      title,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (existingRequest) {
    return prisma.request.update({
      where: { id: existingRequest.id },
      data: {
        description:
          'Solicitud de ejemplo para validar el flujo completo de publicacion, cotizacion y comparacion.',
        category: 'Metales',
        privateRequest: false,
        status: RequestStatus.PUBLISHED,
      },
    });
  }

  return prisma.request.create({
    data: {
      buyerCompanyId,
      title,
      description:
        'Solicitud de ejemplo para validar el flujo completo de publicacion, cotizacion y comparacion.',
      category: 'Metales',
      privateRequest: false,
      status: RequestStatus.PUBLISHED,
    },
  });
}

async function ensureDemoQuote(requestId, supplierCompanyId) {
  const existingQuote = await prisma.quote.findFirst({
    where: {
      requestId,
      supplierCompanyId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (existingQuote) {
    return prisma.quote.update({
      where: { id: existingQuote.id },
      data: {
        amount: 1250000,
        currency: 'ARS',
        leadTimeDays: 7,
        paymentTerms: '30 dias fecha factura',
        technicalComment: 'Incluye corte a medida, embalaje y coordinacion logistica.',
        status: QuoteStatus.SUBMITTED,
      },
    });
  }

  return prisma.quote.create({
    data: {
      requestId,
      supplierCompanyId,
      amount: 1250000,
      currency: 'ARS',
      leadTimeDays: 7,
      paymentTerms: '30 dias fecha factura',
      technicalComment: 'Incluye corte a medida, embalaje y coordinacion logistica.',
      status: QuoteStatus.SUBMITTED,
    },
  });
}

async function ensureDemoTimeline(requestRecord, buyerCompanyName, supplierCompanyName) {
  const existingEvents = await prisma.requestEvent.findMany({
    where: {
      requestId: requestRecord.id,
    },
    select: {
      type: true,
    },
  });

  const existingTypes = new Set(existingEvents.map((event) => event.type));

  if (!existingTypes.has(RequestEventType.REQUEST_CREATED)) {
    await prisma.requestEvent.create({
      data: {
        requestId: requestRecord.id,
        type: RequestEventType.REQUEST_CREATED,
        title: 'Solicitud publicada',
        detail: `La solicitud "${requestRecord.title}" se publico para recibir cotizaciones.`,
        actorRole: MembershipRole.BUYER,
        actorCompanyName: buyerCompanyName,
      },
    });
  }

  if (!existingTypes.has(RequestEventType.QUOTE_SUBMITTED)) {
    await prisma.requestEvent.create({
      data: {
        requestId: requestRecord.id,
        type: RequestEventType.QUOTE_SUBMITTED,
        title: 'Nueva cotizacion recibida',
        detail: `${supplierCompanyName} envio una propuesta para esta solicitud.`,
        actorRole: MembershipRole.SUPPLIER,
        actorCompanyName: supplierCompanyName,
      },
    });
  }
}

async function ensureOrderedDemoScenario(buyerCompanyId, supplierCompanyId) {
  const title = 'Orden demo ATAR - Bobinas emitidas';
  const existingRequest = await prisma.request.findFirst({
    where: {
      buyerCompanyId,
      title,
    },
    include: {
      awardedQuote: true,
      order: true,
    },
  });

  const requestRecord =
    existingRequest ??
    (await prisma.request.create({
      data: {
        buyerCompanyId,
        title,
        description:
          'Escenario demo para revisar una orden emitida con seguimiento operativo.',
        category: 'Packaging',
        privateRequest: false,
        status: RequestStatus.ORDER_ISSUED,
      },
    }));

  const existingQuote = await prisma.quote.findFirst({
    where: {
      requestId: requestRecord.id,
      supplierCompanyId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const quote = existingQuote
    ? await prisma.quote.update({
        where: { id: existingQuote.id },
        data: {
          amount: 980000,
          currency: 'ARS',
          leadTimeDays: 5,
          paymentTerms: 'Anticipo 50% y saldo contra entrega',
          technicalComment: 'Produccion programada con inspeccion final.',
          status: QuoteStatus.AWARDED,
        },
      })
    : await prisma.quote.create({
        data: {
          requestId: requestRecord.id,
          supplierCompanyId,
          amount: 980000,
          currency: 'ARS',
          leadTimeDays: 5,
          paymentTerms: 'Anticipo 50% y saldo contra entrega',
          technicalComment: 'Produccion programada con inspeccion final.',
          status: QuoteStatus.AWARDED,
        },
      });

  await prisma.quote.updateMany({
    where: {
      requestId: requestRecord.id,
      id: {
        not: quote.id,
      },
    },
    data: {
      status: QuoteStatus.REJECTED,
    },
  });

  await prisma.request.update({
    where: { id: requestRecord.id },
    data: {
      status: RequestStatus.ORDER_ISSUED,
      awardedQuoteId: quote.id,
      order: {
        upsert: {
          create: {
            orderNumber: 'ATAR-DEMO-0001',
            fulfillmentStatus: OrderFulfillmentStatus.DELIVERED,
            promisedDate: new Date('2026-12-20T00:00:00.000Z'),
            notes: 'Entrega parcial permitida en dos tandas con coordinacion previa.',
          },
          update: {
            orderNumber: 'ATAR-DEMO-0001',
            fulfillmentStatus: OrderFulfillmentStatus.DELIVERED,
            promisedDate: new Date('2026-12-20T00:00:00.000Z'),
            notes: 'Entrega parcial permitida en dos tandas con coordinacion previa.',
          },
        },
      },
    },
  });

  const orderedEventTypes = [
    RequestEventType.REQUEST_CREATED,
    RequestEventType.QUOTE_SUBMITTED,
    RequestEventType.REQUEST_AWARDED,
    RequestEventType.NEGOTIATION_STARTED,
    RequestEventType.ORDER_ISSUED,
    RequestEventType.ORDER_UPDATED,
    RequestEventType.ORDER_CONFIRMED,
    RequestEventType.PRODUCTION_STARTED,
    RequestEventType.ORDER_DISPATCHED,
    RequestEventType.ORDER_DELIVERED,
  ];

  for (const eventType of orderedEventTypes) {
    const exists = await prisma.requestEvent.findFirst({
      where: {
        requestId: requestRecord.id,
        type: eventType,
      },
    });

    if (exists) {
      continue;
    }

    const payloadByType = {
      [RequestEventType.REQUEST_CREATED]: {
        title: 'Solicitud publicada',
        detail: `La solicitud "${title}" se publico para recibir cotizaciones.`,
        actorRole: MembershipRole.BUYER,
        actorCompanyName: 'Compradora Demo SA',
      },
      [RequestEventType.QUOTE_SUBMITTED]: {
        title: 'Nueva cotizacion recibida',
        detail: 'Proveedor Metal Demo SRL envio una propuesta para esta solicitud.',
        actorRole: MembershipRole.SUPPLIER,
        actorCompanyName: 'Proveedor Metal Demo SRL',
      },
      [RequestEventType.REQUEST_AWARDED]: {
        title: 'Solicitud adjudicada',
        detail: 'Se adjudico la solicitud a Proveedor Metal Demo SRL por ARS 980000.',
        actorRole: MembershipRole.BUYER,
        actorCompanyName: 'Compradora Demo SA',
      },
      [RequestEventType.NEGOTIATION_STARTED]: {
        title: 'Negociacion iniciada',
        detail: 'Compradora Demo SA inicio una instancia de negociacion con Proveedor Metal Demo SRL.',
        actorRole: MembershipRole.BUYER,
        actorCompanyName: 'Compradora Demo SA',
      },
      [RequestEventType.ORDER_ISSUED]: {
        title: 'Orden emitida',
        detail: 'Compradora Demo SA emitio la orden comercial para Proveedor Metal Demo SRL.',
        actorRole: MembershipRole.BUYER,
        actorCompanyName: 'Compradora Demo SA',
      },
      [RequestEventType.ORDER_UPDATED]: {
        title: 'Orden actualizada',
        detail: 'Compradora Demo SA actualizo los datos operativos de la orden.',
        actorRole: MembershipRole.BUYER,
        actorCompanyName: 'Compradora Demo SA',
      },
      [RequestEventType.ORDER_CONFIRMED]: {
        title: 'Orden confirmada',
        detail: 'Proveedor Metal Demo SRL confirmo la orden y su recepcion operativa.',
        actorRole: MembershipRole.SUPPLIER,
        actorCompanyName: 'Proveedor Metal Demo SRL',
      },
      [RequestEventType.PRODUCTION_STARTED]: {
        title: 'Produccion iniciada',
        detail: 'Proveedor Metal Demo SRL inicio la produccion o preparacion del pedido.',
        actorRole: MembershipRole.SUPPLIER,
        actorCompanyName: 'Proveedor Metal Demo SRL',
      },
      [RequestEventType.ORDER_DISPATCHED]: {
        title: 'Pedido despachado',
        detail: 'Proveedor Metal Demo SRL marco la orden como despachada.',
        actorRole: MembershipRole.SUPPLIER,
        actorCompanyName: 'Proveedor Metal Demo SRL',
      },
      [RequestEventType.ORDER_DELIVERED]: {
        title: 'Pedido entregado',
        detail: 'Proveedor Metal Demo SRL confirmo la entrega del pedido.',
        actorRole: MembershipRole.SUPPLIER,
        actorCompanyName: 'Proveedor Metal Demo SRL',
      },
    };

    await prisma.requestEvent.create({
      data: {
        requestId: requestRecord.id,
        type: eventType,
        ...payloadByType[eventType],
      },
    });
  }
}

async function main() {
  const buyer = await ensureUserWithCompany({
    email: 'comprador.demo@atar.test',
    firstName: 'Ana',
    lastName: 'Compras',
    companyName: 'Compradora Demo SA',
    companyType: CompanyType.BUYER,
    role: MembershipRole.BUYER,
    city: 'Buenos Aires',
  });

  const supplier = await ensureUserWithCompany({
    email: 'proveedor.demo@atar.test',
    firstName: 'Pedro',
    lastName: 'Proveedor',
    companyName: 'Proveedor Metal Demo SRL',
    companyType: CompanyType.SUPPLIER,
    role: MembershipRole.SUPPLIER,
    city: 'Cordoba',
    supplierProfile: {
      genericCode: 'MET-001',
      leadTimeDays: 7,
      minimumOrder: 100000,
    },
  });

  const requestRecord = await ensureDemoRequest(buyer.companyId);
  await ensureDemoQuote(requestRecord.id, supplier.companyId);
  await ensureDemoTimeline(requestRecord, 'Compradora Demo SA', 'Proveedor Metal Demo SRL');
  await ensureOrderedDemoScenario(buyer.companyId, supplier.companyId);

  console.log('Seed completado.');
  console.log(`Comprador demo: comprador.demo@atar.test / ${DEMO_PASSWORD}`);
  console.log(`Proveedor demo: proveedor.demo@atar.test / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Fallo el seed de Prisma.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
