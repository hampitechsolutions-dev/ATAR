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

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyType: CompanyType;
  role: Extract<MembershipRole, 'BUYER' | 'SUPPLIER'>;
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
  name: string;
  city: string | null;
  country: string;
  companyType: CompanyType;
  description: string;
  tags: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

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
