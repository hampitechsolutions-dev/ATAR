/**
 * Recorridos guiados de ATARIA.
 *
 * Cada paso apunta a un elemento real de la interfaz por su atributo
 * `data-tour` (no por clases CSS, que cambian con el diseño). Un paso puede
 * listar varios destinos en orden de preferencia: se usa el primero que esté
 * visible, así el mismo recorrido sirve en escritorio y en el celular, donde
 * parte del menú vive detrás de "Más" o "Menú".
 *
 * Solo se describen pantallas y acciones que existen hoy. Si una pantalla
 * cambia y un destino deja de estar, el motor saltea ese paso solo.
 */

export type TourAudience = 'buyer' | 'sales' | 'company';

/** Perfil de quien mira: define qué recorridos se ofrecen. */
export type TourProfile = 'buyer' | 'seller' | 'company';

export type TourStep = {
  /** Ruta donde vive el paso. Si no es la actual, el recorrido navega hasta ahí. */
  route: string;
  /** Valores de `data-tour`, en orden de preferencia. Sin destino = tarjeta centrada. */
  target?: string[];
  title: string;
  body: string;
};

export type Tour = {
  id: string;
  audience: TourAudience;
  title: string;
  /** Qué enseña, en una línea: se muestra en la lista de tutoriales. */
  description: string;
  /** Palabras para ubicarlo cuando el usuario pregunta "¿cómo hago…?". */
  keywords: string[];
  /** Pantallas que explica: alimenta "Aprender esta sección". */
  sections: string[];
  /** Recorrido inicial del perfil. */
  welcome?: boolean;
  steps: TourStep[];
};

const B = '/dashboard/comprador';
const S = '/dashboard/proveedor';

