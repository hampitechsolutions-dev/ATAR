import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { mobileApi, type NotificationRecord } from '@/src/lib/api';
import { getPrimaryCompanyName } from '@/src/lib/session';
import { useMobileAuth } from '@/src/providers/auth-provider';

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.round(hours / 24)} d`;
}

function resolveMobileNotificationHref(href?: string | null) {
  if (!href) {
    return '/' as const;
  }

  if (href.startsWith('/dashboard/')) {
    return '/' as const;
  }

  return href as never;
}

export default function HomeScreen() {
  const { session, isHydrated } = useMobileAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const accessToken = session?.accessToken ?? null;

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const token = accessToken;

    let cancelled = false;

    async function loadNotifications() {
      try {
        setError(null);
        const response = await mobileApi.getNotifications(token);
        const nextResponse =
          response.unreadCount > 0
            ? await mobileApi.markAllNotificationsRead(token)
            : response;
        if (!cancelled) {
          setNotifications(nextResponse.items);
          setUnreadCount(nextResponse.unreadCount);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las notificaciones.');
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isHydrated]);

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.text }}>Cargando sesion...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }} style={{ backgroundColor: COLORS.background }}>
      <Text className="text-3xl font-semibold" style={{ color: COLORS.secondary }}>
        Hola, {session.user.firstName}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: COLORS.text }}>
        Empresa activa: {getPrimaryCompanyName(session.user)}
      </Text>

      <View className="mt-6 flex-row gap-3">
        <View className="flex-1 rounded-3xl px-4 py-5" style={{ backgroundColor: '#EEF2FF' }}>
          <Text className="text-sm font-medium" style={{ color: COLORS.text }}>
            Push activo
          </Text>
          <Text className="mt-2 text-2xl font-semibold" style={{ color: COLORS.secondary }}>
            Mobile Expo
          </Text>
        </View>
        <View className="flex-1 rounded-3xl px-4 py-5" style={{ backgroundColor: '#ECFDF5' }}>
          <Text className="text-sm font-medium" style={{ color: COLORS.text }}>
            Sin leer
          </Text>
          <Text className="mt-2 text-2xl font-semibold" style={{ color: COLORS.secondary }}>
            {unreadCount}
          </Text>
        </View>
      </View>

      {error ? (
        <View className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4">
          <Text className="text-sm text-rose-700">{error}</Text>
        </View>
      ) : null}

      <View className="mt-6 gap-3">
        {notifications.map((notification) => (
          <Pressable
            key={notification.id}
            className="rounded-3xl border px-4 py-4"
            onPress={async () => {
              if (!notification.readAt) {
                try {
                  const updated = await mobileApi.markNotificationRead(notification.id, session.accessToken);
                  setNotifications((current) =>
                    current.map((item) => (item.id === updated.id ? updated : item)),
                  );
                  setUnreadCount((current) => Math.max(0, current - 1));
                } catch {
                  // Si falla el marcado no bloqueamos la navegación del usuario.
                }
              }

              router.push(resolveMobileNotificationHref(notification.href));
            }}
            style={{
              borderColor: notification.readAt ? COLORS.border : '#C7D2FE',
              backgroundColor: notification.readAt ? COLORS.card : '#EEF2FF',
            }}
          >
            <Text className="text-base font-semibold" style={{ color: COLORS.secondary }}>
              {notification.title}
            </Text>
            <Text className="mt-1 text-sm" style={{ color: COLORS.text }}>
              {notification.detail ?? 'Nueva novedad comercial disponible.'}
            </Text>
            <Text className="mt-3 text-xs" style={{ color: '#64748B' }}>
              {formatRelative(notification.createdAt)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
