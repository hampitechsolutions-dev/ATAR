import Constants from 'expo-constants';

export type MembershipRole = 'ADMIN' | 'BUYER' | 'SUPPLIER' | 'SELLER';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  memberships: Array<{
    id: string;
    role: MembershipRole;
    isPrimary: boolean;
    company: {
      id: string;
      name: string;
      type: 'BUYER' | 'SUPPLIER' | 'HYBRID';
      country: string;
      city: string | null;
    };
  }>;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPushEndpointPayload = {
  channel: 'WEB' | 'MOBILE_EXPO';
  endpoint: string;
  payload?: Record<string, unknown>;
  userAgent?: string;
  deviceName?: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  detail?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  items: NotificationRecord[];
  unreadCount: number;
};

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000/api';

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
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

export const mobileApi = {
  login(payload: LoginPayload) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  me(token: string) {
    return request<AuthUser>('/auth/me', undefined, token);
  },
  getNotifications(token: string) {
    return request<NotificationsResponse>('/notifications?limit=20', undefined, token);
  },
  markNotificationRead(id: string, token: string) {
    return request<NotificationRecord>(`/notifications/${id}/read`, {
      method: 'POST',
    }, token);
  },
  markAllNotificationsRead(token: string) {
    return request<NotificationsResponse>('/notifications/read-all', {
      method: 'POST',
    }, token);
  },
  registerPushEndpoint(payload: RegisterPushEndpointPayload, token: string) {
    return request<{ id: string }>('/notifications/push/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
  removePushEndpoint(endpoint: string, token: string) {
    return request<{ ok: true }>('/notifications/push/remove', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    }, token);
  },
};

export const mobileAppConfig = {
  apiUrl: API_URL,
};
