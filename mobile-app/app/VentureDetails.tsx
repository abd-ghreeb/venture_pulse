import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function VentureDetailsScreen({ route }: any) {
  const { venture } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{venture.name}</Text>
        <Text style={styles.status}>Status: {venture.status.replace('_', ' ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Founding Team</Text>
        <Text style={styles.detailText}>{venture.founder}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Metrics</Text>
        <MetricRow label="Monthly Burn" value={`$${venture.metrics.burn_rate_monthly}`} />
        <MetricRow label="Runway" value={`${venture.metrics.runway_months} Months`} />
        <MetricRow label="NPS Score" value={venture.metrics.nps_score} />
        <MetricRow label="Pilot Customers" value={venture.metrics.pilot_customers} />
      </View>
    </ScrollView>
  );
}

const MetricRow = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 24, backgroundColor: '#111827' },
  name: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  status: { color: '#10B981', marginTop: 4, fontWeight: '600' },
  section: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase' },
  detailText: { fontSize: 18, color: '#1F2937' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#6B7280' },
  value: { fontWeight: '600', color: '#111827' }
});