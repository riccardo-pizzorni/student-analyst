import { useEffect, useState } from 'react';

interface HistoricalDataPoint {
  date: string;
  price: number;
}

interface UseHistoricalDataReturn {
  data: HistoricalDataPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useHistoricalData(): UseHistoricalDataReturn {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Sostituire con chiamata API reale
      // Per ora usiamo dati di esempio
      const mockData: HistoricalDataPoint[] = [
        { date: '2023-01', price: 100 },
        { date: '2023-02', price: 105 },
        { date: '2023-03', price: 102 },
        { date: '2023-04', price: 108 },
        { date: '2023-05', price: 112 },
        { date: '2023-06', price: 110 },
        { date: '2023-07', price: 115 },
        { date: '2023-08', price: 118 },
        { date: '2023-09', price: 116 },
        { date: '2023-10', price: 120 },
        { date: '2023-11', price: 125 },
        { date: '2023-12', price: 122 },
      ];

      setData(mockData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Errore nel caricamento dei dati'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}
