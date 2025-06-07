/**
 * StorageVisualizationCharts - Grafici Visualizzazione Storage
 * 
 * Features:
 * - Pie charts per breakdown per tipo dati
 * - Bar charts per layer usage
 * - Interactive charts con drill-down
 * - Real-time updates
 */

import React, { useState, useMemo } from 'react';
import { StorageBreakdown } from '../services/ManualStorageManagementService';

interface StorageVisualizationChartsProps {
  breakdown: StorageBreakdown;
  onCategoryClick?: (category: string) => void;
  onLayerClick?: (layer: 'L1' | 'L2' | 'L3') => void;
}

const StorageVisualizationCharts: React.FC<StorageVisualizationChartsProps> = ({
  breakdown,
  onCategoryClick,
  onLayerClick
}) => {
  const [activeChart, setActiveChart] = useState<'types' | 'layers' | 'symbols'>('types');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, (i))).toFixed(2))} ${sizes[i]}`;
  };

  const getColorForIndex = (index: number): string => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
    ];
    return colors[index % colors.length];
  };

  // Data for pie chart
  const pieChartData = useMemo(() => {
    const data = Object.values(breakdown.byType)
      .sort((a, b) => b.size - a.size)
      .slice(0, 8); // Top 8 categories

    const total = data.reduce((sum, item) => sum + item.size, 0);
    let currentAngle = 0;

    return data.map((item) => {
      const percentage = total > 0 ? (item.size / total) * 100 : 0;
      const angle = (item.size / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      return {
        ...item,
        percentage,
        angle,
        startAngle,
        endAngle: currentAngle,
        color: getColorForIndex(index)
      };
    });
  }, [breakdown.byType]);

  // Data for bar chart (layers)
  const barChartData = useMemo(() => {
    return (['L1', 'L2', 'L3'] as const).map((layer) => ({
      layer,
      name: layer === 'L1' ? 'Memory Cache' : layer === 'L2' ? 'LocalStorage' : 'IndexedDB',
      usedSize: breakdown.byLayer[layer].usedSize,
      quota: breakdown.byLayer[layer].quota,
      percentage: breakdown.byLayer[layer].usagePercentage,
      itemCount: breakdown.byLayer[layer].itemCount,
      color: getColorForIndex(index)
    }));
  }, [breakdown.byLayer]);

  // Data for symbols chart
  const symbolsData = useMemo(() => {
    return Object.values(breakdown.bySymbol)
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 10) // Top 10 symbols
      .map((item) => ({
        ...item,
        color: getColorForIndex(index)
      }));
  }, [breakdown.bySymbol]);

  const createPieSlicePath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const renderPieChart = () => {
    const centerX = 120;
    const centerY = 120;
    const radius = 100;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <svg width="240" height="240" style={{ overflow: 'visible' }}>
          {pieChartData.map((slice) => (
            <g key={slice.type}>
              <path
                d={createPieSlicePath(centerX, centerY, radius, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(_e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.transformOrigin = `${centerX}px ${centerY}px`;
                }}
                onMouseLeave={(_e) => {
                  e.currentTarget.style.filter = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onClick={() => onCategoryClick?.(slice.type)}
              />
              
              {/* Label for larger slices */}
              {slice.percentage > 5 && (
                <text
                  x={centerX + (radius * 0.7 * Math.cos((slice.startAngle + slice.endAngle) / 2 * Math.PI / 180 - Math.PI / 2))}
                  y={centerY + (radius * 0.7 * Math.sin((slice.startAngle + slice.endAngle) / 2 * Math.PI / 180 - Math.PI / 2))}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {Math.round(slice.percentage)}%
                </text>
              )}
            </g>
          ))}
        </svg>

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            Breakdown per Tipo Dati
          </h4>
          
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {pieChartData.map((slice) => (
              <div
                key={slice.type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(_e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(_e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onClick={() => onCategoryClick?.(slice.type)}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: slice.color,
                    borderRadius: '2px',
                    marginRight: '8px'
                  }}
                />
                
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <div style={{ fontWeight: '500' }}>{slice.name}</div>
                  <div style={{ color: '#6B7280', fontSize: '12px' }}>
                    {formatBytes(slice.size)} ({Math.round(slice.percentage)}%)
                  </div>
                </div>
                
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {slice.count} items
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const maxQuota = Math.max(...barChartData.map(d => d.quota));
    const chartHeight = 200;

    return (
      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Utilizzo per Layer
        </h4>
        
        <div style={{ display: 'flex', alignItems: 'end', gap: '24px', height: chartHeight }}>
          {barChartData.map((item) => {
            const barHeight = maxQuota > 0 ? (item.usedSize / maxQuota) * (chartHeight - 40) : 0;
            const quotaHeight = maxQuota > 0 ? (item.quota / maxQuota) * (chartHeight - 40) : 0;

            return (
              <div
                key={item.layer}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => onLayerClick?.(item.layer)}
              >
                {/* Bar container */}
                <div
                  style={{
                    width: '60px',
                    height: quotaHeight,
                    backgroundColor: '#E5E7EB',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative',
                    border: '1px solid #D1D5DB'
                  }}
                >
                  {/* Used space bar */}
                  <div
                    style={{
                      width: '100%',
                      height: barHeight,
                      backgroundColor: item.color,
                      position: 'absolute',
                      bottom: 0,
                      borderRadius: '0 0 3px 3px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(_e) => {
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={(_e) => {
                      e.currentTarget.style.filter = 'none';
                    }}
                  />
                  
                  {/* Percentage label */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: item.color
                    }}
                  >
                    {Math.round(item.percentage)}%
                  </div>
                </div>

                {/* Layer name */}
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {item.layer}
                </div>
                
                <div style={{
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  marginTop: '2px'
                }}>
                  {item.name}
                </div>

                {/* Usage info */}
                <div style={{
                  fontSize: '10px',
                  color: '#6B7280',
                  textAlign: 'center',
                  marginTop: '4px'
                }}>
                  <div>{formatBytes(item.usedSize)}</div>
                  <div>/ {formatBytes(item.quota)}</div>
                  <div>{item.itemCount} items</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSymbolsChart = () => {
    const maxSize = Math.max(...symbolsData.map(s => s.totalSize));

    return (
      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Top Simboli per Utilizzo
        </h4>
        
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {symbolsData.map((symbolData) => {
            const barWidth = maxSize > 0 ? (symbolData.totalSize / maxSize) * 100 : 0;

            return (
              <div
                key={symbolData.symbol}
                style={{
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {symbolData.symbol}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                    {formatBytes(symbolData.totalSize)}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      backgroundColor: symbolData.color,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#6B7280'
                }}>
                  <span>{symbolData.count} elementi</span>
                  <span>Layers: {symbolData.layers.join(', ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Chart Navigation */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            📈 Storage Analytics
          </h2>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'types', label: '📊 Tipi', count: Object.keys(breakdown.byType).length },
              { key: 'layers', label: '📚 Layer', count: 3 },
              { key: 'symbols', label: '🏢 Simboli', count: Object.keys(breakdown.bySymbol).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key as any)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeChart === tab.key ? '#3B82F6' : 'white',
                  color: activeChart === tab.key ? 'white' : '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div style={{ padding: '24px' }}>
        {activeChart === 'types' && renderPieChart()}
        {activeChart === 'layers' && renderBarChart()}
        {activeChart === 'symbols' && renderSymbolsChart()}
      </div>

      {/* Summary Stats */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        borderRadius: '0 0 12px 12px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          fontSize: '12px',
          color: '#6B7280'
        }}>
          <div>
            <strong>Spazio Totale:</strong><br />
            {formatBytes(breakdown.totalSize)}
          </div>
          <div>
            <strong>Elementi Totali:</strong><br />
            {breakdown.totalCount.toLocaleString()}
          </div>
          <div>
            <strong>Categorie:</strong><br />
            {Object.keys(breakdown.byType).length}
          </div>
          <div>
            <strong>Simboli Unici:</strong><br />
            {Object.keys(breakdown.bySymbol).length}
          </div>
          <div>
            <strong>Ultimo Aggiornamento:</strong><br />
            {new Date(breakdown.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageVisualizationCharts; 

