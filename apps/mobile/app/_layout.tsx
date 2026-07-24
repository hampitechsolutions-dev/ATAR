import 'react-native-reanimated';
import '../global.css';
import { Stack } from 'expo-router';
import { MobileAuthProvider } from '@/src/providers/auth-provider';
import { MobilePushProvider } from '@/src/providers/push-provider';

export const unstable_settings = {
  initialRouteName: 'splash',
};

export default function RootLayout() {
  return (
    <MobileAuthProvider>
      <MobilePushProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </MobilePushProvider>
    </MobileAuthProvider>
  );
}
