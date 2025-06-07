import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';

// Types for price data
export interface PriceDataPoint {
  date: string;
  timestamp: number;
  [symbol: string]: number | string;
}

export interface AssetConfig {
  symbol: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface PriceChartProps {
  data: PriceDataPoint[];
  assets: AssetConfig[];
  title?: string;
  height?: number;
  showBrush?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  dateFormat?: string;
  priceFormat?: string;
  className?: string;
  onAssetToggle?: (symbol: string) => void;
  onZoom?: (startIndex: number, endIndex: number) => void;
  loading?: boolean;
  error?: string;
}

// Color palette for multiple assets
const DEFAULT_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ca8a04', // yellow
  '#9333ea', // purple
  '#c2410c', // orange
  '#0891b2', // cyan
  '#be123c', // rose
  '#4338ca', // indigo
  '#059669', // emerald
];

// Custom tooltip component
const CustomTooltip = ({ 
  active, 
  payload, 
  label,
  dateFormat = 'MMM dd, yyyy',
  priceFormat = '$0.00'
}: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 mb-2">
        {formatDate(label)}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.dataKey}:</span>
          <span className="font-medium text-gray-900">
            {formatPrice(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Asset toggle controls
const AssetControls = ({ 
  assets, 
  onAssetToggle 
}: { 
  assets: AssetConfig[]; 
  onAssetToggle?: (symbol: string) => void;
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {assets.map((asset) => (
        <button
          key={asset.symbol}
          onClick={() => onAssetToggle?.(asset.symbol)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
            asset.visible
              ? "bg-gray-100 text-gray-900 border border-gray-300"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          )}
        >
          <div 
            className={cn(
              "w-3 h-3 rounded-full",
              asset.visible ? "opacity-100" : "opacity-30"
            )}
            style={{ backgroundColor: asset.color }}
          />
          <span className="font-medium">{asset.symbol}</span>
          <span className="text-xs text-gray-500">{asset.name}</span>
        </button>
      ))}
    </div>
  );
};

// Loading skeleton
const ChartSkeleton = ({ height }: { height: number }) => (
  <div 
    className="animate-pulse bg-gray-100 rounded-lg flex items-center justify-center"
    style={{ height }}
  >
    <div className="text-gray-400 flex items-center gap-2">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span>Caricamento dati...</span>
    </div>
  </div>
);

// Error display
const ChartError = ({ 
  error, 
  height,
  onRetry 
}: { 
  error: string; 
  height: number;
  onRetry?: () => void;
}) => (
  <div 
    className="border border-red-200 bg-red-50 rounded-lg flex flex-col items-center justify-center gap-3"
    style={{ height }}
  >
    <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="text-center">
      <p className="text-red-700 font-medium">Errore nel caricamento grafico</p>
      <p className="text-red-600 text-sm mt-1">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Riprova
        </button>
      )}
    </div>
  </div>
);

export function PriceChart({
  data,
  assets,
  title,
  height = 400,
  showBrush = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  dateFormat = 'MMM dd',
  priceFormat = '$0.00',
  className,
  onAssetToggle,
  onZoom,
  loading = false,
  error
}: PriceChartProps) {
  const [brushStartIndex, setBrushStartIndex] = useState<number | null>(null);
  const [brushEndIndex, setBrushEndIndex] = useState<number | null>(null);

  // Assign colors to assets if not provided
  const assetsWithColors = useMemo(() => {
    return assets.map((asset, index) => ({
      ...asset,
      color: asset.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }));
  }, [assets]);

  // Filter visible assets
  const visibleAssets = useMemo(() => {
    return assetsWithColors.filter(asset => asset.visible);
  }, [assetsWithColors]);

  // Handle brush change for zoom functionality
  const handleBrushChange = useCallback((brushData: any) => {
    if (brushData) {
      const { startIndex, endIndex } = brushData;
      setBrushStartIndex(startIndex);
      setBrushEndIndex(endIndex);
      onZoom?.(startIndex, endIndex);
    }
  }, [onZoom]);

  // Format X-axis ticks
  const formatXAxisTick = useCallback((tickItem: string) => {
    try {
      const date = new Date(tickItem);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return tickItem;
    }
  }, []);

  // Format Y-axis ticks
  const formatYAxisTick = useCallback((value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  }, []);

  if (loading) {
    return <ChartSkeleton height={height} />;
  }

  if (error) {
    return <ChartError error={error} height={height} />;
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="border border-gray-200 bg-gray-50 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Nessun dato disponibile</p>
          <p className="text-sm mt-1">Aggiungi asset per visualizzare il grafico</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {(title || onAssetToggle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {title}
            </h3>
          )}
          
          {onAssetToggle && (
            <AssetControls 
              assets={assetsWithColors} 
              onAssetToggle={onAssetToggle} 
            />
          )}
        </div>
      )}

      {/* Chart */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            )}
            
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatXAxisTick}
              stroke="#d1d5db"
            />
            
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatYAxisTick}
              stroke="#d1d5db"
            />
            
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip dateFormat={dateFormat} priceFormat={priceFormat} />}
              />
            )}
            
            {showLegend && <Legend />}
            
            {/* Render lines for visible assets */}
            {visibleAssets.map((asset) => (
              <Line
                key={asset.symbol}
                type="monotone"
                dataKey={asset.symbol}
                stroke={asset.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: asset.color, strokeWidth: 2, fill: '#fff' }}
                name={asset.name || asset.symbol}
              />
            ))}
            
            {/* Brush for zoom functionality */}
            {showBrush && (
              <Brush 
                dataKey="date"
                height={30}
                stroke="#8884d8"
                onChange={handleBrushChange}
                tickFormatter={formatXAxisTick}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart info */}
      <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
        <span>
          {data.length} punti dati • {visibleAssets.length} asset visualizzati
        </span>
        {brushStartIndex !== null && brushEndIndex !== null && (
          <span>
            Zoom: {brushStartIndex + 1}-{brushEndIndex + 1} di {data.length}
          </span>
        )}
      </div>
    </div>
  );
} 