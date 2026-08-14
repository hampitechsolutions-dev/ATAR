export type MembershipRole = 'ADMIN' | 'BUYER' | 'SUPPLIER' | 'SELLER';
export type CompanyType = 'BUYER' | 'SUPPLIER' | 'HYBRID';
export type RequestStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REVIEWING'
  | 'AWARDED'
  | 'NEGOTIATING'
  | 'ORDER_ISSUED'
  | 'CANCELLED';
export type QuoteStatus = 'DRAFT' | 'SUBMITTED' | 'AWARDED' | 'REJECTED' | 'WITHDRAWN';

/** Pipeline comercial de una solicitud dentro de una empresa proveedora. */
export type OpportunityStatus =
  | 'NEW'
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'IN_RESPONSE'
  | 'QUOTED'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST';

export type UserMembership = {
  id: string;
  role: MembershipRole;
  isPrimary: boolean;
  company: {
    id: string;
    name: string;
    type: CompanyType;
    country: string;
    city: string | null;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  memberships: UserMembership[];
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RequestEventRecord = {
  id: string;
  type:
    | 'REQUEST_CREATED'
    | 'QUOTE_SUBMITTED'
    | 'QUOTE_UPDATED'
    | 'REQUEST_AWARDED'
    | 'NEGOTIATION_STARTED'
    | 'ORDER_ISSUED'
    | 'ORDER_UPDATED'
    | 'ORDER_CONFIRMED'
    | 'PRODUCTION_STARTED'
    | 'ORDER_DISPATCHED'
    | 'ORDER_DELIVERED';
  title: string;
  detail: string | null;
  actorRole: MembershipRole | null;
  actorCompanyName: string | null;
  createdAt: string;
};

export type OrderFulfillmentStatus =
  | 'ISSUED'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'DISPATCHED'
  | 'DELIVERED';

export type PurchaseOrderRecord = {
  id: string;
  requestId: string;
  orderNumber: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  issuedAt: string;
  promisedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestRecord = {
  id: string;
  title: string;
  productName?: string | null;
  description: string;
  category: string;
  quantityRequested?: number | null;
  referenceUnitPrice?: number | null;
  estimatedTotalCost?: number | null;
  preferredSupplierName?: string | null;
  status: RequestStatus;
  awardedQuoteId?: string | null;
  privateRequest: boolean;
  dueDate: string | null;
  buyerCompanyId: string;
  buyerCompany?: {
    id: string;
    name: string;
    type: CompanyType;
    country: string;
    city: string | null;
  };
  _count?: {
    quotes: number;
  };
  awardedQuote?: QuoteRecord | null;
  order?: PurchaseOrderRecord | null;
  events?: RequestEventRecord[];
  quotes?: QuoteRecord[];
  createdAt: string;
  updatedAt: string;
};

export type QuoteRecord = {
  id: string;
  requestId: string;
  supplierCompanyId: string;
  amount: number | null;
  currency: string;
  leadTimeDays: number | null;
  paymentTerms: string | null;
  technicalComment: string | null;
  status: QuoteStatus;
  supplierCompany?: {
    id: string;
    name: string;
    type: CompanyType;
    country: string;
    city: string | null;
  };
  request?: RequestRecord;
  createdAt: string;
  updatedAt: string;
};

/** Empresa en la que trabaja el usuario, con su rol dentro de ella. */
export type WorkspaceRecord = {
  companyId: string;
  company: {
    id: string;
    name: string;
    type: CompanyType;
    country: string;
    city: string | null;
  };
  roles: MembershipRole[];
  isPrimary: boolean;
  isSeller: boolean;
  isManager: boolean;
  canSell: boolean;
  canBuy: boolean;
};

export type AssignmentSeller = {
  id: string;
  name: string;
  email: string;
};

/** Oportunidad: la solicitud vista desde la bandeja de la proveedora. */
export type RequestAssignmentRecord = {
  id: string;
  requestId: string;
  supplierCompanyId: string;
  status: OpportunityStatus;
  notes: string | null;
  assignedAt: string | null;
  lastSellerViewAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller: AssignmentSeller | null;
  request: RequestRecord;
  quote: QuoteRecord | null;
};

export type TeamMemberRecord = {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: MembershipRole[];
  isManager: boolean;
  assigned: number;
  pending: number;
  quoted: number;
  won: number;
  conversionRate: number;
  quotedAmount: number;
  wonAmount: number;
};

export type SupplierMetricsRecord = {
  companyId: string;
  scope: 'company' | 'seller';
  received: number;
  unassigned: number;
  assigned: number;
  inResponse: number;
  quoted: number;
  negotiating: number;
  won: number;
  lost: number;
  quotesSent: number;
  quotesAwarded: number;
  quotedAmount: number;
  soldAmount: number;
};

export type CustomerRecord = {
  companyId: string;
  name: string;
  location: string;
  quotesCount: number;
  ordersCount: number;
  requestsCount: number;
  quotedAmount: number;
  purchasedAmount: number;
  purchasedUnits: number;
  lastPurchaseAt: string | null;
  lastQuoteAt: string | null;
  lastProduct: string | null;
  lastQuotedProduct: string | null;
  sellers: { id: string; name: string }[];
  daysSinceLastPurchase: number | null;
  daysSinceLastQuote: number | null;
};

export type CustomerDetailRecord = {
  company: {
    id: string;
    name: string;
    country: string;
    city: string | null;
    type: CompanyType;
  };
  quotes: Array<{
    id: string;
    amount: number | null;
    currency: string;
    status: QuoteStatus;
    createdAt: string;
    requestId: string;
    requestTitle: string;
    category: string;
    quantity: number | null;
    order: PurchaseOrderRecord | null;
    seller: { id: string; name: string } | null;
  }>;
};

/** Señal comercial: recompra, seguimiento o postventa. */
export type CommercialOpportunityRecord = {
  type: 'REPURCHASE' | 'FOLLOW_UP' | 'AFTER_SALES';
  companyId: string;
  companyName: string;
  product: string | null;
  days: number | null;
  units: number;
  amount: number;
  seller: { id: string; name: string } | null;
};

export type InboxQuery = {
  status?: OpportunityStatus;
  sellerUserId?: string;
  search?: string;
  privateOnly?: boolean;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Solo para cliente y empresa: el vendedor se suma a una empresa existente. */
  companyName?: string;
  companyType?: CompanyType;
  /** Solo para vendedor: empresa a la que pide sumarse. */
  companyId?: string;
  role: Extract<MembershipRole, 'BUYER' | 'SUPPLIER' | 'SELLER'>;
};

export type SupplierDirectoryCompany = {
  id: string;
  name: string;
  city: string | null;
  country: string;
  type: CompanyType;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CreateRequestPayload = {
  title: string;
  productName?: string;
  description: string;
  category: string;
  quantityRequested?: number;
  referenceUnitPrice?: number;
  estimatedTotalCost?: number;
  preferredSupplierName?: string;
  privateRequest?: boolean;
  dueDate?: string;
  status?: Extract<RequestStatus, 'DRAFT' | 'PUBLISHED'>;
};

export type CreateQuotePayload = {
  amount?: number;
  currency?: string;
  leadTimeDays?: number;
  paymentTerms?: string;
  technicalComment?: string;
};

export type AwardQuotePayload = {
  quoteId: string;
};

export type ProgressRequestPayload = {
  action: 'START_NEGOTIATION' | 'ISSUE_ORDER';
};

export type UpsertOrderPayload = {
  orderNumber?: string;
  promisedDate?: string;
  notes?: string;
  fulfillmentStatus?: OrderFulfillmentStatus;
};

export type UpdateFulfillmentPayload = {
  action:
    | 'CONFIRM_ORDER'
    | 'START_PRODUCTION'
    | 'MARK_DISPATCHED'
    | 'MARK_DELIVERED';
};

export type ConversationContextType = 'PRODUCT' | 'REQUEST' | 'QUOTE';
export type NotificationType =
  | 'QUOTE_SUBMITTED'
  | 'QUOTE_UPDATED'
  | 'QUOTE_AWARDED'
  | 'QUOTE_REJECTED'
  | 'NEGOTIATION_STARTED'
  | 'ORDER_ISSUED'
  | 'ORDER_UPDATED'
  | 'FULFILLMENT_UPDATED'
  | 'NEW_MESSAGE';
export type NotificationEmailStatus = 'PENDING' | 'SENT' | 'SKIPPED' | 'FAILED';
export type PushChannel = 'WEB' | 'MOBILE_EXPO';

export type ConversationMessageRecord = {
  id: string;
  body: string;
  senderRole: MembershipRole;
  senderCompanyName: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  attachmentBase64?: string | null;
  emailNotificationQueuedAt?: string | null;
  createdAt: string;
  buyerReadAt?: string | null;
  supplierReadAt?: string | null;
};

export type ConversationRecord = {
  id: string;
  contextType: ConversationContextType;
  contextTitle: string;
  requestId?: string | null;
  quoteId?: string | null;
  buyerCompanyId: string;
  buyerCompanyName: string;
  supplierCompanyId: string;
  supplierCompanyName: string;
  lastMessageAt?: string | null;
  unreadCount: number;
  request?: {
    id: string;
    title: string;
    productName?: string | null;
    category: string;
    buyerCompanyId: string;
  } | null;
  quote?: {
    id: string;
    requestId: string;
    supplierCompanyId: string;
  } | null;
  lastMessage?: {
    id: string;
    body: string;
    createdAt: string;
    senderRole: MembershipRole;
    senderCompanyName: string | null;
  } | null;
  messages?: ConversationMessageRecord[];
};

export type CreateProductConversationPayload = {
  productName: string;
  supplierCompanyName: string;
};

export type ListConversationsParams = {
  contextType?: ConversationContextType;
  search?: string;
  from?: string;
  to?: string;
};

export type ListConversationMessagesParams = {
  search?: string;
  from?: string;
  to?: string;
};

export type SendConversationMessagePayload = {
  body?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
  attachmentBase64?: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  companyId: string;
  type: NotificationType;
  title: string;
  detail?: string | null;
  href?: string | null;
  metadata?: unknown;
  readAt?: string | null;
  emailStatus: NotificationEmailStatus;
  emailSentAt?: string | null;
  emailError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationsResponse = {
  items: NotificationRecord[];
  unreadCount: number;
};

export type PushConfigResponse = {
  webPushEnabled: boolean;
  webPushPublicKey: string | null;
};

export type RegisterPushEndpointPayload = {
  channel: PushChannel;
  endpoint: string;
  payload?: Record<string, unknown>;
  userAgent?: string;
  deviceName?: string;
};

export type SupplierDirectoryRecord = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string;
  companyType: CompanyType;
  description: string | null;
  genericCode: string | null;
  leadTimeDays: number | null;
  minimumOrder: number | null;
  tags: string[];
};

export type RequestCatalogFieldType =
  | 'choices'
  | 'segmented'
  | 'input'
  | 'quantity'
  | 'uploader'
  | 'textarea';

export type RequestCatalogInputType = 'text' | 'date';

export type RequestCatalogFieldRecord = {
  id: string;
  label: string;
  type: RequestCatalogFieldType;
  options: string[];
  placeholder: string | null;
  helper: string | null;
  required: boolean;
  fullWidth: boolean;
  inputType: RequestCatalogInputType | null;
};

export type RequestCatalogCategoryRecord = {
  id: string;
  label: string;
  subtitle: string | null;
  imageSrc: string | null;
  imageClassName: string | null;
  searchKeywords: string[];
  fields: RequestCatalogFieldRecord[];
};

export type MarketplaceStatsRecord = {
  suppliersCount: number;
  buyersCount: number;
  requestsCount: number;
  ordersCount: number;
  topCategories: Array<{
    label: string;
    requestCount: number;
  }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export const ACTIVE_COMPANY_STORAGE_KEY = 'atar.activeCompanyId';

/**
 * Empresa con la que el usuario esta trabajando. Un vendedor puede representar
 * a varias proveedoras: el valor viaja en cada request como `x-company-id`
 * para que la API devuelva solo el contexto de esa empresa.
 */
let activeCompanyId: string | null = null;

export function setActiveCompanyId(companyId: string | null) {
  activeCompanyId = companyId;

  if (typeof window === 'undefined') {
    return;
  }

  if (companyId) {
    window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, companyId);
  } else {
    window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
  }
}

export function getActiveCompanyId(): string | null {
  if (activeCompanyId) {
    return activeCompanyId;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  activeCompanyId = window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
  return activeCompanyId;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload.message || payload.error || 'No se pudo completar la solicitud.';

    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, response.status);
  }

  return payload as T;
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(getActiveCompanyId() ? { 'X-Company-Id': getActiveCompanyId() as string } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    return parseResponse<T>(response);
  } catch (error) {
    const hint = `No se pudo conectar a la API (${API_URL}). Asegurate de levantar @atar/api y/o configurar NEXT_PUBLIC_API_URL correctamente.`;
    throw new ApiError(error instanceof Error ? `${hint} ${error.message}` : hint, 0);
  }
}

function buildQuery(params?: Record<string, string | undefined>) {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const atarApi = {
  login(payload: LoginPayload) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  register(payload: RegisterPayload) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  me(token: string) {
    return request<AuthUser>('/auth/me', undefined, token);
  },
  getSuppliers(token: string) {
    return request<SupplierDirectoryRecord[]>('/users/suppliers', undefined, token);
  },
  getMarketplaceSuppliers() {
    return request<SupplierDirectoryRecord[]>('/catalog/suppliers');
  },
  getMarketplaceStats() {
    return request<MarketplaceStatsRecord>('/catalog/stats');
  },
  getRequestCategories() {
    return request<RequestCatalogCategoryRecord[]>('/catalog/request-categories');
  },
  getMarketplaceSupplierBySlug(slug: string) {
    return request<SupplierDirectoryRecord>(`/catalog/suppliers/${slug}`);
  },
  getBuyerRequests(token: string) {
    return request<RequestRecord[]>('/requests/mine', undefined, token);
  },
  createRequest(payload: CreateRequestPayload, token: string) {
    return request<RequestRecord>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  getRequestDetail(requestId: string, token: string) {
    return request<RequestRecord>(`/requests/${requestId}`, undefined, token);
  },
  getRequestQuotes(requestId: string, token: string) {
    return request<QuoteRecord[]>(`/requests/${requestId}/quotes`, undefined, token);
  },
  awardQuote(requestId: string, payload: AwardQuotePayload, token: string) {
    return request<RequestRecord>(`/requests/${requestId}/award`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  progressRequest(requestId: string, payload: ProgressRequestPayload, token: string) {
    return request<RequestRecord>(`/requests/${requestId}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  upsertOrder(requestId: string, payload: UpsertOrderPayload, token: string) {
    return request<RequestRecord>(`/requests/${requestId}/order`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  updateFulfillment(requestId: string, payload: UpdateFulfillmentPayload, token: string) {
    return request<RequestRecord>(`/requests/${requestId}/order/fulfillment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  getOpenRequests(token: string) {
    return request<RequestRecord[]>('/requests/open', undefined, token);
  },

  /* ---------- Capa comercial del proveedor ---------- */

  getWorkspaces(token: string) {
    return request<WorkspaceRecord[]>('/companies/workspaces', undefined, token);
  },
  getSupplierInbox(query: InboxQuery | undefined, token: string) {
    const search = buildQuery({
      status: query?.status,
      sellerUserId: query?.sellerUserId,
      search: query?.search?.trim() || undefined,
      privateOnly: query?.privateOnly ? 'true' : undefined,
    });

    return request<RequestAssignmentRecord[]>(`/requests/inbox${search}`, undefined, token);
  },
  getRequestAssignment(requestId: string, token: string) {
    return request<RequestAssignmentRecord>(`/requests/${requestId}/assignment`, undefined, token);
  },
  assignRequest(
    requestId: string,
    payload: { sellerUserId: string | null; notes?: string },
    token: string,
  ) {
    return request<RequestAssignmentRecord>(`/requests/${requestId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  getSupplierTeam(token: string) {
    return request<TeamMemberRecord[]>('/companies/team', undefined, token);
  },
  /** Publico: lo usa el registro de vendedores para elegir su empresa. */
  getSupplierDirectory(search: string | undefined) {
    return request<SupplierDirectoryCompany[]>(
      `/public/companies/suppliers${buildQuery({ search: search?.trim() || undefined })}`,
    );
  },
  approveTeamMember(userId: string, token: string) {
    return request<{ userId: string; status: string }>(`/companies/team/${userId}/approve`, {
      method: 'POST',
    }, token);
  },
  removeTeamMember(userId: string, token: string) {
    return request<{ userId: string; removed: boolean }>(`/companies/team/${userId}`, {
      method: 'DELETE',
    }, token);
  },
  getSupplierMetrics(token: string) {
    return request<SupplierMetricsRecord>('/companies/metrics', undefined, token);
  },
  getSupplierCustomers(token: string) {
    return request<CustomerRecord[]>('/companies/customers', undefined, token);
  },
  getSupplierCustomerDetail(buyerCompanyId: string, token: string) {
    return request<CustomerDetailRecord>(`/companies/customers/${buyerCompanyId}`, undefined, token);
  },
  getCommercialOpportunities(token: string) {
    return request<CommercialOpportunityRecord[]>('/companies/opportunities', undefined, token);
  },
  getOrCreateRequestConversation(requestId: string, token: string) {
    return request<ConversationRecord>(`/conversations/request/${requestId}`, {
      method: 'POST',
    }, token);
  },
  getSupplierQuotes(token: string) {
    return request<QuoteRecord[]>('/quotes/mine', undefined, token);
  },
  getBuyerQuotes(token: string) {
    return request<QuoteRecord[]>('/quotes/buyer/mine', undefined, token);
  },
  getNotifications(
    params: {
      unreadOnly?: boolean;
      limit?: number;
    } | undefined,
    token: string,
  ) {
    return request<NotificationsResponse>(
      `/notifications${buildQuery(
        params
          ? {
              unreadOnly: typeof params.unreadOnly === 'boolean' ? String(params.unreadOnly) : undefined,
              limit: typeof params.limit === 'number' ? String(params.limit) : undefined,
            }
          : undefined,
      )}`,
      undefined,
      token,
    );
  },
  markNotificationRead(notificationId: string, token: string) {
    return request<NotificationRecord>(`/notifications/${notificationId}/read`, {
      method: 'POST',
    }, token);
  },
  markAllNotificationsRead(token: string) {
    return request<NotificationsResponse>('/notifications/read-all', {
      method: 'POST',
    }, token);
  },
  getPushConfig(token: string) {
    return request<PushConfigResponse>('/notifications/push/config', undefined, token);
  },
  registerPushEndpoint(payload: RegisterPushEndpointPayload, token: string) {
    return request<{ id: string }>(`/notifications/push/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  removePushEndpoint(endpoint: string, token: string) {
    return request<{ ok: true }>(`/notifications/push/remove`, {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    }, token);
  },
  getQuoteDetail(quoteId: string, token: string) {
    return request<QuoteRecord>(`/quotes/${quoteId}`, undefined, token);
  },
  getConversations(params: ListConversationsParams | undefined, token: string) {
    return request<ConversationRecord[]>(
      `/conversations${buildQuery(
        params
          ? {
              contextType: params.contextType,
              search: params.search,
              from: params.from,
              to: params.to,
            }
          : undefined,
      )}`,
      undefined,
      token,
    );
  },
  getConversation(conversationId: string, params: ListConversationMessagesParams | undefined, token: string) {
    return request<ConversationRecord>(
      `/conversations/${conversationId}${buildQuery(
        params
          ? {
              search: params.search,
              from: params.from,
              to: params.to,
            }
          : undefined,
      )}`,
      undefined,
      token,
    );
  },
  getOrCreateProductConversation(payload: CreateProductConversationPayload, token: string) {
    return request<ConversationRecord>('/conversations/product', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  getOrCreateQuoteConversation(quoteId: string, token: string) {
    return request<ConversationRecord>(`/conversations/quote/${quoteId}`, {
      method: 'POST',
    }, token);
  },
  sendConversationMessage(conversationId: string, payload: SendConversationMessagePayload, token: string) {
    return request<ConversationRecord>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  markConversationRead(conversationId: string, token: string) {
    return request<{ conversationId: string; readAt: string }>(`/conversations/${conversationId}/read`, {
      method: 'POST',
    }, token);
  },
  createQuote(requestId: string, payload: CreateQuotePayload, token: string) {
    return request<QuoteRecord>(`/quotes/request/${requestId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
};

export const appConfig = {
  apiUrl: API_URL,
};