export const TOURS: Tour[] = [
  /* ============================== COMPRADOR ============================== */
  {
    id: 'buyer-welcome',
    audience: 'buyer',
    welcome: true,
    title: 'Recorrido inicial',
    description: 'Un minuto para ver dónde está cada cosa en tu inicio.',
    keywords: ['inicio', 'empezar', 'recorrido', 'conocer', 'plataforma'],
    sections: [B],
    steps: [
      {
        route: B,
        title: '¡Hola! Soy ATARIA',
        body: 'Te muestro en un minuto dónde está cada cosa. Podés avanzar, volver atrás o salir del recorrido cuando quieras.',
      },
      {
        route: B,
        target: ['buyer-search'],
        title: 'Buscá lo que necesitás',
        body: 'Escribí un producto, un material, un rubro o el nombre de un proveedor. Los resultados aparecen en esta misma pantalla.',
      },
      {
        route: B,
        target: ['buyer-cta'],
        title: 'Pedí una cotización',
        body: 'Este botón está siempre a mano. Abre el formulario de solicitud: contás qué necesitás y lo reciben varios proveedores.',
      },
      {
        route: B,
        target: ['home-shortcuts'],
        title: 'Tus accesos',
        body: 'Desde acá entrás a tus solicitudes, a las cotizaciones que recibiste, a tus pedidos y a los proveedores.',
      },
      {
        route: B,
        target: ['home-categories'],
        title: 'Categorías',
        body: 'Si ya sabés qué rubro buscás, elegilo acá y empezás la cotización con ese producto cargado.',
      },
      {
        route: B,
        target: ['home-suppliers'],
        title: 'Proveedores recomendados',
        body: 'Empresas registradas en ATAR, con las verificadas primero. Podés ver su perfil o pedirles una cotización directamente.',
      },
      {
        route: B,
        target: ['home-activity'],
        title: 'Retomá donde dejaste',
        body: 'Tus últimas solicitudes con su estado. Si alguna ya tiene respuestas, desde acá vas directo a compararlas.',
      },
      {
        route: B,
        target: ['nav-panel'],
        title: 'Tu panel',
        body: 'El Panel resume qué requiere tu atención, en qué etapa está cada solicitud y cómo vienen tus pedidos.',
      },
      {
        route: B,
        target: ['assistant-fab'],
        title: 'Acá me encontrás',
        body: 'Quedo escondida en este borde. Tocame cuando quieras ver los tutoriales o repetir un recorrido.',
      },
    ],
  },
  {
    id: 'buyer-search',
    audience: 'buyer',
    title: 'Buscar productos y proveedores',
    description: 'Cómo usar el buscador y el directorio de proveedores.',
    keywords: ['buscar', 'busqueda', 'producto', 'proveedor', 'proveedores', 'directorio', 'encontrar', 'filtrar'],
    sections: [`${B}/proveedores`],
    steps: [
      {
        route: B,
        target: ['buyer-search'],
        title: 'El buscador',
        body: 'Busca a la vez en las categorías del catálogo y en los proveedores. Probá con un producto o con un material.',
      },
      {
        route: `${B}/proveedores`,
        target: ['suppliers-filters'],
        title: 'Filtrá el directorio',
        body: 'En Proveedores podés buscar por nombre o ciudad y filtrar por tipo de empresa, categoría y verificación.',
      },
      {
        route: `${B}/proveedores`,
        target: ['suppliers-list'],
        title: 'Elegí con quién trabajar',
        body: 'Cada proveedor muestra su ubicación, plazo de entrega y pedido mínimo. "Ver ficha" abre su perfil completo y "Solicitar cotización" arranca un pedido de precio.',
      },
    ],
  },
  {
    id: 'buyer-categories',
    audience: 'buyer',
    title: 'Navegar por categorías',
    description: 'Cómo recorrer el catálogo de rubros.',
    keywords: ['categoria', 'categorias', 'catalogo', 'rubro', 'rubros', 'navegar'],
    sections: [],
    steps: [
      {
        route: B,
        target: ['home-categories'],
        title: 'Los rubros principales',
        body: 'Cada categoría abre la solicitud con ese producto ya elegido. "Ver todo el catálogo" muestra el resto.',
      },
      {
        route: `${B}/solicitudes/nueva`,
        target: ['wizard-catalog'],
        title: 'El catálogo completo',
        body: 'Acá están todos los rubros disponibles. Elegí uno o varios: cada producto que agregues va a pedir sus propias especificaciones.',
      },
    ],
  },
  {
    id: 'buyer-request',
    audience: 'buyer',
    title: 'Crear una solicitud de cotización',
    description: 'Los pasos para pedir precio a varios proveedores.',
    keywords: ['solicitud', 'cotizacion', 'cotizar', 'pedir', 'precio', 'crear', 'nueva'],
    sections: [`${B}/solicitudes/nueva`],
    steps: [
      {
        route: B,
        target: ['buyer-cta'],
        title: 'Empezá desde cualquier pantalla',
        body: 'El botón de solicitar cotización te lleva al formulario. Lo recorremos ahora.',
      },
      {
        route: `${B}/solicitudes/nueva`,
        target: ['wizard-steps'],
        title: 'Cinco pasos',
        body: 'Productos, especificaciones, entrega, proveedores y resumen. Podés volver a un paso anterior sin perder lo cargado.',
      },
      {
        route: `${B}/solicitudes/nueva`,
        target: ['wizard-catalog'],
        title: 'Elegí qué cotizar',
        body: 'Seleccioná uno o más productos. Después completás medidas, material y cantidad de cada uno.',
      },
      {
        route: `${B}/solicitudes/nueva`,
        title: 'Y después',
        body: 'En el último paso revisás todo y enviás. La solicitud queda en "Mis solicitudes" y te avisamos cuando lleguen cotizaciones.',
      },
    ],
  },
  {
    id: 'buyer-compare',
    audience: 'buyer',
    title: 'Comparar cotizaciones recibidas',
    description: 'Dónde ver las respuestas y cómo elegir proveedor.',
    keywords: ['comparar', 'cotizaciones', 'respuestas', 'propuestas', 'adjudicar', 'elegir', 'oferta'],
    sections: [`${B}/cotizaciones`, `${B}/solicitudes`],
    steps: [
      {
        route: `${B}/cotizaciones`,
        target: ['quotes-list'],
        title: 'Tus cotizaciones',
        body: 'Cada fila es una solicitud que ya tiene respuestas, con cuántas propuestas recibió y la mejor oferta. Entrá para compararlas lado a lado.',
      },
      {
        route: `${B}/solicitudes`,
        target: ['requests-list'],
        title: 'El estado de cada solicitud',
        body: 'En Mis solicitudes ves cuáles esperan respuesta y cuáles ya tienen cotizaciones. Desde el detalle elegís al proveedor y adjudicás.',
      },
    ],
  },
  {
    id: 'buyer-orders',
    audience: 'buyer',
    title: 'Gestionar pedidos',
    description: 'Cómo seguir una compra desde la orden hasta la entrega.',
    keywords: ['pedido', 'pedidos', 'orden', 'entrega', 'seguimiento', 'estado', 'compra', 'recepcion'],
    sections: [`${B}/pedidos`],
    steps: [
      {
        route: `${B}/pedidos`,
        target: ['orders-list'],
        title: 'Tus pedidos',
        body: 'Cuando adjudicás una cotización se genera el pedido. Acá ves el proveedor, la etapa en la que está y la fecha de entrega prometida.',
      },
      {
        route: `${B}/panel`,
        target: ['panel-orders'],
        title: 'También en el Panel',
        body: 'El Panel muestra tus pedidos en curso con el avance de la entrega, para verlo de un vistazo.',
      },
    ],
  },
  {
    id: 'buyer-panel',
    audience: 'buyer',
    title: 'Usar el Panel de compras',
    description: 'Qué te muestra el resumen de gestión.',
    keywords: ['panel', 'resumen', 'tareas', 'pendientes', 'indicadores', 'gestion'],
    sections: [`${B}/panel`],
    steps: [
      {
        route: `${B}/panel`,
        target: ['panel-kpis'],
        title: 'Tus números',
        body: 'Solicitudes activas, cotizaciones recibidas, pedidos en curso y proveedores guardados. Cada uno abre su listado.',
      },
      {
        route: `${B}/panel`,
        target: ['panel-attention'],
        title: 'Qué requiere tu atención',
        body: 'Lo que tenés pendiente hoy: cotizaciones nuevas para revisar, pedidos por confirmar o solicitudes sin respuesta.',
      },
      {
        route: `${B}/panel`,
        target: ['panel-stages'],
        title: 'Tus solicitudes por etapa',
        body: 'Cuántas están en borrador, esperando cotizaciones, con respuestas, adjudicadas y completadas.',
      },
      {
        route: `${B}/panel`,
        target: ['panel-orders'],
        title: 'Pedidos en curso',
        body: 'El avance de cada entrega, del pedido emitido a la recepción.',
      },
    ],
  },

  /* ======================= VENTAS (vendedor y empresa) ======================= */
  {
    id: 'sales-welcome',
    audience: 'sales',
    welcome: true,
    title: 'Recorrido inicial',
    description: 'Un minuto para conocer tu panel de ventas.',
    keywords: ['inicio', 'empezar', 'recorrido', 'conocer', 'plataforma'],
    sections: [S],
    steps: [
      {
        route: S,
        title: '¡Hola! Soy ATARIA',
        body: 'Te muestro en un minuto cómo está armado tu panel de ventas. Podés avanzar, volver atrás o salir cuando quieras.',
      },
      {
        route: S,
        target: ['sales-tasks'],
        title: 'Tus tareas de hoy',
        body: 'Solicitudes nuevas por cotizar, clientes que esperan respuesta y cotizaciones que quedaron sin contestar. Cada fila te lleva a resolverla.',
      },
      {
        route: S,
        target: ['sales-activity'],
        title: 'Cómo viene tu actividad',
        body: 'Oportunidades activas, cotizaciones enviadas, pedidos en curso y ventas cerradas en los últimos 30 días.',
      },
      {
        route: S,
        target: ['sales-opportunities'],
        title: 'Oportunidades recientes',
        body: 'Las últimas solicitudes de compradores que podés cotizar, con cantidad, ubicación y estado.',
      },
      {
        route: S,
        target: ['nav-solicitudes'],
        title: 'Solicitudes',
        body: 'Acá llega todo lo que los compradores piden. El número indica cuántas tenés abiertas.',
      },
      {
        route: S,
        target: ['nav-cotizaciones', 'nav-more'],
        title: 'Cotizaciones',
        body: 'El seguimiento de tus propuestas: las que faltan responder, las enviadas y las aceptadas. En el celular está dentro de "Más".',
      },
      {
        route: S,
        target: ['assistant-fab'],
        title: 'Acá me encontrás',
        body: 'Quedo escondida en este borde. Tocame cuando quieras ver los tutoriales o repetir un recorrido.',
      },
    ],
  },
  {
    id: 'sales-requests',
    audience: 'sales',
    title: 'Revisar solicitudes recibidas',
    description: 'Cómo leer y filtrar lo que piden los compradores.',
    keywords: ['solicitud', 'solicitudes', 'recibidas', 'revisar', 'oportunidad', 'oportunidades', 'comprador'],
    sections: [`${S}/solicitudes`],
    steps: [
      {
        route: `${S}/solicitudes`,
        target: ['sales-requests-list'],
        title: 'Las solicitudes que te llegaron',
        body: 'Cada tarjeta muestra el producto, el comprador, la cantidad, la fecha límite y si ya la cotizaste. Arriba podés filtrar por estado y por categoría.',
      },
      {
        route: `${S}/solicitudes`,
        target: ['sales-request-detail'],
        title: 'El detalle',
        body: 'Al elegir una solicitud ves sus especificaciones completas. Desde acá enviás tu propuesta o le escribís al comprador.',
      },
    ],
  },
  {
    id: 'sales-quotes',
    audience: 'sales',
    title: 'Preparar y enviar cotizaciones',
    description: 'De la solicitud a la propuesta, y cómo seguirla.',
    keywords: ['cotizacion', 'cotizaciones', 'cotizar', 'propuesta', 'enviar', 'precio', 'responder'],
    sections: [`${S}/cotizaciones`],
    steps: [
      {
        route: `${S}/solicitudes`,
        target: ['sales-request-detail', 'sales-requests-list'],
        title: 'Empezá desde la solicitud',
        body: 'Abrí la solicitud que querés cotizar y usá "Enviar propuesta": cargás precio por producto, plazo y condiciones.',
      },
      {
        route: `${S}/cotizaciones`,
        target: ['sales-quotes-kpis'],
        title: 'Tus cotizaciones de un vistazo',
        body: 'Cuántas enviaste, cuántas te aceptaron y cuántas te faltan responder. Las que llevan más de 48 horas se marcan en rojo.',
      },
      {
        route: `${S}/cotizaciones`,
        target: ['sales-quotes-table'],
        title: 'El seguimiento',
        body: 'Filtrá por estado con las pestañas. "Cotizar" abre las que faltan responder y "Ver detalle" te muestra la propuesta enviada y el chat con el comprador.',
      },
    ],
  },
  {
    id: 'sales-clients-orders',
    audience: 'sales',
    title: 'Gestionar clientes y pedidos',
    description: 'Dónde ver a quién le vendés y cómo avanza cada pedido.',
    keywords: ['cliente', 'clientes', 'pedido', 'pedidos', 'entrega', 'produccion', 'historial'],
    sections: [`${S}/clientes`, `${S}/pedidos`],
    steps: [
      {
        route: `${S}/clientes`,
        target: ['sales-clients-kpis'],
        title: 'Tus clientes en números',
        body: 'Clientes totales, cotizaciones enviadas, pedidos concretados y volumen vendido.',
      },
      {
        route: `${S}/clientes`,
        target: ['sales-clients-table'],
        title: 'El detalle por cliente',
        body: 'Qué le cotizaste y qué te compró cada empresa. "Ver historial" abre todas sus operaciones.',
      },
      {
        route: `${S}/pedidos`,
        target: ['sales-orders'],
        title: 'Tus pedidos por etapa',
        body: 'Cada pedido avanza de pendiente a producción, tránsito y entregado. Actualizá la etapa para que el comprador la vea.',
      },
    ],
  },
  {
    id: 'sales-stats',
    audience: 'sales',
    title: 'Consultar estadísticas',
    description: 'Ventas, conversión y evolución mes a mes.',
    keywords: ['estadistica', 'estadisticas', 'reporte', 'reportes', 'ventas', 'conversion', 'informe', 'metricas'],
    sections: [`${S}/reportes`],
    steps: [
      {
        route: `${S}/reportes`,
        target: ['sales-stats-kpis'],
        title: 'Los indicadores del período',
        body: 'Ventas totales, cotizaciones enviadas, pedidos recibidos, tasa de conversión y clientes nuevos.',
      },
      {
        route: `${S}/reportes`,
        target: ['sales-stats-charts'],
        title: 'La evolución',
        body: 'Los gráficos comparan cotizaciones y pedidos mes a mes, y muestran qué categorías y clientes concentran tus ventas.',
      },
    ],
  },

  /* ============================== EMPRESA ============================== */
  {
    id: 'company-profile',
    audience: 'company',
    title: 'Completar el perfil comercial',
    description: 'Los datos de tu empresa que ven los compradores.',
    keywords: ['perfil', 'empresa', 'ficha', 'datos', 'completar', 'configuracion', 'logo', 'organizacion'],
    sections: [`${S}/configuracion`],
    steps: [
      {
        route: `${S}/configuracion`,
        target: ['settings-progress'],
        title: 'Qué tan completo está tu perfil',
        body: 'Un perfil completo aparece mejor ante los compradores. Desde acá también abrís la vista previa de tu perfil público.',
      },
      {
        route: `${S}/configuracion`,
        target: ['settings-tabs'],
        title: 'Las secciones',
        body: 'Información de la empresa, operación y logística, preferencias, notificaciones y seguridad. Los cambios se guardan con el botón de abajo.',
      },
      {
        route: `${S}/configuracion`,
        target: ['settings-preview'],
        title: 'Así te ven',
        body: 'Una vista resumida de tu perfil público, con los consejos que te faltan para completarlo.',
      },
    ],
  },
  {
    id: 'company-products',
    audience: 'company',
    title: 'Elegir qué productos ofrecés',
    description: 'Cómo indicar tus rubros para recibir solicitudes relevantes.',
    keywords: ['producto', 'productos', 'publicar', 'catalogo', 'categorias', 'rubros', 'ofrecer', 'administrar'],
    sections: [`${S}/catalogo`],
    steps: [
      {
        route: `${S}/configuracion`,
        target: ['settings-tabs'],
        title: 'Tus categorías',
        body: 'En la pestaña Preferencias marcás las categorías que ofrecés. Aparecen en tu perfil público y definen qué solicitudes te llegan.',
      },
      {
        route: `${S}/catalogo`,
        target: ['catalog-summary'],
        title: 'Cómo rinde cada rubro',
        body: 'El catálogo se arma con tu actividad: por cada categoría ves las cotizaciones, el ingreso y el plazo de entrega.',
      },
    ],
  },
  {
    id: 'company-team',
    audience: 'company',
    title: 'Gestionar tu equipo',
    description: 'Invitar vendedores y seguir su desempeño.',
    keywords: ['equipo', 'vendedor', 'vendedores', 'invitar', 'miembro', 'permisos', 'aprobar', 'asignar'],
    sections: [`${S}/equipo`],
    steps: [
      {
        route: `${S}/equipo`,
        target: ['team-invite'],
        title: 'Sumá vendedores',
        body: 'Invitá a alguien por nombre o email. Si un vendedor pide sumarse a tu empresa, lo aprobás desde esta misma pantalla.',
      },
      {
        route: `${S}/equipo`,
        target: ['team-kpis'],
        title: 'El equipo en números',
        body: 'Vendedores activos, solicitudes asignadas, cotizaciones enviadas y ventas ganadas.',
      },
      {
        route: `${S}/equipo`,
        target: ['team-table'],
        title: 'Cada vendedor',
        body: 'Su rol, su estado y cuántas oportunidades tiene, cotizó y ganó. Desde las acciones abrís su detalle.',
      },
    ],
  },
];

