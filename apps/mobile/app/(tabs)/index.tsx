import { Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
      <Text className="text-xl font-semibold" style={{ color: COLORS.secondary }}>
        Home Screen
      </Text>
    </View>
  );
}
