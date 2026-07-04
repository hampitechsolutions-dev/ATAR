const bcrypt = require('bcrypt');
const {
  PrismaClient,
  CompanyType,
  MembershipRole,
  OrderFulfillmentStatus,
  QuoteStatus,
  RequestCatalogFieldType,
  RequestCatalogInputType,
  RequestEventType,
  RequestStatus,
  UserStatus,
} = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123';

const REQUEST_CATALOG = [
  {
    label: 'Big Bags',
    subtitle: 'FIBC 500 - 2000 kg',
    imageSrc: '/bigbag.png',
    imageClassName: 'scale-[1.56] translate-y-4',
    searchKeywords: ['big bag', 'bolsas', 'fibc', 'polipropileno'],
    fields: [
      { key: 'material', label: 'Material', type: RequestCatalogFieldType.CHOICES, options: ['Polipropileno virgen', 'Reciclado', 'Laminado', 'Antiestatico'], required: true },
      { key: 'capacidad', label: 'Capacidad', type: RequestCatalogFieldType.SEGMENTED, options: ['500 kg', '750 kg', '1000 kg', '1250 kg', '1500 kg', '2000 kg'], required: true },
      { key: 'tipo-asa', label: 'Tipo de asa', type: RequestCatalogFieldType.CHOICES, options: ['Loop', 'Cruzada', 'Tubular', '4 asas'], required: true },
      { key: 'tipo-boca', label: 'Tipo de boca', type: RequestCatalogFieldType.SEGMENTED, options: ['Abierta', 'Faldon', 'Carga rapida', 'Valvula'] },
      { key: 'tipo-fondo', label: 'Tipo de fondo', type: RequestCatalogFieldType.SEGMENTED, options: ['Plano', 'Descarga parcial', 'Descarga total'] },
      { key: 'liner', label: 'Liner', type: RequestCatalogFieldType.SEGMENTED, options: ['Sin liner', 'Suelto', 'Pegado'] },
      { key: 'impresion', label: 'Impresion', type: RequestCatalogFieldType.CHOICES, options: ['Sin impresion', '1 color', '2 colores', 'Cobertura total'] },
      { key: 'cantidad', label: 'Cantidad', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'adjuntos', label: 'Adjuntar archivos', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'PDF, AI, PNG, STEP o DWG' },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Indicá medidas, certificaciones, uso o cualquier detalle clave.', fullWidth: true },
    ],
  },
  {
    label: 'Bolsas PP',
    subtitle: 'Tejidas y laminadas',
    imageSrc: '/bolsapp.png',
    imageClassName: 'scale-[1.5] translate-y-4',
    searchKeywords: ['bolsas', 'packaging', 'polipropileno'],
    fields: [
      { key: 'material', label: 'Material', type: RequestCatalogFieldType.CHOICES, options: ['Virgen', 'Reciclado', 'Laminado', 'Mixto'], required: true },
      { key: 'gramaje', label: 'Gramaje', type: RequestCatalogFieldType.SEGMENTED, options: ['40 g', '55 g', '70 g', '90 g', '120 g'], required: true },
      { key: 'medidas', label: 'Medidas', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 50 x 80 cm', required: true },
      { key: 'fuelle', label: 'Fuelle', type: RequestCatalogFieldType.SEGMENTED, options: ['Sin fuelle', 'Lateral', 'Base'] },
      { key: 'laminado', label: 'Laminado', type: RequestCatalogFieldType.SEGMENTED, options: ['No', '1 cara', '2 caras'] },
      { key: 'microperforado', label: 'Microperforado', type: RequestCatalogFieldType.SEGMENTED, options: ['No', 'Si'] },
      { key: 'tipo-cierre', label: 'Tipo de cierre', type: RequestCatalogFieldType.CHOICES, options: ['Abierto', 'Costura', 'Valvula', 'Troquel'] },
      { key: 'impresion', label: 'Impresion', type: RequestCatalogFieldType.CHOICES, options: ['Sin impresion', '1 color', '2 colores', 'Full print'] },
      { key: 'cantidad', label: 'Cantidad', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'adjuntos', label: 'Adjuntar diseño', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'Subí artes, croquis o referencias.' },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Agregá detalles sobre sellado, uso o terminaciones.', fullWidth: true },
    ],
  },
  {
    label: 'Polipropileno',
    subtitle: 'Tejidos, rafia y laminados',
    imageSrc: '/rollo.png',
    imageClassName: 'scale-[1.64] translate-y-2',
    searchKeywords: ['polipropileno', 'plasticos', 'rafia'],
    fields: [
      { key: 'tipo', label: 'Tipo', type: RequestCatalogFieldType.CHOICES, options: ['Homopolimero', 'Copolimero', 'Rafia', 'Fibra'], required: true },
      { key: 'presentacion', label: 'Presentacion', type: RequestCatalogFieldType.SEGMENTED, options: ['Pellets', 'Rollo', 'Tejido', 'Bobina'], required: true },
      { key: 'color', label: 'Color', type: RequestCatalogFieldType.SEGMENTED, options: ['Natural', 'Blanco', 'Negro', 'Personalizado'] },
      { key: 'indice-fluidez', label: 'Indice de fluidez', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 3.5 g/10 min' },
      { key: 'cantidad', label: 'Cantidad', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'frecuencia', label: 'Frecuencia de compra', type: RequestCatalogFieldType.SEGMENTED, options: ['Unica', 'Mensual', 'Trimestral', 'Programada'] },
      { key: 'adjuntos', label: 'Adjuntar especificaciones', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'Subí ficha técnica o requerimientos.' },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Especificá aplicaciones, normas o propiedades buscadas.', fullWidth: true },
    ],
  },
  {
    label: 'Polietileno',
    subtitle: 'Films, mangas y bobinas',
    imageSrc: '/bolsapp.png',
    imageClassName: 'scale-[1.52] translate-y-4',
    searchKeywords: ['plasticos', 'filmes', 'envases'],
    fields: [
      { key: 'tipo', label: 'Tipo', type: RequestCatalogFieldType.CHOICES, options: ['PEAD', 'PEBD', 'PEBDL', 'Reciclado'], required: true },
      { key: 'presentacion', label: 'Presentacion', type: RequestCatalogFieldType.SEGMENTED, options: ['Film', 'Manga', 'Bobina', 'Lamina'], required: true },
      { key: 'espesor', label: 'Espesor', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 80 micrones' },
      { key: 'ancho', label: 'Ancho', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 1200 mm' },
      { key: 'color', label: 'Color', type: RequestCatalogFieldType.SEGMENTED, options: ['Natural', 'Blanco', 'Negro', 'Color custom'] },
      { key: 'uso', label: 'Uso', type: RequestCatalogFieldType.CHOICES, options: ['Packaging', 'Industrial', 'Agro', 'Construccion'] },
      { key: 'cantidad', label: 'Cantidad', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'adjuntos', label: 'Adjuntar ficha tecnica', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'Incluí tolerancias o fichas de calidad.' },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Agregá requerimientos de aplicación, espesor o acabado.', fullWidth: true },
    ],
  },
  {
    label: 'Rollos y Telas',
    subtitle: 'Polipropileno y otros',
    imageSrc: '/rollo.png',
    imageClassName: 'scale-[1.64] translate-y-2',
    searchKeywords: ['filmes', 'packaging', 'plasticos'],
    fields: [
      { key: 'material', label: 'Material', type: RequestCatalogFieldType.CHOICES, options: ['PP', 'PE', 'Mixto', 'Reciclado'], required: true },
      { key: 'ancho', label: 'Ancho', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 160 cm', required: true },
      { key: 'largo', label: 'Largo', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 500 m' },
      { key: 'espesor', label: 'Espesor', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 120 micrones' },
      { key: 'color', label: 'Color', type: RequestCatalogFieldType.SEGMENTED, options: ['Natural', 'Blanco', 'Negro', 'Custom'] },
      { key: 'tratamiento-uv', label: 'Tratamiento UV', type: RequestCatalogFieldType.SEGMENTED, options: ['No', 'UV 6 meses', 'UV 12 meses', 'Reforzado'] },
      { key: 'laminado', label: 'Laminado', type: RequestCatalogFieldType.SEGMENTED, options: ['No', 'Simple', 'Doble'] },
      { key: 'impresion', label: 'Impresion', type: RequestCatalogFieldType.CHOICES, options: ['Sin impresion', '1 color', '2 colores', 'Alta cobertura'] },
      { key: 'cantidad', label: 'Cantidad', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'adjuntos', label: 'Adjuntar plano', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'Subí referencia visual, plano o muestra.' },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Indicá aplicación, tensión, tratamiento o acabado.', fullWidth: true },
    ],
  },
  {
    label: 'Sacos',
    subtitle: 'De papel, rafia y mas',
    imageSrc: '/saco.png',
    imageClassName: 'scale-[1.5] translate-y-3',
    searchKeywords: ['bolsas', 'packaging', 'industriales'],
    fields: [
      { key: 'material', label: 'Material', type: RequestCatalogFieldType.CHOICES, options: ['Papel', 'Rafia', 'Mixto', 'Laminado'], required: true },
      { key: 'capacidad', label: 'Capacidad', type: RequestCatalogFieldType.SEGMENTED, options: ['10 kg', '25 kg', '40 kg', '50 kg', 'Custom'], required: true },
      { key: 'medidas', label: 'Medidas', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: 45 x 75 cm' },
      { key: 'costura', label: 'Costura', type: RequestCatalogFieldType.SEGMENTED, options: ['Simple', 'Doble', 'Termosellada'] },
      { key: 'valvula', label: 'Valvula', type: RequestCatalogFieldType.SEGMENTED, options: ['Sin valvula', 'Interna', 'Externa'] },
      { key: 'impresion', label: 'Impresion', type: RequestCatalogFieldType.CHOICES, options: ['Sin impresion', '1 color', '2 colores', '3 colores'] },
      { key: 'paletizado', label: 'Paletizado', type: RequestCatalogFieldType.SEGMENTED, options: ['Sin paletizar', 'Estandar', 'Reforzado'] },
      { key: 'cantidad', label: 'Cantidad', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Agregá detalles sobre carga, almacenamiento o despacho.', fullWidth: true },
    ],
  },
  {
    label: 'A medida',
    subtitle: 'Desarrollos especiales',
    imageSrc: '/amedida.png',
    imageClassName: 'scale-[1.62] translate-y-3',
    searchKeywords: ['atencion personalizada', 'integracion', 'premium'],
    fields: [
      { key: 'descripcion-producto', label: 'Descripcion del producto', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Contanos qué producto necesitás desarrollar.', required: true, fullWidth: true },
      { key: 'uso-producto', label: 'Uso del producto', type: RequestCatalogFieldType.CHOICES, options: ['Agro', 'Construccion', 'Logistica', 'Retail'], required: true },
      { key: 'material-deseado', label: 'Material deseado', type: RequestCatalogFieldType.CHOICES, options: ['PP', 'PE', 'Papel', 'A definir'] },
      { key: 'cantidad-estimada', label: 'Cantidad estimada', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'fecha-objetivo', label: 'Fecha objetivo', type: RequestCatalogFieldType.INPUT, inputType: RequestCatalogInputType.DATE, options: [], required: true },
      { key: 'adjuntar-planos', label: 'Adjuntar planos', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'PDF, CAD o documentación técnica.' },
      { key: 'adjuntar-imagenes', label: 'Adjuntar imágenes', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'Fotos, renders o referencias visuales.' },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Indicá condicionantes, normativas o hitos del proyecto.', fullWidth: true },
    ],
  },
  {
    label: 'Tintas',
    subtitle: 'Flexografia e impresion industrial',
    imageSrc: '/amedida.png',
    imageClassName: 'scale-[1.52] translate-y-3',
    searchKeywords: ['impresiones', 'packaging', 'conversion'],
    fields: [
      { key: 'tipo-tinta', label: 'Tipo de tinta', type: RequestCatalogFieldType.CHOICES, options: ['Flexografica', 'Huecograbado', 'Base agua', 'Base solvente'], required: true },
      { key: 'base', label: 'Base', type: RequestCatalogFieldType.SEGMENTED, options: ['Agua', 'Solvente', 'UV', 'Especial'], required: true },
      { key: 'cantidad-colores', label: 'Cantidad de colores', type: RequestCatalogFieldType.SEGMENTED, options: ['1', '2', '3', '4+'] },
      { key: 'pantone', label: 'Pantone', type: RequestCatalogFieldType.INPUT, options: [], placeholder: 'Ej: Pantone 286 C' },
      { key: 'sustrato', label: 'Sustrato', type: RequestCatalogFieldType.CHOICES, options: ['PP', 'PE', 'Papel', 'Mixto'] },
      { key: 'cantidad', label: 'Cantidad', type: RequestCatalogFieldType.QUANTITY, options: [], required: true },
      { key: 'adjuntos', label: 'Adjuntar diseño', type: RequestCatalogFieldType.UPLOADER, options: [], helper: 'Subí artes, layout o especificaciones.' },
      { key: 'observaciones', label: 'Observaciones', type: RequestCatalogFieldType.TEXTAREA, options: [], placeholder: 'Aclará viscosidad, anilox, secado o requerimientos especiales.', fullWidth: true },
    ],
  },
];

function buildSupplierProfileData(overrides = {}) {
  return {
    genericCode: overrides.genericCode ?? 'ATAR-DEMO',
    leadTimeDays: overrides.leadTimeDays ?? 7,
    minimumOrder: overrides.minimumOrder ?? 100000,
    logisticsSummary: overrides.logisticsSummary ?? 'Entrega coordinada en AMBA y transporte nacional.',
    financingSummary: overrides.financingSummary ?? '30 dias fecha factura para cuentas aprobadas.',
  };
}

async function ensureRequestCatalog() {
  const activeLabels = REQUEST_CATALOG.map((category) => category.label);

  await prisma.requestCatalogCategory.deleteMany({
    where: {
      label: {
        notIn: activeLabels,
      },
    },
  });

  for (const [categoryIndex, category] of REQUEST_CATALOG.entries()) {
    const record = await prisma.requestCatalogCategory.upsert({
      where: {
        label: category.label,
      },
      create: {
        label: category.label,
        subtitle: category.subtitle,
        imageSrc: category.imageSrc,
        imageClassName: category.imageClassName,
        searchKeywords: category.searchKeywords,
        sortOrder: categoryIndex,
        isActive: true,
      },
      update: {
        subtitle: category.subtitle,
        imageSrc: category.imageSrc,
        imageClassName: category.imageClassName,
        searchKeywords: category.searchKeywords,
        sortOrder: categoryIndex,
        isActive: true,
      },
    });

    await prisma.requestCatalogField.deleteMany({
      where: {
        categoryId: record.id,
      },
    });

    await prisma.requestCatalogField.createMany({
      data: category.fields.map((field, fieldIndex) => ({
        categoryId: record.id,
        key: field.key,
        label: field.label,
        type: field.type,
        options: field.options ?? [],
        placeholder: field.placeholder ?? null,
        helper: field.helper ?? null,
        required: field.required ?? false,
        fullWidth: field.fullWidth ?? false,
        inputType: field.inputType ?? null,
        sortOrder: fieldIndex,
        isActive: true,
      })),
    });
  }
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
  await ensureRequestCatalog();

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
