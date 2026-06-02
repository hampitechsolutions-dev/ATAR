import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const pillars = [
  'Mercado industrial B2B',
  'Cotizaciones privadas',
  'CRM comercial',
  'Vendedor humano o IA',
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>ATAR mobile</Text>
        <Text style={styles.title}>La red comercial industrial en tu bolsillo.</Text>
        <Text style={styles.description}>
          Esta base mobile permite consultar oportunidades, responder cotizaciones y seguir operaciones desde cualquier lugar.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prioridades del MVP</Text>
          {pillars.map((item) => (
            <View key={item} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>Web</Text>
            <Text style={styles.metricLabel}>Gestion completa</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>App</Text>
            <Text style={styles.metricLabel}>Seguimiento rapido</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 20,
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#f9fafb',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  description: {
    color: '#d1d5db',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillText: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  metricValue: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#4b5563',
    fontSize: 14,
  },
});
