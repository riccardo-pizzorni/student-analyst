import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Calculator,
  Info,
  PieChart,
  Table,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import CorrelationMatrix from './charts/CorrelationMatrix';
import HistoricalChart from './charts/HistoricalChart';
import PerformanceMetrics from './charts/PerformanceMetrics';
import VolatilityChart from './charts/VolatilityChart';
import UnifiedInputSection from './input/UnifiedInputSection';

export default function MainTabs({
  activeStep,
  onShowGlossary,
}: {
  activeStep: string;
  onShowGlossary?: () => void;
}) {
  const getTabsForStep = (step: string) => {
    switch (step) {
      case 'input':
        return []; // No tabs for input step, unified interface
      case 'storica':
        return [
          { key: 'grafici', label: 'Grafici', icon: BarChart3 },
          { key: 'tabella', label: 'Dati', icon: Table },
        ];
      case 'performance':
        return [
          { key: 'metriche', label: 'Metriche', icon: TrendingUp },
          { key: 'confronto', label: 'Confronto', icon: BarChart3 },
        ];
      case 'rischio':
        return [
          { key: 'volatilita', label: 'Volatilità', icon: TrendingUp },
          { key: 'var', label: 'VaR & CVaR', icon: Calculator },
        ];
      case 'diversificazione':
        return [
          { key: 'correlazioni', label: 'Correlazioni', icon: BarChart3 },
          { key: 'cluster', label: 'Cluster', icon: PieChart },
        ];
      case 'fondamentale':
        return [
          { key: 'multipli', label: 'Multipli', icon: Calculator },
          { key: 'crescita', label: 'Crescita', icon: TrendingUp },
        ];
      case 'ottimizzazione':
        return [
          { key: 'frontiera', label: 'Frontiera', icon: TrendingUp },
          { key: 'pesi', label: 'Pesi Ottimali', icon: PieChart },
        ];
      case 'strategie':
        return [
          { key: 'backtest', label: 'Backtest', icon: BarChart3 },
          { key: 'confronto', label: 'Confronto', icon: Table },
        ];
      case 'regressiva':
        return [
          { key: 'capm', label: 'CAPM', icon: TrendingUp },
          { key: 'fattori', label: 'Fattori', icon: BarChart3 },
        ];
      default:
        return [
          { key: 'grafici', label: 'Grafici', icon: BarChart3 },
          { key: 'tabella', label: 'Dati', icon: Table },
        ];
    }
  };

  const tabs = getTabsForStep(activeStep);

  // Special case for input step - no tabs, just unified content
  if (activeStep === 'input') {
    return (
      <div className="w-full h-full">
        <div className="h-full">
          <UnifiedInputSection />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs defaultValue={tabs[0]?.key} className="w-full">
        <TabsList
          className="grid w-full bg-slate-800/50 rounded-xl p-1 border border-slate-700"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-blue-500/30 text-slate-400 hover:text-slate-300"
              >
                <TabIcon size={16} />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Performance Step */}
        {activeStep === 'performance' && (
          <>
            <TabsContent value="metriche" className="mt-6">
              <PerformanceMetrics />
            </TabsContent>

            <TabsContent value="confronto" className="mt-6">
              <div className="dark-card rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
                    <BarChart3 size={24} />
                    Confronto Performance
                  </h3>
                  <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Info size={14} />
                    Teoria
                  </button>
                </div>
                <div className="w-full h-96 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <BarChart3
                      size={64}
                      className="mx-auto text-blue-400 animate-pulse"
                    />
                    <div>
                      <p className="text-xl font-bold text-blue-300">
                        Benchmark Comparison
                      </p>
                      <p className="text-slate-400">
                        Performance vs indici di mercato
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </>
        )}

        {/* Risk Step */}
        {activeStep === 'rischio' && (
          <>
            <TabsContent value="volatilita" className="mt-6">
              <VolatilityChart />
            </TabsContent>

            <TabsContent value="var" className="mt-6">
              <div className="dark-card rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
                    <Calculator size={24} />
                    Value at Risk & CVaR
                  </h3>
                  <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Info size={14} />
                    Teoria
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-red-950/30 to-orange-950/30 border border-red-500/30 rounded-xl p-6">
                    <h4 className="font-semibold text-red-300 mb-4">
                      VaR (95%)
                    </h4>
                    <div className="text-3xl font-bold text-red-400 mb-2">
                      -4.2%
                    </div>
                    <p className="text-sm text-red-200">
                      Perdita massima attesa in 5% dei casi
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-500/30 rounded-xl p-6">
                    <h4 className="font-semibold text-purple-300 mb-4">
                      CVaR (95%)
                    </h4>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      -6.8%
                    </div>
                    <p className="text-sm text-purple-200">
                      Perdita media oltre il VaR
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </>
        )}

        {/* Diversification Step */}
        {activeStep === 'diversificazione' && (
          <>
            <TabsContent value="correlazioni" className="mt-6">
              <CorrelationMatrix />
            </TabsContent>

            <TabsContent value="cluster" className="mt-6">
              <div className="dark-card rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
                    <PieChart size={24} />
                    Cluster Analysis
                  </h3>
                  <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Info size={14} />
                    Teoria
                  </button>
                </div>
                <div className="w-full h-96 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <PieChart
                      size={64}
                      className="mx-auto text-blue-400 animate-pulse"
                    />
                    <div>
                      <p className="text-xl font-bold text-blue-300">
                        Dendrogramma Clustering
                      </p>
                      <p className="text-slate-400">
                        Raggruppamento per similarità
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </>
        )}

        {/* Historical Step */}
        {activeStep === 'storica' && (
          <>
            <TabsContent value="grafici" className="mt-6">
              <HistoricalChart />
            </TabsContent>

            <TabsContent value="tabella" className="mt-6">
              <div className="dark-card rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
                    <Table size={24} />
                    Dati Storici
                  </h3>
                  <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Info size={14} />
                    Info
                  </button>
                </div>
                <div className="w-full h-96 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Table
                      size={64}
                      className="mx-auto text-blue-400 animate-pulse"
                    />
                    <div>
                      <p className="text-xl font-bold text-blue-300">
                        Tabella Dati
                      </p>
                      <p className="text-slate-400">
                        Visualizzazione tabulare dei prezzi storici
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </>
        )}

        {/* Default content for other steps */}
        {!['performance', 'rischio', 'diversificazione'].includes(
          activeStep
        ) && (
          <>
            <TabsContent value={tabs[0]?.key} className="mt-6">
              <div className="dark-card rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
                    {React.createElement(tabs[0]?.icon, { size: 24 })}
                    {tabs[0]?.label}
                  </h3>
                  <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Info size={14} />
                    Teoria
                  </button>
                </div>
                <div className="w-full h-96 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <BarChart3
                      size={64}
                      className="mx-auto text-blue-400 animate-pulse"
                    />
                    <div>
                      <p className="text-xl font-bold text-blue-300">
                        Interactive Charts
                      </p>
                      <p className="text-slate-400">
                        Real-time data visualization
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {tabs.length > 1 && (
              <TabsContent value={tabs[1].key} className="mt-6">
                <div className="dark-card rounded-xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
                      {React.createElement(tabs[1].icon, { size: 24 })}
                      {tabs[1].label}
                    </h3>
                    <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors">
                      <Info size={14} />
                      Teoria
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-700">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                            Symbol
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                            Change
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                            Volume
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {['AAPL', 'MSFT', 'GOOGL', 'AMZN'].map((ticker, i) => (
                          <tr
                            key={ticker}
                            className="border-t border-slate-700 hover:bg-slate-800/30"
                          >
                            <td className="px-4 py-3 font-medium text-blue-300">
                              {ticker}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              ${(150 + i * 25).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-sm ${i % 2 === 0 ? 'text-green-400' : 'text-red-400'}`}
                              >
                                {i % 2 === 0 ? '+' : '-'}
                                {(Math.random() * 5).toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {(Math.random() * 1000000).toFixed(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
