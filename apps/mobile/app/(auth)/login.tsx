import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { mobileApi } from '@/src/lib/api';
import { useMobileAuth } from '@/src/providers/auth-provider';
import { COLORS } from '@/src/constants/theme';

export default function LoginScreen() {
  const { signIn } = useMobileAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setSubmitting(true);
      setError(null);
      const response = await mobileApi.login({
        email: email.trim(),
        password,
      });
      await signIn(response);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: COLORS.background }}>
      <View className="rounded-[28px] border px-5 py-6" style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
        <Text className="text-3xl font-semibold" style={{ color: COLORS.secondary }}>
          ATAR mobile
        </Text>
        <Text className="mt-2 text-sm" style={{ color: COLORS.text }}>
          Inicia sesion para registrar el dispositivo y recibir notificaciones push.
        </Text>

        <View className="mt-6 gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium" style={{ color: COLORS.secondary }}>
              Email
            </Text>
            <TextInput
              autoCapitalize="none"
              className="rounded-2xl border px-4 py-3"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="usuario@atar.test"
              placeholderTextColor="#94A3B8"
              style={{ borderColor: COLORS.border, color: COLORS.secondary }}
              value={email}
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium" style={{ color: COLORS.secondary }}>
              Password
            </Text>
            <TextInput
              className="rounded-2xl border px-4 py-3"
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={{ borderColor: COLORS.border, color: COLORS.secondary }}
              value={password}
            />
          </View>
        </View>

        {error ? (
          <View className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <Text className="text-sm text-rose-700">{error}</Text>
          </View>
        ) : null}

        <Pressable
          className="mt-6 items-center rounded-full px-6 py-3"
          disabled={submitting}
          onPress={() => void handleLogin()}
          style={{ backgroundColor: COLORS.primary, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-sm font-semibold text-white">Entrar y habilitar push</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