export function getTourProfile(pathname: string | null, isManager: boolean): TourProfile {
  if (pathname?.startsWith(B)) {
    return 'buyer';
  }
  return isManager ? 'company' : 'seller';
}

/** Recorridos disponibles para un perfil. La empresa ve los de ventas y los propios. */
export function getToursFor(profile: TourProfile): Tour[] {
  const audiences: TourAudience[] = profile === 'buyer' ? ['buyer'] : profile === 'company' ? ['sales', 'company'] : ['sales'];
  return TOURS.filter((tour) => audiences.includes(tour.audience));
}

export function getTour(id: string) {
  return TOURS.find((tour) => tour.id === id) ?? null;
}

export function getWelcomeTour(profile: TourProfile) {
  return getToursFor(profile).find((tour) => tour.welcome) ?? null;
}

/** Recorrido que explica la pantalla actual, si hay uno. */
export function getSectionTour(profile: TourProfile, pathname: string | null) {
  if (!pathname) {
    return null;
  }
  const tours = getToursFor(profile);
  return (
    tours.find((tour) => tour.sections.includes(pathname)) ??
    // Pantallas de detalle: sirve el recorrido de su listado.
    tours.find((tour) => tour.sections.some((section) => section.split('/').length > 3 && pathname.startsWith(`${section}/`))) ??
    null
  );
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Dos palabras se consideran la misma si comparten la raíz ("comparo" / "comparar"). */
function sameRoot(left: string, right: string) {
  const size = Math.min(left.length, right.length, 6);
  return size >= 4 && left.slice(0, size) === right.slice(0, size);
}

/** Mejor recorrido para una pregunta escrita ("¿cómo comparo cotizaciones?"). */
export function findTourForQuestion(profile: TourProfile, question: string) {
  const words = normalize(question).split(/[^a-z0-9]+/).filter((word) => word.length > 3);
  let best: { tour: Tour; score: number } | null = null;
  for (const tour of getToursFor(profile)) {
    // Cuenta cuántas palabras de la pregunta aparecen entre las del tutorial.
    const score = words.filter((word) => tour.keywords.some((keyword) => sameRoot(word, keyword))).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { tour, score };
    }
  }
  return best?.tour ?? null;
}
