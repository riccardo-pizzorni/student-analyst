import { useAnalysis } from '@/context/AnalysisContext';
import { Activity, AlertCircle, GitBranch, Info, Loader } from 'lucide-react';

export default function CorrelationMatrix() {
  const { analysisState } = useAnalysis();
  const { analysisResults, isLoading, error } = analysisState;

  const getCorrelationColor = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.7) return 'bg-red-500';
    if (absValue >= 0.5) return 'bg-orange-500';
    if (absValue >= 0.3) return 'bg-yellow-500';
    if (absValue >= 0.1) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getCorrelationOpacity = (value: number) => {
    if (value === 1) return 1;
    return Math.abs(value) * 0.7 + 0.3;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader className="animate-spin rounded-full h-12 w-12 mx-auto text-blue-500" />
            <p className="text-blue-300">Calcolando correlazioni...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="text-red-500 mx-auto" />
            <h4 className="text-xl font-bold text-red-300">Errore</h4>
            <p className="text-red-400 max-w-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisResults || !analysisResults.correlation) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Activity size={48} className="text-blue-400 mx-auto" />
            <h4 className="text-xl font-bold text-slate-200">
              Dati non Disponibili
            </h4>
            <p className="text-slate-400">
              Avvia un'analisi per calcolare la matrice di correlazione.
            </p>
          </div>
        </div>
      );
    }

    const {
      matrix,
      diversificationIndex,
      averageCorrelation,
      riskReduction,
      highCorrelationAlert,
    } = analysisResults.correlation;

    return (
      <>
        {/* Correlation Warning */}
        {highCorrelationAlert && (
          <div className="bg-orange-950/30 border border-orange-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-orange-400" />
              <div>
                <h4 className="font-semibold text-orange-300">
                  Alert Diversificazione
                </h4>
                <p className="text-sm text-orange-200">
                  Rilevate correlazioni elevate tra {highCorrelationAlert.pair}{' '}
                  ({highCorrelationAlert.value.toFixed(2)})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Correlation Matrix */}
        <div className="bg-gradient-to-br from-slate-900/50 to-blue-950/30 border border-blue-500/20 rounded-xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  {matrix.map((item: { symbol: string }) => (
                    <th
                      key={item.symbol}
                      className="p-2 text-xs font-semibold text-blue-300"
                    >
                      {item.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row: { symbol: string; values: number[] }) => (
                  <tr key={row.symbol}>
                    <td className="p-2 text-xs font-semibold text-blue-300">
                      {row.symbol}
                    </td>
                    {row.values.map((value: number, j: number) => (
                      <td key={j} className="p-1">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white ${getCorrelationColor(value)}`}
                          style={{ opacity: getCorrelationOpacity(value) }}
                          title={`${row.symbol} / ${matrix[j].symbol}: ${value.toFixed(2)}`}
                        >
                          {value.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diversification Index */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 border border-green-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-green-300 mb-2">
              Indice Diversificazione
            </h4>
            <div className="text-2xl font-bold text-green-400">
              {diversificationIndex.value.toFixed(2)}
            </div>
            <p className="text-xs text-green-200">
              {diversificationIndex.label}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">
              Correlazione Media
            </h4>
            <div className="text-2xl font-bold text-blue-400">
              {averageCorrelation.value.toFixed(2)}
            </div>
            <p className="text-xs text-blue-200">{averageCorrelation.label}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-purple-300 mb-2">
              Risk Reduction
            </h4>
            <div className="text-2xl font-bold text-purple-400">
              {(riskReduction.value * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-purple-200">{riskReduction.label}</p>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dark-card rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
          <GitBranch size={24} />
          Matrice delle Correlazioni
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
