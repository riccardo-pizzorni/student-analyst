import { useAnalysis } from '@/context/AnalysisContext';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  AlertTriangle,
  Info,
  Loader,
  TrendingUp,
} from 'lucide-react';

// Interfacce TypeScript per type safety
interface VolatilityData {
  annualizedVolatility: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  var95?: number;
  cvar95?: number;
}

interface VolatilityResults {
  volatility?: VolatilityData;
}

export default function VolatilityChart() {
  const { analysisState } = useAnalysis();
  const { analysisResults, isLoading, error } = analysisState;
  const { toast } = useToast();

  // Funzione per gestire il click su "Teoria"
  const handleTheoryClick = () => {
    toast({
      title: "Teoria della Volatilità e del Rischio",
      description: "La volatilità misura la variabilità dei rendimenti nel tempo. Il Sharpe Ratio confronta rendimenti con rischio. Valori più bassi di volatilità e più alti di Sharpe indicano un portafoglio più stabile e efficiente.",
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader className="animate-spin rounded-full h-12 w-12 mx-auto text-blue-500" />
            <p className="text-blue-300">Analizzando la volatilità...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertTriangle size={48} className="text-red-500 mx-auto" />
            <h4 className="text-xl font-bold text-red-300">Errore</h4>
            <p className="text-red-400 max-w-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisResults || !analysisResults.volatility) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Activity size={48} className="text-blue-400 mx-auto" />
            <h4 className="text-xl font-bold text-slate-200">
              Dati di Volatilità non Disponibili
            </h4>
            <p className="text-slate-400">
              Avvia un'analisi per calcolare la volatilità e il rischio.
            </p>
          </div>
        </div>
      );
    }

    const volatilityData: VolatilityData = analysisResults.volatility;
    const { annualizedVolatility = 0, sharpeRatio = 0 } = volatilityData;

    // Fallback robusti per calcoli e stili
    const volatilityPercentage = ((annualizedVolatility || 0) * 100).toFixed(1);
    const volatilityBarWidth = Math.min(100, Math.max(0, ((annualizedVolatility || 0) / 0.3) * 100));
    const sharpeBarWidth = Math.min(100, Math.max(0, ((sharpeRatio || 0) / 2) * 100));

    return (
      <>
        {/* Volatility Visualization */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-red-950/30 to-orange-950/30 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h4 className="font-semibold text-red-300">
                Volatilità Annualizzata
              </h4>
            </div>
            <div className="text-3xl font-bold text-red-400 mb-2">
              {volatilityPercentage}%
            </div>
            <div className="w-full bg-red-950/50 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${volatilityBarWidth}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-red-200">
              Misura del rischio del portafoglio (vs 15% benchmark)
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={20} className="text-blue-400" />
              <h4 className="font-semibold text-blue-300">Sharpe Ratio</h4>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {(sharpeRatio || 0).toFixed(2)}
            </div>
            <div className="w-full bg-blue-950/50 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${sharpeBarWidth}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-blue-200">Rendimento per unità di rischio</p>
          </div>
        </div>

        {/* Interactive Chart Area */}
        <div className="bg-gradient-to-br from-slate-900/50 to-blue-950/30 border border-blue-500/20 rounded-xl p-6">
          {volatilityData.maxDrawdown !== undefined || volatilityData.var95 !== undefined ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                  <TrendingUp size={32} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-300">
                    Dati di rischio avanzati disponibili
                  </p>
                  <p className="text-slate-400">
                    {volatilityData.maxDrawdown !== undefined && `Max Drawdown: ${(volatilityData.maxDrawdown * 100).toFixed(2)}%`}
                    {volatilityData.var95 !== undefined && ` | VaR 95%: ${(volatilityData.var95 * 100).toFixed(2)}%`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                  <TrendingUp size={32} className="text-blue-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-300">
                    Grafico Volatilità Interattivo
                  </p>
                  <p className="text-slate-400">
                    Questa visualizzazione è in fase di sviluppo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="dark-card rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
          <TrendingUp size={24} />
          Analisi Volatilità
        </h3>
        <button
          onClick={handleTheoryClick}
          className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors"
        >
          <Info size={14} />
          Teoria
        </button>
      </div>
      {renderContent()}
    </div>
  );
}
