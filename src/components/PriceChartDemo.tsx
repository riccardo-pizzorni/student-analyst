import React, { useState, useMemo } from 'react';
import { PriceChart, PriceDataPoint, AssetConfig } from '@/components/ui/PriceChart';
import { cn } from '@/lib/utils';

// Generate mock data for demo
function generateMockData(symbol: string, days: number = 252): PriceDataPoint[] {
  const basePrice = 100 + Math.random() * 400;
  const volatility = 0.02 + Math.random() * 0.03;
  const data: PriceDataPoint[] = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const randomChange = (Math.random() - 0.48) * volatility;
    currentPrice *= (1 + randomChange);
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      [symbol]: Math.round(currentPrice * 100) / 100
    });
  }
  
  return data;
}

export function PriceChartDemo() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL']);
  const [chartOptions, setChartOptions] = useState({
    showBrush: true,
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    height: 400
  });

  // Generate mock data for selected assets
  const mockData = useMemo(() => {
    if (selectedAssets.length === 0) return [];
    
    // Generate data for each asset
    const assetDataArrays = selectedAssets.map(symbol => generateMockData(symbol));
    
    // Merge all data by date
    const allDates = new Set<string>();
    assetDataArrays.forEach(assetData => {
      assetData.forEach(point => allDates.add(point.date));
    });
    
    const sortedDates = Array.from(allDates).sort();
    return sortedDates.map(date => {
      const basePoint: PriceDataPoint = {
        date,
        timestamp: new Date(date).getTime()
      };
      
      assetDataArrays.forEach(assetData => {
        const point = assetData.find(p => p.date === date);
        if (point) {
          Object.keys(point).forEach(key => {
            if (key !== 'date' && key !== 'timestamp') {
              basePoint[key] = point[key];
            }
          });
        }
      });
      
      return basePoint;
    });
  }, [selectedAssets]);

  // Asset configurations
  const assets: AssetConfig[] = useMemo(() => {
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];
    return selectedAssets.map((symbol, index) => ({
      symbol,
      name: symbol,
      color: colors[index % colors.length],
      visible: true
    }));
  }, [selectedAssets]);

  const availableAssets = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];

  const toggleAsset = (symbol: string) => {
    setSelectedAssets(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Price Charts Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Grafici interattivi dei prezzi storici con funzionalità di zoom, pan e overlay multipli. 
          Utilizza dati mock per la dimostrazione.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Controlli Demo
        </h3>
        
        {/* Asset Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona Asset da Visualizzare
            </label>
            <div className="flex flex-wrap gap-2">
              {availableAssets.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => toggleAsset(symbol)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    selectedAssets.includes(symbol)
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300"
                  )}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartOptions.showBrush}
                onChange={(e) => setChartOptions(prev => ({ ...prev, showBrush: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Zoom/Pan</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartOptions.showGrid}
                onChange={(e) => setChartOptions(prev => ({ ...prev, showGrid: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Griglia</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartOptions.showLegend}
                onChange={(e) => setChartOptions(prev => ({ ...prev, showLegend: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Legenda</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartOptions.showTooltip}
                onChange={(e) => setChartOptions(prev => ({ ...prev, showTooltip: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Tooltip</span>
            </label>
          </div>

          {/* Height Control */}
          <div className="flex items-center gap-4">
            <label htmlFor="chart-height-slider" className="text-sm font-medium text-gray-700">
              Altezza Grafico:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="chart-height-slider"
                type="range"
                min="300"
                max="800"
                step="50"
                value={chartOptions.height}
                onChange={(e) => setChartOptions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                className="w-32"
                aria-label="Altezza grafico in pixel"
              />
              <span className="text-sm text-gray-600 min-w-[60px]">
                {chartOptions.height}px
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PriceChart
          data={mockData}
          assets={assets}
          title="Prezzi Storici (Dati Mock)"
          height={chartOptions.height}
          showBrush={chartOptions.showBrush}
          showGrid={chartOptions.showGrid}
          showLegend={chartOptions.showLegend}
          showTooltip={chartOptions.showTooltip}
          onZoom={(start, end) => {
            console.log(`Zoom: ${start} - ${end}`);
          }}
        />
      </div>

      {/* Features */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Funzionalità Implementate
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Visualizzazione</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Line chart interattivi</li>
              <li>✅ Tooltip con data e prezzo</li>
              <li>✅ Zoom e pan con brush</li>
              <li>✅ Multiple assets overlay</li>
              <li>✅ Responsive design</li>
              <li>✅ Configurazioni personalizzabili</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Dati e Performance</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Dati mock realistici</li>
              <li>✅ Performance ottimizzata</li>
              <li>✅ Error handling robusto</li>
              <li>✅ Loading states</li>
              <li>✅ Supporto per 100+ assets</li>
              <li>✅ Cache intelligente (hook)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 

