import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Send, X, Sparkles, MessageSquare } from 'lucide-react-native';

interface Props {
  onResults: (ventures: any[]) => void;
  onClear: () => void;
}

export const AICommandInput = ({ onResults, onClear }: Props) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://vp.rutayba.com/api/v1/query', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg: query }),
      });
  
      if (!response.ok) throw new Error(`Error: ${response.status}`);
  
      const result = await response.json();
  
      if (result.data?.ventures) {
        setSummary(result.answer); // Capture the AI text
        onResults(result.data.ventures);
      }
    } catch (error: any) {
      console.error("AI Query failed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setSummary(null);
    onClear();
  };

  return (
    <View style={styles.wrapper}>
      {/* Search Bar Container */}
      <View style={styles.searchContainer}>
        <View style={styles.iconPrefix}>
          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Sparkles size={18} color="#2563EB" />
          )}
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Ask Mattar AI..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="send"
        />
        
        <View style={styles.buttonGroup}>
          {query.length > 0 && (
            <TouchableOpacity onPress={handleReset} style={styles.iconButton}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={handleSearch} 
            disabled={loading}
            style={[styles.sendButton, loading && { opacity: 0.5 }]}
          >
            <Send size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Summary Card (The "Briefing" Box) */}
      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.badge}>
              <Sparkles size={12} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>MATTAR ANALYSIS</Text>
            </View>
            <TouchableOpacity onPress={handleReset}>
              <X size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 3,
  },
  iconPrefix: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginTop: 12,
    backgroundColor: '#EFF6FF', // Soft light blue
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E40AF',
    fontWeight: '400',
  },
});