import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAnalysis } from '@/context/AnalysisContext';
import { useToast } from '@/hooks/use-toast';
import {
  BarElement,
  CategoryScale,
  ChartDataset,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

// Registra i componenti necessari di Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

// Interfacce TypeScript per type safety
interface HistoricalData {
  labels: string[];
  datasets: ChartDataset<'line', number[]>[];
}

interface HistoricalResults {
  historicalData?: HistoricalData;
}

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'rgb(203, 213, 225)',
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: 'rgb(203, 213, 225)',
      bodyColor: 'rgb(203, 213, 225)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    },
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: 'xy',
      },
      pan: {
        enabled: true,
        mode: 'xy',
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: 'rgb(203, 213, 225)',
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: 'rgb(203, 213, 225)',
      },
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: 'rgb(203, 213, 225)',
      },
    },
  },
};

type LineDataset = ChartDataset<'line', number[]>;
type BarDataset = ChartDataset<'bar', number[]>;
type _MixedDataset = LineDataset | BarDataset;

const HistoricalChart = () => {
  const { analysisState, startAnalysis } = useAnalysis();
  const { isLoading, error, analysisResults } = analysisState;
  const { toast } = useToast();

  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Funzioni per gestire i click sui bottoni
  const handleRefreshClick = async () => {
    try {
      toast({
        title: "Aggiornamento dati",
        description: "Aggiornamento dei dati storici in corso...",
      });

      await startAnalysis();

      toast({
        title: "Aggiornamento completato",
        description: "I dati storici sono stati aggiornati con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore nell'aggiornamento",
        description: "Impossibile aggiornare i dati storici. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleInfoClick = () => {
    toast({
      title: "Informazioni sul grafico",
      description: "Questo grafico mostra l'andamento storico dei prezzi. Usa gli switch per mostrare/nascondere indicatori tecnici come SMA, RSI e Volume. Puoi zoomare e fare pan sul grafico.",
    });
  };

  // Fallback robusti per i dati del grafico
  const rawChartData: HistoricalData = {
    labels: analysisResults?.historicalData?.labels || [],
    datasets: analysisResults?.historicalData?.datasets || [],
  };

  // Filtra i dataset in base agli switch attivi
  const filteredDatasets = useMemo(() => {
    if (!rawChartData.datasets || rawChartData.datasets.length === 0) {
      return [];
    }

    return rawChartData.datasets.filter((dataset) => {
      const label = dataset.label?.toLowerCase() || '';

      if (label.includes('sma20') || label.includes('20')) return showSMA20;
      if (label.includes('sma50') || label.includes('50')) return showSMA50;
      if (label.includes('sma200') || label.includes('200')) return showSMA200;
      if (label.includes('rsi')) return showRSI;
      if (label.includes('volume')) return showVolume;

      // Mostra sempre i dataset principali (prezzi, portafoglio, ecc.)
      return true;
    });
  }, [rawChartData.datasets, showSMA20, showSMA50, showSMA200, showRSI, showVolume]);

  const chartData = {
    labels: rawChartData.labels,
    datasets: filteredDatasets,
  };

  return (
    <div className="dark-card rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
          Andamento Storico
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshClick}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isLoading ? "animate-spin" : ""}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            {isLoading ? "Aggiornamento..." : "Aggiorna"}
          </button>
          <button
            onClick={handleInfoClick}
            className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Info
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="sma20"
            checked={showSMA20}
            onCheckedChange={setShowSMA20}
          />
          <Label htmlFor="sma20" className="text-sm text-slate-300">
            SMA 20
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="sma50"
            checked={showSMA50}
            onCheckedChange={setShowSMA50}
          />
          <Label htmlFor="sma50" className="text-sm text-slate-300">
            SMA 50
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="sma200"
            checked={showSMA200}
            onCheckedChange={setShowSMA200}
          />
          <Label htmlFor="sma200" className="text-sm text-slate-300">
            SMA 200
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="rsi" checked={showRSI} onCheckedChange={setShowRSI} />
          <Label htmlFor="rsi" className="text-sm text-slate-300">
            RSI
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="volume"
            checked={showVolume}
            onCheckedChange={setShowVolume}
          />
          <Label htmlFor="volume" className="text-sm text-slate-300">
            Volume
          </Label>
        </div>
      </div>

      <div className="w-full h-96">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-blue-300">Caricamento dati in corso...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        ) : !analysisResults ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400 mx-auto"
              >
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
              <h4 className="text-xl font-bold text-slate-200">
                Nessuna Analisi Eseguita
              </h4>
              <p className="text-slate-400">
                Vai alla sezione 'Input & Validazione' per avviare una nuova
                analisi.
              </p>
            </div>
          </div>
        ) : !rawChartData.labels || rawChartData.labels.length === 0 || !filteredDatasets || filteredDatasets.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400 mx-auto"
              >
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
              <h4 className="text-xl font-bold text-slate-200">
                Nessun Dato Storico Disponibile
              </h4>
              <p className="text-slate-400">
                Avvia un'analisi per visualizzare l'andamento storico dei prezzi.
              </p>
            </div>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default HistoricalChart;
