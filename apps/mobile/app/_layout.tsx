import 'react-native-reanimated';
import '../global.css';
import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'splash',
};

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
