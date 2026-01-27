import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Venture } from "../types/Venture";

// Set your absolute backend URL here
const API_BASE_URL = "https://vp.rutayba.com/api/v1";

interface UseVentureDataReturn {
  ventures: Venture[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setVentures: Dispatch<SetStateAction<Venture[]>>;
}

export const useVentureData = (): UseVentureDataReturn => {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ventures`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add auth header here if your backend requires it
          // "Authorization": "Bearer YOUR_TOKEN" 
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // If your API returns { data: [...] }, use data.data
      // Otherwise, if it's a direct array, use data
      setVentures(Array.isArray(data) ? data : data.data || []);

    } catch (err: any) {
      console.error("Fetch Error:", err);
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
    isLoading,
    error,
    refetch: fetchData,
    setVentures,
  };
};