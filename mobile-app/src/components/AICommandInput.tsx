import React, { useState, useEffect } from 'react';
import Markdown from 'react-native-markdown-display';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { Send, X, Sparkles, Mic, MicOff } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface Props {
    onResults: (ventures: any[]) => void;
    onClear: () => void;
}

export const AICommandInput = ({ onResults, onClear }: Props) => {
    // 1. New State for Dynamic Session ID
    const generateSessionId = () => `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [sessionId, setSessionId] = useState(generateSessionId());

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    useEffect(() => {
        Audio.requestPermissionsAsync();
    }, []);

    const clearInput = () => {
        setQuery('');
    };

    async function startRecording() {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true
            });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            // setSummary(null); <-- REMOVED: Keep summary visible while recording if user is sending a subsequent command
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recording) return;
        setIsRecording(false);
        setTranscribing(true);

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (uri) {
            await uploadAudio(uri);
        } else {
            setTranscribing(false);
        }
    }

    const uploadAudio = async (uri: string) => {
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            type: 'audio/m4a',
            name: 'speech.m4a'
        });

        try {
            const response = await fetch('https://vp.rutayba.com/api/v1/voice-query', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.text) {
                setQuery(result.text);
                setTranscribing(false);
                handleSearch(result.text); // Auto-submit
            }
        } catch (error) {
            console.error("Transcription failed", error);
            setTranscribing(false);
        }
    };

    const handleSearch = async (overrideQuery?: string) => {
        const finalQuery = overrideQuery || query;
        if (!finalQuery.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('https://vp.rutayba.com/api/v1/query', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    msg: finalQuery,
                    session_id: sessionId
                 }),
            });

            // Handle non-200 responses (like the 400 error we discussed)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || "I encountered a processing error.");
            }

            const result = await response.json();
            if (result.data?.ventures) {
                setSummary(result.answer || "Analysis complete.");
                onResults(result.data.ventures); // Update list in parent
            }
        } catch (error: any) {
            // Show a user-friendly message in the AI Insight box
            const friendlyMessage = "### ⚠️ Analysis Interrupted\n" + 
                (error.message || "This query is a bit too complex for me right now. Please try rephrasing!");
            setSummary(friendlyMessage);
            console.error("AI Query Error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        // Capture old ID for the API call before we rotate it in state
        const oldSessionId = sessionId;

        setQuery('');
        setSummary(null);
        setTranscribing(false);
        onClear(); // CRITICAL: This resets the list in index.tsx

        // Rotate Session ID so the NEXT query is fresh
        setSessionId(generateSessionId());

        // 2. Backend Synchronization
        try {
            const response = await fetch('https://vp.rutayba.com/api/v1/session/clear', {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: oldSessionId }), 
            });

            if (!response.ok) {
                throw new Error("Failed to clear backend session");
            }

            console.log("Session cleared successfully");
        } catch (error: any) {
            console.error("Session Reset Error:", error.message);
            
        }
    };

    return (
        <View style={styles.wrapper}>
            <View style={[styles.searchContainer, isRecording && styles.containerRecording]}>
                <View style={styles.iconPrefix}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                        <Sparkles size={18} color="#2563EB" />
                    )}
                </View>

                <TextInput
                    style={styles.input}
                    placeholder={isRecording ? "Listening..." : transcribing ? "Processing voice..." : "Ask Mattar AI..."}
                    placeholderTextColor="#9CA3AF"
                    value={query}
                    onChangeText={setQuery}
                    editable={!loading && !transcribing}
                    onSubmitEditing={() => handleSearch()}
                    returnKeyType="send"
                    autoCorrect={false}
                />

                <View style={styles.buttonGroup}>
                    {query.length > 0 && !loading && (
                        <TouchableOpacity onPress={clearInput} style={styles.iconButton}>
                            <X size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={isRecording ? stopRecording : startRecording}
                        style={[styles.micButton, isRecording && styles.micActive]}
                    >
                        {isRecording ? (
                            <MicOff size={18} color="#FFF" />
                        ) : (
                            <Mic size={18} color={transcribing ? "#9CA3AF" : "#2563EB"} />
                        )}
                    </TouchableOpacity>

                    {!isRecording && query.length > 0 && (
                        <TouchableOpacity
                            onPress={() => handleSearch()}
                            disabled={loading || transcribing}
                            style={[styles.sendButton, (loading || transcribing) && { opacity: 0.5 }]}
                        >
                            <Send size={16} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {summary && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.badge}>
                            <Sparkles size={12} color="#2563EB" style={{ marginRight: 4 }} />
                            <Text style={styles.badgeText}>AI INSIGHT</Text>
                        </View>
                        <TouchableOpacity onPress={handleReset}>
                            <X size={14} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Markdown Renderer */}
                    <Markdown style={markdownStyles as any}>
                        {summary}
                    </Markdown>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginBottom: 12,
        // Fix for top margin if header is hidden
        paddingTop: Platform.OS === 'ios' ? 10 : 0
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        // Improved shadow for "Clean UX"
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    containerRecording: {
        borderColor: '#EF4444',
        backgroundColor: '#FFF1F2',
    },
    iconPrefix: { marginRight: 8 },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    micButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    micActive: {
        backgroundColor: '#EF4444',
    },
    sendButton: {
        backgroundColor: '#2563EB',
        padding: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButton: { padding: 4 },
    summaryCard: {
        marginTop: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0F2FE',
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
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0369A1',
        textTransform: 'uppercase',
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#0C4A6E',
    },
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: 14,
        lineHeight: 20,
        color: '#334155',
    },
    strong: {
        fontWeight: '700', // Use numeric strings for fontWeight in Native TS
        color: '#1E293B',
    },
    em: {
        fontStyle: 'italic',
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 0,
    },
});