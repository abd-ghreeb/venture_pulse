import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, LayoutGrid } from "lucide-react-native";

// Shared Logic & Components
import { Venture } from "../src/types/Venture";
import { AICommandInput } from "../src/components/AICommandInput"; 
import { useVentureData } from "../src/hooks/useVentureData";

export default function DashboardScreen() {
  const router = useRouter();
  const { ventures, isLoading, refetch } = useVentureData();
  const [displayVentures, setDisplayVentures] = useState<Venture[]>([]);

  useEffect(() => {
    if (ventures) setDisplayVentures(ventures);
  }, [ventures]);

  const renderVentureItem = ({ item }: { item: Venture }) => (
    <Pressable 
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: "/VentureDetails",
          params: { id: item.id } 
        });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <Text style={styles.ventureName}>{item.name}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.stage}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#9CA3AF" />
      </View>
      
      <Text style={styles.venturePod}>{item.pod} Pod</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Monthly Burn</Text>
          <Text style={styles.metricValue}>${item.burn_rate_monthly.toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Runway</Text>
          <Text style={[styles.metricValue, item.runway_months < 6 ? {color: '#EF4444'} : {color: '#10B981'}]}>
            {item.runway_months}mo
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        data={displayVentures}
        keyExtractor={(item) => item.id}
        renderItem={renderVentureItem}
        // This makes the AI tool scrollable with the list
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Venture Pulse</Text>
              <LayoutGrid size={20} color="#6B7280" />
            </View>
            <AICommandInput 
              onResults={(filtered: Venture[]) => setDisplayVentures(filtered)}
              onClear={() => setDisplayVentures(ventures)}
            />
            <Text style={styles.listSubtitle}>
              {displayVentures.length} Ventures Active
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563EB" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No ventures found.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  listSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 1,
  },
  card: { 
    backgroundColor: "#FFF", 
    borderRadius: 16, 
    padding: 20, 
    marginHorizontal: 20,
    marginBottom: 16, 
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // Premium soft shadow
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ventureName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  venturePod: { 
    fontSize: 14, 
    color: "#6B7280", 
    marginTop: 2,
    marginBottom: 16 
  },
  metricsGrid: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#F9FAFB', 
    paddingTop: 16,
    gap: 32 
  },
  metric: { flex: 0 },
  metricLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: '500', marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 15 }
});