import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Send, X } from 'lucide-react-native';
import axios from 'axios';

interface Props {
  onResults: (ventures: any[]) => void;
  onClear: () => void;
}

export const AICommandInput = ({ onResults, onClear }: Props) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://vp.rutayba.com/api/v1/query', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If your backend still throws a 401, you MUST provide the token here:
          // "Authorization": "Bearer YOUR_TOKEN_HERE"
        },
        body: JSON.stringify({ msg: query }),
      });
  
      // Check if the response is successful (status 200-299)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }
  
      const result = await response.json();
  
      // Mapping based on your backend response structure
      if (result.data?.ventures) {
        onResults(result.data.ventures);
      }
    } catch (error: any) {
      console.error("AI Query failed:", error.message);
      // You can add an Alert.alert() here to show the error to the user
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    onClear();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Ask the AI agent about ventures..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="send"
      />
      
      <View style={styles.buttonGroup}>
        {query.length > 0 && (
          <TouchableOpacity onPress={handleReset} style={styles.iconButton}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          onPress={handleSearch} 
          disabled={loading}
          style={[styles.sendButton, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Send size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#1F2937',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});