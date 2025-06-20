import React from 'react';
import { Zap, TrendingUp, Award, Info } from 'lucide-react';

export default function PerformanceMetrics() {
  const metrics = [
    {
      label: 'CAGR',
      value: '12.8%',
      color: 'from-green-500 to-emerald-400',
      bgColor: 'from-green-950/30 to-emerald-950/30',
      borderColor: 'border-green-500/30',
    },
    {
      label: 'Sharpe Ratio',
      value: '1.42',
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'from-blue-950/30 to-cyan-950/30',
      borderColor: 'border-blue-500/30',
    },
    {
      label: 'Sortino Ratio',
      value: '1.89',
      color: 'from-purple-500 to-pink-400',
      bgColor: 'from-purple-950/30 to-pink-950/30',
      borderColor: 'border-purple-500/30',
    },
    {
      label: 'Calmar Ratio',
      value: '0.76',
      color: 'from-orange-500 to-yellow-400',
      bgColor: 'from-orange-950/30 to-yellow-950/30',
      borderColor: 'border-orange-500/30',
    },
  ];

  return (
    <div className="dark-card rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
          <Zap size={24} />
          Metriche di Performance
        </h3>
        <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
          <Info size={14} />
          Teoria
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`bg-gradient-to-br ${metric.bgColor} border ${metric.borderColor} rounded-xl p-6 relative overflow-hidden`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-slate-300" />
                <span className="text-sm font-medium text-slate-300">
                  {metric.label}
                </span>
              </div>
              <div
                className={`text-2xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}
              >
                {metric.value}
              </div>
            </div>
            <div
              className={`absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br ${metric.color} opacity-10 rounded-full transform translate-x-6 translate-y-6`}
            ></div>
          </div>
        ))}
      </div>

      {/* Performance Comparison Chart */}
      <div className="bg-gradient-to-br from-slate-900/50 to-blue-950/30 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-blue-300">
            Confronto vs Benchmark
          </h4>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-slate-400">Portafoglio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
              <span className="text-xs text-slate-400">S&P 500</span>
            </div>
          </div>
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="text-center space-y-4">
            <TrendingUp
              size={48}
              className="mx-auto text-blue-400 animate-pulse"
            />
            <div>
              <p className="text-lg font-bold text-blue-300">
                Performance Comparativa
              </p>
              <p className="text-slate-400">
                Analisi multi-temporale dei rendimenti
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
