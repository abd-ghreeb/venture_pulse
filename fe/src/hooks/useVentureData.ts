import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { apiClient } from '@/lib/apiClient';
import { DashboardStats } from '@/types/DashboardStats';
import { Venture } from '@/types/Venture';

interface UseVentureDataReturn {
  ventures: Venture[];
  metrics: DashboardStats | null;
  burnTrend: number[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setVentures: Dispatch<SetStateAction<Venture[]>>;
  setMetrics: Dispatch<SetStateAction<DashboardStats | null>>;
}

export const useVentureData = (): UseVentureDataReturn => {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [metrics, setMetrics] = useState<DashboardStats | null>(null);
  const [burnTrend, setBurnTrend] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Reset error state on new fetch
    
    try {
      // Use the new semantic wrappers from your Class
      const [vData, sData] = await Promise.all([
        apiClient.getVentures(),
        apiClient.getDashboardStats()
      ]);

      setVentures(vData);
      setMetrics(sData);
      
      // If your backend sends a trend array within stats
      if (sData.burnTrend) {
        setBurnTrend(sData.burnTrend);
      }
    } catch (err: any) {
      console.error("Dashboard Sync Error:", err);
      setError(err.message || "Failed to sync portfolio data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ventures,
    metrics,
    burnTrend,
    isLoading,
    error,
    refetch: fetchData,
    setVentures,
    setMetrics,
  };
};