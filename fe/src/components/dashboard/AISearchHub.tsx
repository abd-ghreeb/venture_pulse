import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Venture } from "@/types/Venture";
import { apiClient } from '@/lib/apiClient';
import { motion } from 'framer-motion';

interface AISearchHubProps {
    onResults: (ventures: Venture[], summary: string) => void;
    onClear: () => void;
}

const AISearchHub = ({ onResults, onClear }: AISearchHubProps) => {
    // Helper to generate a unique ID
    const generateId = () => `web_sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // State to hold the current session ID
    const [sessionId, setSessionId] = useState(generateId());
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const result = await apiClient.queryAgent(query, sessionId);

            // Set local summary for the "Briefing" box
            setSummary(result.answer);

            // Send the structured data up to the Index page
            onResults(
                result.data.ventures,
                result.answer
            );

        } catch (err: any) {
            toast({
                title: "Agent Offline",
                description: "The AI analyst could not be reached.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        const oldId = sessionId; // Capture for the API call
        
        // 1. Backend: Tell it to wipe the old session
        // We don't 'await' this if we want the UI to feel instant
        apiClient.clearSession(oldId).catch(console.error);

        // 2. UI: Reset fields
        setQuery('');
        setSummary(null);
        onClear();

        // 3. Rotation: Generate a NEW ID for the next message
        setSessionId(generateId());
    };

    return (
        <div className="w-full space-y-4 mb-8">
            <form onSubmit={handleSearch} className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60">
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-primary" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask Mattar: 'Show me ventures in HealthTech'..."
                    className="pl-12 h-14 bg-card border-primary/10 shadow-xl text-lg rounded-xl focus-visible:ring-primary/20"
                />
                <Button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    disabled={isLoading}
                >
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </form>

            {/* THE AGENT REPLY SECTION */}
            {summary && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-5 bg-primary/[0.03] border-primary/20 shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                            <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                                <Sparkles className="w-3 h-3 mr-1" /> Mattar AI Analysis
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={handleClear} className="h-6 w-6">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Using ReactMarkdown to parse Mattar's formatting */}
                        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 prose prose-slate dark:prose-invert max-w-none">
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <span {...props} />, // Prevents double spacing
                                    strong: ({ node, ...props }) => <b className="font-bold text-primary" {...props} />
                                }}
                            >
                                {summary}
                            </ReactMarkdown>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default AISearchHub;