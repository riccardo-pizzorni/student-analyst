import { useAnalysis } from '@/context/AnalysisContext';
import {
  Activity,
  AlertTriangle,
  Info,
  Loader,
  TrendingUp,
} from 'lucide-react';

export default function VolatilityChart() {
  const { analysisState } = useAnalysis();
  const { analysisResults, isLoading, error } = analysisState;

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

    const { annualizedVolatility, sharpeRatio } = analysisResults.volatility;

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
              {(annualizedVolatility.value * 100).toFixed(1)}%
            </div>
            <div className="w-full bg-red-950/50 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (annualizedVolatility.value / 0.3) * 100)}%`,
                }} // Example scaling
              ></div>
            </div>
            <p className="text-sm text-red-200">
              {annualizedVolatility.description} (
              {(annualizedVolatility.benchmark * 100).toFixed(1)}%)
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={20} className="text-blue-400" />
              <h4 className="font-semibold text-blue-300">Sharpe Ratio</h4>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {sharpeRatio.value.toFixed(2)}
            </div>
            <div className="w-full bg-blue-950/50 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (sharpeRatio.value / sharpeRatio.max) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-blue-200">{sharpeRatio.description}</p>
          </div>
        </div>

        {/* Interactive Chart Area */}
        <div className="bg-gradient-to-br from-slate-900/50 to-blue-950/30 border border-blue-500/20 rounded-xl p-6">
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
        <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
          <Info size={14} />
          Teoria
        </button>
      </div>
      {renderContent()}
    </div>
  );
}
