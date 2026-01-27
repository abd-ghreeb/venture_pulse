import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

// Shared Logic & Components
import { Venture } from "../src/types/Venture";
import { AICommandInput } from "../src/components/AICommandInput"; 
import { useVentureData } from "../src/hooks/useVentureData";

export default function DashboardScreen() {
  const router = useRouter();
  const { ventures, isLoading, refetch } = useVentureData();
  const [displayVentures, setDisplayVentures] = useState<Venture[]>([]);

  // Keep display list in sync with fetched data
  useEffect(() => {
    if (ventures) setDisplayVentures(ventures);
  }, [ventures]);

  const renderVentureItem = ({ item }: { item: Venture }) => (
    <Pressable 
      style={styles.card}
      onPress={() => {
        // Expo Router uses the filename in the app folder
        router.push({
          pathname: "/VentureDetails",
          params: { id: item.id } // Pass the ID to the details page
        });
      }}
    >
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.ventureName}>{item.name}</Text>
          <Text style={styles.venturePod}>{item.pod} • {item.stage}</Text>
        </View>
        <ChevronRight size={20} color="#CCC" />
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Burn</Text>
          <Text style={styles.metricValue}>${item.burn_rate_monthly.toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Runway</Text>
          <Text style={[styles.metricValue, item.runway_months < 6 ? {color: '#ef4444'} : {}]}>
            {item.runway_months}mo
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* AI Command Tool */}
      <View style={styles.aiContainer}>
        <AICommandInput 
          onResults={(filtered: Venture[]) => setDisplayVentures(filtered)}
          onClear={() => setDisplayVentures(ventures)}
        />
      </View>

      <FlatList
        data={displayVentures}
        keyExtractor={(item) => item.id}
        renderItem={renderVentureItem}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No ventures found matching your query.</Text>
        }
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  aiContainer: { 
    padding: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    paddingTop: 60 // Pushes input below the notch if not using SafeAreaView
  },
  card: { 
    backgroundColor: "#FFF", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2 
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ventureName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  venturePod: { fontSize: 14, color: "#6B7280" },
  metricsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  metric: { marginRight: 24 },
  metricLabel: { fontSize: 11, color: "#9CA3AF", textTransform: 'uppercase', fontWeight: '600' },
  metricValue: { fontSize: 15, fontWeight: "600", color: "#374151" },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' }
});