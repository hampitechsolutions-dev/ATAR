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

/** 'seller' = solo quien entra como vendedor (por ejemplo, "Mis empresas"). */
export type TourAudience = 'buyer' | 'sales' | 'seller' | 'company';

/** Perfil de quien mira: define qué recorridos se ofrecen. */
export type TourProfile = 'buyer' | 'seller' | 'company';

export type TourStep = {
  /**
   * Ruta donde vive el paso. Si no es la actual, el recorrido navega hasta ahí.
   * Terminada en `/*` es una pantalla de detalle (una solicitud, un pedido): vale
   * para cualquiera, y el paso se saltea si no hay una abierta.
   */
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

  /* ---------------- Comprador: el resto de las pantallas ---------------- */
  {
    id: 'buyer-request-detail',
    audience: 'buyer',
    title: 'Entender el detalle de una solicitud',
    description: 'Qué pediste, qué te cotizaron y cómo asignar la compra.',
    keywords: ['detalle', 'solicitud', 'asignar', 'adjudicar', 'editar', 'cancelar', 'orden', 'emitir', 'recepcion', 'confirmar'],
    sections: [`${B}/solicitudes/*`],
    steps: [
      {
        route: `${B}/solicitudes/*`,
        target: ['request-main'],
        title: 'Tu solicitud',
        body: 'Arriba, el código y el estado. Después, los productos que pediste y las cotizaciones recibidas: en cada una ves precio, plazo y condiciones, y con "Asignar compra" elegís al proveedor. El resto de las cotizaciones queda rechazado.',
      },
      {
        route: `${B}/solicitudes/*`,
        target: ['request-main'],
        title: 'Acciones',
        body: 'Con el botón "Acciones" podés editar la solicitud, descargar la hoja de especificaciones o cancelarla. Cuando ya asignaste la compra, acá mismo emitís la orden y, al recibir la mercadería, confirmás la recepción.',
      },
      {
        route: `${B}/solicitudes/*`,
        target: ['request-suppliers'],
        title: 'Proveedores seleccionados',
        body: 'A quiénes les llegó tu solicitud y cuáles ya cotizaron. Con "Agregar más proveedores" la mandás a otros.',
      },
      {
        route: `${B}/solicitudes/*`,
        target: ['request-history'],
        title: 'Historial',
        body: 'Todo lo que pasó con esta solicitud, en orden: cuándo se publicó, quién cotizó y cada cambio de estado.',
      },
    ],
  },
  {
    id: 'buyer-quote-detail',
    audience: 'buyer',
    title: 'Leer una cotización',
    description: 'La propuesta de un proveedor y el chat con él.',
    keywords: ['cotizacion', 'propuesta', 'detalle', 'chat', 'negociar', 'precio', 'plazo', 'proveedor'],
    sections: [`${B}/cotizaciones/*`],
    steps: [
      {
        route: `${B}/cotizaciones/*`,
        target: ['quote-header'],
        title: 'Qué cotización es',
        body: 'El producto, el código de tu solicitud y la fecha en que la creaste.',
      },
      {
        route: `${B}/cotizaciones/*`,
        target: ['quote-metrics'],
        title: 'Los números de la propuesta',
        body: 'Quién cotiza, el monto total, el plazo de entrega, el estado y la fecha de cierre de tu solicitud. Si el proveedor cargó validez o pedido mínimo, también aparecen acá.',
      },
      {
        route: `${B}/cotizaciones/*`,
        target: ['quote-chat'],
        title: 'Hablá con el proveedor',
        body: 'El chat de esta cotización. Usalo para pedir aclaraciones o negociar antes de decidir. Al lado tenés el detalle de la propuesta y el botón "Asignar compra".',
      },
      {
        route: `${B}/cotizaciones/*`,
        target: ['quote-timeline'],
        title: 'En qué etapa está',
        body: 'El camino de la cotización, de la solicitud enviada a la aceptación.',
      },
    ],
  },
  {
    id: 'buyer-supplier-profile',
    audience: 'buyer',
    title: 'Conocer la ficha de un proveedor',
    description: 'Qué ofrece una empresa y cómo contactarla.',
    keywords: ['ficha', 'perfil', 'proveedor', 'empresa', 'contactar', 'certificaciones', 'logistica'],
    sections: [`${B}/proveedores/*`],
    steps: [
      {
        route: `${B}/proveedores/*`,
        title: 'La ficha del proveedor',
        body: 'Reúne lo que la empresa cargó sobre sí misma: qué produce, cómo entrega y con qué condiciones trabaja. Desde acá le escribís por el chat o le pedís una cotización.',
      },
      {
        route: `${B}/proveedores/*`,
        target: ['supplier-header'],
        title: 'Quién es',
        body: 'Nombre, ubicación y si está verificada.',
      },
      {
        route: `${B}/proveedores/*`,
        target: ['supplier-tabs'],
        title: 'Las secciones',
        body: 'Usá las pestañas para saltar entre Resumen, Productos, Ficha técnica y Ubicación.',
      },
    ],
  },
  {
    id: 'buyer-favorites',
    audience: 'buyer',
    title: 'Usar tus favoritos',
    description: 'Los proveedores que guardaste.',
    keywords: ['favorito', 'favoritos', 'guardar', 'guardados', 'corazon'],
    sections: [`${B}/favoritos`],
    steps: [
      {
        route: `${B}/favoritos`,
        target: ['favorites-list'],
        title: 'Tus proveedores guardados',
        body: 'Los que marcaste con el corazón en el directorio o en su ficha. Desde acá abrís su ficha o les pedís una cotización. Se guardan en este navegador.',
      },
    ],
  },
  {
    id: 'buyer-messages',
    audience: 'buyer',
    title: 'Chatear con proveedores',
    description: 'Dónde están tus conversaciones.',
    keywords: ['mensaje', 'mensajes', 'chat', 'chatear', 'escribir', 'conversacion', 'hablar'],
    sections: [`${B}/mensajes`],
    steps: [
      {
        route: `${B}/mensajes`,
        target: ['messages-list'],
        title: 'Tus conversaciones',
        body: 'Una por cada proveedor y tema. Con las pestañas ves todas o solo las que tienen mensajes sin leer, y podés buscar por empresa.',
      },
      {
        route: `${B}/mensajes`,
        target: ['messages-chat'],
        title: 'El chat',
        body: 'Elegí una conversación para leerla y responder. Las conversaciones nacen desde una cotización o desde la ficha de un proveedor.',
      },
    ],
  },
  {
    id: 'buyer-notifications',
    audience: 'buyer',
    title: 'Revisar tus notificaciones',
    description: 'Los avisos de cotizaciones, mensajes y pedidos.',
    keywords: ['notificacion', 'notificaciones', 'aviso', 'avisos', 'alerta', 'alertas'],
    sections: [`${B}/notificaciones`],
    steps: [
      {
        route: `${B}/notificaciones`,
        target: ['notifications-summary'],
        title: 'Cuántas tenés',
        body: 'El total reciente y cuántas están sin leer. Con "Marcar todo como leído" las despejás de una vez.',
      },
      {
        route: `${B}/notificaciones`,
        target: ['notifications-list'],
        title: 'Tus avisos',
        body: 'Cada aviso te cuenta qué pasó: una cotización nueva, un mensaje o un cambio en un pedido. Las nuevas se distinguen de las ya leídas.',
      },
    ],
  },
  {
    id: 'buyer-settings',
    audience: 'buyer',
    title: 'Configurar tu cuenta',
    description: 'Tus datos, preferencias y cierre de sesión.',
    keywords: ['configuracion', 'configurar', 'cuenta', 'preferencias', 'sesion', 'cerrar', 'ajustes'],
    sections: [`${B}/configuracion`],
    steps: [
      {
        route: `${B}/configuracion`,
        target: ['settings-account'],
        title: 'Tu cuenta',
        body: 'La empresa y el usuario con los que estás trabajando.',
      },
      {
        route: `${B}/configuracion`,
        target: ['settings-preferences'],
        title: 'Preferencias',
        body: 'Activá o desactivá las notificaciones y la vista compacta, y elegí tu categoría preferida. Se guardan en este navegador.',
      },
      {
        route: `${B}/configuracion`,
        target: ['settings-links'],
        title: 'Accesos y cierre de sesión',
        body: 'Atajos a las secciones de tu cuenta y el botón para cerrar sesión.',
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
    sections: [`${S}/clientes`],
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

  /* ---------------- Ventas: el resto de las pantallas ---------------- */
  {
    id: 'sales-request-detail',
    audience: 'sales',
    title: 'Cotizar una solicitud paso a paso',
    description: 'Cómo leer lo que piden y armar tu cotización.',
    keywords: ['cotizar', 'cotizacion', 'solicitud', 'detalle', 'precio', 'alternativa', 'disponible', 'enviar', 'editar', 'unitario'],
    sections: [`${S}/solicitudes/*`],
    steps: [
      {
        route: `${S}/solicitudes/*`,
        target: ['rq-buyer'],
        title: 'Quién te pide',
        body: 'La empresa compradora. Con "Contactar al comprador" abrís un chat para sacarte dudas antes de cotizar.',
      },
      {
        route: `${S}/solicitudes/*`,
        target: ['rq-delivery'],
        title: 'Entrega y condiciones',
        body: 'Para cuándo lo necesita, dónde se entrega y, si lo informó, su presupuesto estimado.',
      },
      {
        route: `${S}/solicitudes/*`,
        target: ['rq-products'],
        title: 'Qué te piden',
        body: 'Cada producto con su cantidad y sus especificaciones: material, medidas, terminaciones. Leelas antes de poner precio.',
      },
      {
        route: `${S}/solicitudes/*`,
        target: ['rq-form', 'rq-actions'],
        title: 'Tu cotización',
        body: 'Por cada producto elegí "Cotizo" y cargá el precio por unidad: el subtotal y el total se calculan solos. "Alternativa" es para ofrecer un reemplazo y "No disponible" para avisar que no lo tenés; en ambos casos podés dejar una nota. En el celular, el formulario se abre con "Enviar cotización".',
      },
      {
        route: `${S}/solicitudes/*`,
        target: ['rq-form', 'rq-actions'],
        title: 'Condiciones y envío',
        body: 'Cantidad mínima, días de entrega y condiciones de pago vienen de tu perfil y se pueden ajustar para esta cotización. Sumá validez y observaciones si hace falta, y enviá. Mientras el comprador no decida, podés volver y actualizarla.',
      },
    ],
  },
  {
    id: 'sales-quote-detail',
    audience: 'sales',
    title: 'Seguir una cotización enviada',
    description: 'Qué pidió el cliente, qué cotizaste y el chat.',
    keywords: ['cotizacion', 'enviada', 'detalle', 'seguir', 'editar', 'chat', 'cliente', 'propuesta'],
    sections: [`${S}/cotizaciones/*`],
    steps: [
      {
        route: `${S}/cotizaciones/*`,
        target: ['sq-summary'],
        title: 'El resumen',
        body: 'Comprador, monto total, plazo, estado y, si los cargaste, condiciones de pago y validez.',
      },
      {
        route: `${S}/cotizaciones/*`,
        target: ['sq-requested'],
        title: 'Lo que pidió el cliente',
        body: 'Los productos, cantidades y especificaciones de la solicitud original, para tenerlos a la vista.',
      },
      {
        route: `${S}/cotizaciones/*`,
        target: ['sq-quoted'],
        title: 'Lo que cotizaste',
        body: 'Tu precio por producto, el total y tus observaciones. Mientras la cotización esté enviada, el botón "Editar cotización" te lleva al formulario con tus datos cargados.',
      },
      {
        route: `${S}/cotizaciones/*`,
        target: ['sq-chat'],
        title: 'El chat con el comprador',
        body: 'Respondé consultas y negociá sin salir de la cotización.',
      },
    ],
  },
  {
    id: 'sales-orders',
    audience: 'sales',
    title: 'Gestionar pedidos y avanzar su estado',
    description: 'Cómo mover un pedido de pendiente a entregado.',
    keywords: ['pedido', 'pedidos', 'estado', 'avanzar', 'confirmar', 'produccion', 'transito', 'entregado', 'orden', 'adjudicada'],
    sections: [`${S}/pedidos`],
    steps: [
      {
        route: `${S}/pedidos`,
        target: ['sales-orders'],
        title: 'Tus pedidos por etapa',
        body: 'Cada cotización que te adjudican aparece acá. En escritorio se ordenan en columnas: Pendientes, Producción, En tránsito y Entregados. En el celular, en pestañas.',
      },
      {
        route: `${S}/pedidos`,
        target: ['sales-orders'],
        title: 'Avanzá el estado',
        body: 'El botón de cada tarjeta da el siguiente paso: Confirmar pedido, Iniciar producción, Marcar en tránsito y Marcar entregado. El comprador ve cada cambio y recibe un aviso. Los estados solo avanzan, así que revisá antes de tocar.',
      },
      {
        route: `${S}/pedidos`,
        target: ['sales-orders'],
        title: 'Buscar y abrir',
        body: 'Arriba filtrás por cliente o buscás por número de orden. "Ver detalle" abre el pedido con su línea de tiempo, sus datos y el acceso al chat.',
      },
    ],
  },
  {
    id: 'sales-order-detail',
    audience: 'sales',
    title: 'Entender el detalle de un pedido',
    description: 'La línea de tiempo y los datos de la orden.',
    keywords: ['pedido', 'detalle', 'orden', 'linea', 'tiempo', 'documentos', 'entrega'],
    sections: [`${S}/pedidos/*`],
    steps: [
      {
        route: `${S}/pedidos/*`,
        target: ['order-timeline'],
        title: 'En qué etapa está',
        body: 'La línea de tiempo del pedido: emitido, confirmado, en producción, despachado y entregado.',
      },
      {
        route: `${S}/pedidos/*`,
        target: ['order-info'],
        title: 'Los datos de la orden',
        body: 'Cliente, producto, total, entrega estimada y dirección.',
      },
      {
        route: `${S}/pedidos/*`,
        target: ['order-docs'],
        title: 'Documentos',
        body: 'Si el pedido tiene documentos adjuntos, se listan acá.',
      },
      {
        route: `${S}/pedidos/*`,
        target: ['order-action'],
        title: 'El siguiente paso',
        body: 'Este botón avanza el pedido a la etapa que sigue. Desaparece cuando el pedido ya fue entregado.',
      },
    ],
  },
  {
    id: 'sales-messages',
    audience: 'sales',
    title: 'Chatear con tus clientes',
    description: 'Dónde están tus conversaciones.',
    keywords: ['mensaje', 'mensajes', 'chat', 'chatear', 'escribir', 'conversacion', 'responder'],
    sections: [`${S}/mensajes`],
    steps: [
      {
        route: `${S}/mensajes`,
        target: ['messages-list'],
        title: 'Tus conversaciones',
        body: 'Una por cada comprador y tema. Con las pestañas ves todas o solo las que tienen mensajes sin leer.',
      },
      {
        route: `${S}/mensajes`,
        target: ['messages-chat'],
        title: 'El chat',
        body: 'Elegí una conversación para leerla y responder. También podés abrir un chat desde una solicitud o una cotización.',
      },
    ],
  },
  {
    id: 'sales-notifications',
    audience: 'sales',
    title: 'Revisar tus notificaciones',
    description: 'Avisos de solicitudes, adjudicaciones y pedidos.',
    keywords: ['notificacion', 'notificaciones', 'aviso', 'avisos', 'alerta', 'push'],
    sections: [`${S}/notificaciones`],
    steps: [
      {
        route: `${S}/notificaciones`,
        target: ['notifications-summary'],
        title: 'Cuántas tenés',
        body: 'Recientes, sin leer y adjudicadas. Con "Marcar todo como leído" las despejás de una vez.',
      },
      {
        route: `${S}/notificaciones`,
        target: ['notifications-push'],
        title: 'Avisos al instante',
        body: 'Activá las notificaciones push para enterarte de mensajes, cotizaciones y pedidos aunque no tengas ATAR abierto.',
      },
      {
        route: `${S}/notificaciones`,
        target: ['notifications-list'],
        title: 'Tus avisos',
        body: 'Cada aviso dice qué pasó y, con "Ver detalle", te lleva a la solicitud o al pedido correspondiente.',
      },
    ],
  },
  {
    id: 'sales-opportunities',
    audience: 'sales',
    title: 'Explorar oportunidades',
    description: 'Las solicitudes abiertas del marketplace.',
    keywords: ['oportunidad', 'oportunidades', 'pipeline', 'abiertas', 'marketplace'],
    sections: [`${S}/oportunidades`],
    steps: [
      {
        route: `${S}/oportunidades`,
        target: ['opportunities-list'],
        title: 'Oportunidades abiertas',
        body: 'Las solicitudes disponibles para cotizar, con su producto, especificaciones, comprador y fecha límite. Podés buscar por comprador, categoría o descripción.',
      },
    ],
  },
  {
    id: 'seller-companies',
    audience: 'seller',
    title: 'Representar a varias empresas',
    description: 'Cómo sumarte a otra proveedora.',
    keywords: ['empresa', 'empresas', 'representar', 'sumarme', 'unirme', 'proveedora', 'trabajar'],
    sections: [`${S}/empresas`],
    steps: [
      {
        route: `${S}/empresas`,
        target: ['companies-mine'],
        title: 'Empresas que representás',
        body: 'Las proveedoras para las que vendés. Con "Trabajar acá" elegís con cuál operar; las solicitudes y cotizaciones que ves corresponden a la empresa activa.',
      },
      {
        route: `${S}/empresas`,
        target: ['companies-join'],
        title: 'Sumarte a otra empresa',
        body: 'Buscá la proveedora y enviale tu pedido. Se suma a tu cuenta cuando su administrador lo aprueba.',
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
  {
    id: 'company-production',
    audience: 'company',
    title: 'Seguir la producción',
    description: 'El avance operativo de cada orden.',
    keywords: ['produccion', 'avance', 'operativo', 'fabricacion', 'orden'],
    sections: [`${S}/produccion`],
    steps: [
      {
        route: `${S}/produccion`,
        target: ['production-kpis'],
        title: 'Cómo viene la producción',
        body: 'Cuántas órdenes están pendientes, en proceso y entregadas.',
      },
      {
        route: `${S}/produccion`,
        target: ['production-list'],
        title: 'Orden por orden',
        body: 'Cada orden adjudicada con su etapa, su avance y la entrega estimada. Para cambiar la etapa, usá la pantalla Pedidos.',
      },
    ],
  },
  {
    id: 'company-reviews',
    audience: 'company',
    title: 'Ver tus calificaciones',
    description: 'El rating y las operaciones adjudicadas.',
    keywords: ['resena', 'resenas', 'calificacion', 'calificaciones', 'rating', 'estrellas', 'reputacion'],
    sections: [`${S}/resenas`],
    steps: [
      {
        route: `${S}/resenas`,
        target: ['reviews-kpis'],
        title: 'Tu reputación',
        body: 'Cuántas cotizaciones te adjudicaron, cuántas tienen orden emitida y el monto adjudicado. El rating general aparece cuando tengas calificaciones.',
      },
      {
        route: `${S}/resenas`,
        target: ['reviews-list'],
        title: 'Operaciones adjudicadas',
        body: 'El detalle de cada operación ganada, con su comprador, monto y número de orden.',
      },
    ],
  },
  {
    id: 'company-member',
    audience: 'company',
    title: 'Ver el detalle de un vendedor',
    description: 'El desempeño y las solicitudes de cada persona.',
    keywords: ['vendedor', 'detalle', 'desempeno', 'asignadas', 'conversion'],
    sections: [`${S}/equipo/*`],
    steps: [
      {
        route: `${S}/equipo/*`,
        target: ['member-header'],
        title: 'Cómo le va',
        body: 'Sus solicitudes asignadas, pendientes, cotizadas y ganadas, su tasa de conversión y el volumen que vendió.',
      },
      {
        route: `${S}/equipo/*`,
        target: ['member-groups'],
        title: 'En qué está trabajando',
        body: 'Sus solicitudes agrupadas en tres bloques: en curso, cotizadas y en negociación, y cerradas. Cada una abre su detalle.',
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
  const audiences: TourAudience[] = profile === 'buyer' ? ['buyer'] : profile === 'company' ? ['sales', 'company'] : ['sales', 'seller'];
  return TOURS.filter((tour) => audiences.includes(tour.audience));
}

export function getTour(id: string) {
  return TOURS.find((tour) => tour.id === id) ?? null;
}

export function getWelcomeTour(profile: TourProfile) {
  return getToursFor(profile).find((tour) => tour.welcome) ?? null;
}

/** ¿La ruta del paso corresponde a la pantalla actual? */
export function matchesRoute(route: string, pathname: string | null) {
  if (!pathname) {
    return false;
  }
  if (!route.endsWith('/*')) {
    return route === pathname;
  }
  const base = route.slice(0, -2);
  const rest = pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1) : '';
  // Un solo segmento después de la base: /solicitudes/<id>, no /solicitudes/<id>/algo.
  return rest.length > 0 && !rest.includes('/');
}

/** Recorrido que explica la pantalla actual, si hay uno. */
export function getSectionTour(profile: TourProfile, pathname: string | null) {
  if (!pathname) {
    return null;
  }
  const tours = getToursFor(profile);
  return (
    // Primero la pantalla exacta; después, el instructivo de su detalle.
    tours.find((tour) => tour.sections.includes(pathname)) ??
    tours.find((tour) => tour.sections.some((section) => section.endsWith('/*') && matchesRoute(section, pathname))) ??
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
