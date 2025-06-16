
import React from "react";
import { GitBranch, Info, AlertCircle } from "lucide-react";

export default function CorrelationMatrix() {
  const correlationData = [
    { symbol: "AAPL", values: [1.00, 0.67, 0.45, 0.32, 0.28] },
    { symbol: "MSFT", values: [0.67, 1.00, 0.72, 0.41, 0.35] },
    { symbol: "GOOGL", values: [0.45, 0.72, 1.00, 0.38, 0.29] },
    { symbol: "AMZN", values: [0.32, 0.41, 0.38, 1.00, 0.44] },
    { symbol: "TSLA", values: [0.28, 0.35, 0.29, 0.44, 1.00] },
  ];

  const getCorrelationColor = (value: number) => {
    if (value >= 0.8) return "bg-red-500";
    if (value >= 0.6) return "bg-orange-500";
    if (value >= 0.4) return "bg-yellow-500";
    if (value >= 0.2) return "bg-green-500";
    return "bg-blue-500";
  };

  const getCorrelationOpacity = (value: number) => {
    return Math.abs(value) * 0.8 + 0.2;
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
      
      {/* Correlation Warning */}
      <div className="bg-orange-950/30 border border-orange-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-orange-400" />
          <div>
            <h4 className="font-semibold text-orange-300">Alert Diversificazione</h4>
            <p className="text-sm text-orange-200">Rilevate correlazioni elevate tra MSFT e GOOGL (0.72)</p>
          </div>
        </div>
      </div>
      
      {/* Correlation Matrix */}
      <div className="bg-gradient-to-br from-slate-900/50 to-blue-950/30 border border-blue-500/20 rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2"></th>
                {correlationData.map(item => (
                  <th key={item.symbol} className="p-2 text-xs font-semibold text-blue-300">{item.symbol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlationData.map((row, i) => (
                <tr key={row.symbol}>
                  <td className="p-2 text-xs font-semibold text-blue-300">{row.symbol}</td>
                  {row.values.map((value, j) => (
                    <td key={j} className="p-1">
                      <div 
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${getCorrelationColor(value)}`}
                        style={{ opacity: getCorrelationOpacity(value) }}
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
          <h4 className="font-semibold text-green-300 mb-2">Indice Diversificazione</h4>
          <div className="text-2xl font-bold text-green-400">0.73</div>
          <p className="text-xs text-green-200">Buona diversificazione</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border border-blue-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-blue-300 mb-2">Correlazione Media</h4>
          <div className="text-2xl font-bold text-blue-400">0.45</div>
          <p className="text-xs text-blue-200">Livello accettabile</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-purple-300 mb-2">Risk Reduction</h4>
          <div className="text-2xl font-bold text-purple-400">18.3%</div>
          <p className="text-xs text-purple-200">Beneficio diversificazione</p>
        </div>
      </div>
    </div>
  );
}
