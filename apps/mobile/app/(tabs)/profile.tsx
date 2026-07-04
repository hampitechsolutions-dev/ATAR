import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { getPrimaryCompanyName, getPrimaryMembershipRole } from '@/src/lib/session';
import { useMobileAuth } from '@/src/providers/auth-provider';

export default function ProfileScreen() {
  const { session, signOut } = useMobileAuth();

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.text }}>Sin sesion activa.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 py-10" style={{ backgroundColor: COLORS.background }}>
      <View className="rounded-[28px] border px-5 py-6" style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
        <Text className="text-2xl font-semibold" style={{ color: COLORS.secondary }}>
          {session.user.firstName} {session.user.lastName}
        </Text>
        <Text className="mt-2 text-sm" style={{ color: COLORS.text }}>
          {session.user.email}
        </Text>
        <Text className="mt-4 text-sm" style={{ color: COLORS.text }}>
          Empresa: {getPrimaryCompanyName(session.user)}
        </Text>
        <Text className="mt-2 text-sm" style={{ color: COLORS.text }}>
          Rol principal: {getPrimaryMembershipRole(session.user) ?? 'Sin rol'}
        </Text>
      </View>

      <Pressable
        className="mt-6 items-center rounded-full px-6 py-3"
        onPress={() => void signOut()}
        style={{ backgroundColor: COLORS.primary }}
      >
        <Text className="text-sm font-semibold text-white">Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}
