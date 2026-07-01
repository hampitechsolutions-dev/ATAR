import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

export default function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
      <View className="items-center">
        <Text className="text-4xl font-semibold" style={{ color: COLORS.secondary }}>
          ATAR
        </Text>
        <Text className="mt-2 text-sm" style={{ color: COLORS.text }}>
          Marketplace Industrial
        </Text>
      </View>

      <Pressable
        className="mt-10 rounded-full px-6 py-3"
        onPress={() => router.replace('/login')}
        style={{ backgroundColor: COLORS.primary }}
      >
        <Text className="text-sm font-semibold text-white">Continuar</Text>
      </Pressable>
    </View>
  );
}

