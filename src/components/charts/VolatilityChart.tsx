
import React from "react";
import { TrendingUp, AlertTriangle, Info } from "lucide-react";

export default function VolatilityChart() {
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
      
      {/* Volatility Visualization */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-red-950/30 to-orange-950/30 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-red-400" />
            <h4 className="font-semibold text-red-300">Volatilità Annualizzata</h4>
          </div>
          <div className="text-3xl font-bold text-red-400 mb-2">23.7%</div>
          <div className="w-full bg-red-950/50 rounded-full h-2 mb-3">
            <div className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
          <p className="text-sm text-red-200">Rischio elevato vs benchmark (15.2%)</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={20} className="text-blue-400" />
            <h4 className="font-semibold text-blue-300">Sharpe Ratio</h4>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">1.42</div>
          <div className="w-full bg-blue-950/50 rounded-full h-2 mb-3">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{ width: '71%' }}></div>
          </div>
          <p className="text-sm text-blue-200">Buona performance risk-adjusted</p>
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
              <p className="text-lg font-bold text-blue-300">Grafico Volatilità Interattivo</p>
              <p className="text-slate-400">Analisi dinamica del rischio temporale</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
