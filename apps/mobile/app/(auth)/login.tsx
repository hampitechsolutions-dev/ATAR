import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: COLORS.background }}>
      <Text className="text-2xl font-semibold" style={{ color: COLORS.secondary }}>
        Login
      </Text>
      <Text className="mt-2 text-sm text-center" style={{ color: COLORS.text }}>
        Pantalla mínima para validar navegación.
      </Text>

      <Pressable
        className="mt-8 w-full rounded-full px-6 py-3"
        onPress={() => router.replace('/')}
        style={{ backgroundColor: COLORS.primary }}
      >
        <Text className="text-center text-sm font-semibold text-white">Entrar</Text>
      </Pressable>
    </View>
  );
}

