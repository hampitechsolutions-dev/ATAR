import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { mobileApi } from '@/src/lib/api';
import { useMobileAuth } from './auth-provider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerDeviceForPush(accessToken: string) {
  if (!Device.isDevice) {
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== 'granted') {
    const nextPermission = await Notifications.requestPermissionsAsync();
    status = nextPermission.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    return null;
  }

  const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  await mobileApi.registerPushEndpoint(
    {
      channel: 'MOBILE_EXPO',
      endpoint: expoPushToken.data,
      payload: {
        platform: Platform.OS,
        projectId,
      },
      userAgent: Platform.OS,
      deviceName: Device.deviceName ?? 'Mobile device',
    },
    accessToken,
  );

  return expoPushToken.data;
}

export function MobilePushProvider({ children }: { children: ReactNode }) {
  const { session } = useMobileAuth();

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    void registerDeviceForPush(session.accessToken);
  }, [session?.accessToken]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const href = response.notification.request.content.data?.href;
      if (typeof href === 'string' && href.length > 0 && !href.startsWith('/dashboard')) {
        router.push(href as never);
        return;
      }

      router.push('/' as never);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return children;
}
