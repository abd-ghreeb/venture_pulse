import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useVentureData } from '../src/hooks/useVentureData';
import { TrendingDown, Clock, Star, Users, Briefcase } from 'lucide-react-native';

export default function VentureDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { ventures } = useVentureData();
  const venture = ventures.find(v => v.id === id);

  if (!venture) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.loaderText}>Loading venture insights...</Text>
      </View>
    );
  }

  const healthColor = venture.health === 'On Track' ? '#10B981' : venture.health === 'At Risk' ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
            <Text style={[styles.status, { color: healthColor }]}>{venture.health.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{venture.name}</Text>
          <Text style={styles.podText}>{venture.pod} Pod • {venture.stage}</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              icon={<TrendingDown size={20} color="#6B7280" />} 
              label="Monthly Burn" 
              value={`$${venture.burn_rate_monthly.toLocaleString()}`} 
            />
            <StatCard 
              icon={<Clock size={20} color="#6B7280" />} 
              label="Runway" 
              value={`${venture.runway_months} mo`} 
              highlight={venture.runway_months < 6}
            />
            <StatCard 
              icon={<Star size={20} color="#6B7280" />} 
              label="NPS Score" 
              value={venture.nps_score} 
            />
            <StatCard 
              icon={<Users size={20} color="#6B7280" />} 
              label="Active Pilots" 
              value={venture.pilot_customers_count} 
            />
          </View>

          {/* Founder Section */}
          <View style={styles.founderCard}>
            <View style={styles.founderIcon}>
              <Briefcase size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.founderLabel}>Founder & CEO</Text>
              <Text style={styles.founderName}>{venture.founder}</Text>
            </View>
          </View>

          {/* Description / Summary */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Venture Brief</Text>
            <Text style={styles.descriptionText}>
              {venture.description || "No description provided for this venture."}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ icon, label, value, highlight }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statIcon}>{icon}</View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, highlight && { color: '#EF4444' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#9CA3AF', fontWeight: '500' },
  header: { 
    padding: 32, 
    paddingTop: 60, 
    backgroundColor: '#111827', 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24 
  },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  healthDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  status: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  name: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  podText: { color: '#9CA3AF', marginTop: 4, fontSize: 16, fontWeight: '500' },
  content: { padding: 20 },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    marginBottom: 16, 
    textTransform: 'uppercase',
    letterSpacing: 1 
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { 
    backgroundColor: '#FFF', 
    width: '48%', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  statIcon: { marginBottom: 12 },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  founderCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EFF6FF', 
    padding: 16, 
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 32
  },
  founderIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#DBEAFE', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  founderLabel: { fontSize: 11, color: '#2563EB', fontWeight: '700', textTransform: 'uppercase' },
  founderName: { fontSize: 17, fontWeight: '600', color: '#1E40AF' },
  descriptionSection: { marginTop: 8 },
  descriptionText: { fontSize: 16, lineHeight: 24, color: '#4B5563' }
});