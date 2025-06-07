/**
 * STUDENT ANALYST - Desktop Chart Controls
 * Advanced chart controls for desktop environment with professional features
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './DesktopChartControls.css';

interface DesktopChartControlsProps {
  chartData: any[];
  onDataChange: (data: any[]) => void;
  onExport: (format: string) => void;
  onZoom: (zoomLevel: number) => void;
  onPan: (direction: string) => void;
  onReset: () => void;
  chartType: string;
  onChartTypeChange: (type: string) => void;
  className?: string;
}

interface ChartPreset {
  id: string;
  name: string;
  description: string;
  settings: {
    type: string;
    timeframe: string;
    indicators: string[];
    overlays: string[];
  };
}

interface Annotation {
  id: string;
  type: 'trend' | 'support' | 'resistance' | 'note';
  x: number;
  y: number;
  value: number;
  color: string;
  text?: string;
}

const DesktopChartControls: React.FC<DesktopChartControlsProps> = ({
  chartData,
  onDataChange,
  onExport,
  onZoom,
  onPan,
  onReset,
  chartType,
  onChartTypeChange,
  className = ''
}) => {
  // State Management
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'indicators' | 'annotations' | 'export'>('chart');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [timeframe, setTimeframe] = useState('1D');
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['SMA']);
  const [customPresets, setCustomPresets] = useState<ChartPreset[]>([]);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [annotationType, setAnnotationType] = useState<'trend' | 'support' | 'resistance' | 'note'>('trend');

  // Refs
  const controlsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Chart Types
  const chartTypes = useMemo(() => [
    { id: 'line', name: 'Line Chart', icon: '📈' },
    { id: 'candlestick', name: 'Candlestick', icon: '🕯️' },
    { id: 'bar', name: 'Bar Chart', icon: '📊' },
    { id: 'area', name: 'Area Chart', icon: '🏔️' },
    { id: 'scatter', name: 'Scatter Plot', icon: '⚡' },
    { id: 'heatmap', name: 'Heatmap', icon: '🌡️' }
  ], []);

  // Technical Indicators
  const indicators = useMemo(() => [
    { id: 'SMA', name: 'Simple Moving Average', category: 'Trend' },
    { id: 'EMA', name: 'Exponential Moving Average', category: 'Trend' },
    { id: 'RSI', name: 'Relative Strength Index', category: 'Momentum' },
    { id: 'MACD', name: 'MACD', category: 'Momentum' },
    { id: 'BB', name: 'Bollinger Bands', category: 'Volatility' },
    { id: 'ATR', name: 'Average True Range', category: 'Volatility' },
    { id: 'STOCH', name: 'Stochastic Oscillator', category: 'Momentum' },
    { id: 'OBV', name: 'On-Balance Volume', category: 'Volume' },
    { id: 'VWAP', name: 'Volume Weighted Average Price', category: 'Volume' },
    { id: 'ADX', name: 'Average Directional Index', category: 'Trend' }
  ], []);

  // Timeframes
  const timeframes = useMemo(() => [
    { id: '1m', name: '1 Minute', shortcut: 'M' },
    { id: '5m', name: '5 Minutes', shortcut: '5' },
    { id: '15m', name: '15 Minutes', shortcut: 'F' },
    { id: '1h', name: '1 Hour', shortcut: 'H' },
    { id: '4h', name: '4 Hours', shortcut: '4' },
    { id: '1D', name: '1 Day', shortcut: 'D' },
    { id: '1W', name: '1 Week', shortcut: 'W' },
    { id: '1M', name: '1 Month', shortcut: 'O' }
  ], []);

  // Export Formats
  const exportFormats = useMemo(() => [
    { id: 'png', name: 'PNG Image', icon: '🖼️' },
    { id: 'jpg', name: 'JPEG Image', icon: '📷' },
    { id: 'svg', name: 'SVG Vector', icon: '📐' },
    { id: 'pdf', name: 'PDF Document', icon: '📄' },
    { id: 'csv', name: 'CSV Data', icon: '📋' },
    { id: 'json', name: 'JSON Data', icon: '📊' }
  ], []);

  // Chart Presets
  const chartPresets = useMemo(() => [
    {
      id: 'default',
      name: 'Default View',
      description: 'Standard price chart with volume',
      settings: {
        type: 'candlestick',
        timeframe: '1D',
        indicators: ['SMA'],
        overlays: ['volume']
      }
    },
    {
      id: 'technical',
      name: 'Technical Analysis',
      description: 'Full technical analysis setup',
      settings: {
        type: 'candlestick',
        timeframe: '1D',
        indicators: ['SMA', 'EMA', 'RSI', 'MACD'],
        overlays: ['volume', 'bollinger']
      }
    },
    {
      id: 'momentum',
      name: 'Momentum Focus',
      description: 'Momentum indicators emphasis',
      settings: {
        type: 'line',
        timeframe: '4h',
        indicators: ['RSI', 'MACD', 'STOCH'],
        overlays: ['volume']
      }
    },
    {
      id: 'volume',
      name: 'Volume Analysis',
      description: 'Volume-based analysis',
      settings: {
        type: 'bar',
        timeframe: '1h',
        indicators: ['OBV', 'VWAP'],
        overlays: ['volume', 'volume_profile']
      }
    }
  ], []);

  // Handle zoom change
  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(25, Math.min(400, zoomLevel + delta));
    setZoomLevel(newZoom);
    onZoom(newZoom / 100);
  }, [zoomLevel, onZoom]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe);
    // Trigger data reload with new timeframe
    onDataChange([...chartData]);
  }, [chartData, onDataChange]);

  // Handle indicator toggle
  const handleIndicatorToggle = useCallback((indicatorId: string) => {
    setSelectedIndicators(prev => {
      if (prev.includes(indicatorId)) {
        return prev.filter(id => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  }, []);

  // Handle chart preset application
  const handlePresetApply = useCallback((preset: ChartPreset) => {
    onChartTypeChange(preset.settings.type);
    setTimeframe(preset.settings.timeframe);
    setSelectedIndicators(preset.settings.indicators);
  }, [onChartTypeChange]);

  // Add annotation
  const handleAddAnnotation = useCallback((x: number, y: number, value: number) => {
    if (!isAddingAnnotation) return;

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: annotationType,
      x,
      y,
      value,
      color: annotationType === 'support' ? '#059669' : 
             annotationType === 'resistance' ? '#dc2626' :
             annotationType === 'trend' ? '#2563eb' : '#f59e0b'
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setIsAddingAnnotation(false);
  }, [isAddingAnnotation, annotationType]);

  // Delete annotation
  const handleDeleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case 'm':
          handleTimeframeChange('1m');
          break;
        case '5':
          handleTimeframeChange('5m');
          break;
        case 'f':
          handleTimeframeChange('15m');
          break;
        case 'h':
          handleTimeframeChange('1h');
          break;
        case '4':
          handleTimeframeChange('4h');
          break;
        case 'd':
          handleTimeframeChange('1D');
          break;
        case 'w':
          handleTimeframeChange('1W');
          break;
        case 'o':
          handleTimeframeChange('1M');
          break;
        case '+':
        case '=':
          handleZoom(25);
          e.preventDefault();
          break;
        case '-':
          handleZoom(-25);
          e.preventDefault();
          break;
        case '0':
          setZoomLevel(100);
          onZoom(1);
          e.preventDefault();
          break;
        case 'r':
          onReset();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleTimeframeChange, handleZoom, onZoom, onReset]);

  // CSS classes
  const controlsClasses = [
    'desktop-chart-controls',
    className,
    isExpanded ? 'expanded' : 'collapsed'
  ].filter(Boolean).join(' ');

  return (
    <div ref={controlsRef} className={controlsClasses}>
      {/* Controls Header */}
      <div className="controls-header">
        <div className="header-left">
          <h3>📊 Chart Controls</h3>
          <span className="chart-info">
            {chartType.toUpperCase()} • {timeframe} • {zoomLevel}%
          </span>
        </div>
        
        <div className="header-right">
          <div className="quick-actions">
            <button
              className="quick-action-btn"
              onClick={() => handleZoom(-25)}
              title="Zoom Out (-)"
            >
              🔍−
            </button>
            <button
              className="quick-action-btn"
              onClick={() => handleZoom(25)}
              title="Zoom In (+)"
            >
              🔍+
            </button>
            <button
              className="quick-action-btn"
              onClick={onReset}
              title="Reset View (R)"
            >
              🔄
            </button>
          </div>
          
          <button
            className="expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Controls' : 'Expand Controls'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Controls Content */}
      {isExpanded && (
        <div className="controls-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            {[
              { id: 'chart', name: 'Chart', icon: '📈' },
              { id: 'indicators', name: 'Indicators', icon: '📊' },
              { id: 'annotations', name: 'Annotations', icon: '✏️' },
              { id: 'export', name: 'Export', icon: '💾' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-name">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Chart Tab */}
            {activeTab === 'chart' && (
              <div className="chart-controls">
                {/* Chart Type */}
                <div className="control-group">
                  <label className="control-label">Chart Type</label>
                  <div className="chart-type-grid">
                    {chartTypes.map(type => (
                      <button
                        key={type.id}
                        className={`chart-type-btn ${chartType === type.id ? 'active' : ''}`}
                        onClick={() => onChartTypeChange(type.id)}
                        title={type.name}
                      >
                        <span className="type-icon">{type.icon}</span>
                        <span className="type-name">{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeframe */}
                <div className="control-group">
                  <label className="control-label">Timeframe</label>
                  <div className="timeframe-buttons">
                    {timeframes.map(tf => (
                      <button
                        key={tf.id}
                        className={`timeframe-btn ${timeframe === tf.id ? 'active' : ''}`}
                        onClick={() => handleTimeframeChange(tf.id)}
                        title={`${tf.name} (${tf.shortcut})`}
                      >
                        {tf.id}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Presets */}
                <div className="control-group">
                  <label className="control-label">Quick Presets</label>
                  <div className="preset-grid">
                    {chartPresets.map(preset => (
                      <button
                        key={preset.id}
                        className="preset-btn"
                        onClick={() => handlePresetApply(preset)}
                        title={preset.description}
                      >
                        <span className="preset-name">{preset.name}</span>
                        <span className="preset-desc">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Options */}
                <div className="control-group">
                  <label className="control-label">Display Options</label>
                  <div className="display-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                      />
                      <span className="checkbox-text">Grid Lines</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showLegend}
                        onChange={(e) => setShowLegend(e.target.checked)}
                      />
                      <span className="checkbox-text">Legend</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showVolume}
                        onChange={(e) => setShowVolume(e.target.checked)}
                      />
                      <span className="checkbox-text">Volume</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Indicators Tab */}
            {activeTab === 'indicators' && (
              <div className="indicators-controls">
                <div className="control-group">
                  <label className="control-label">Technical Indicators</label>
                  <div className="indicators-list">
                    {Object.entries(
                      indicators.reduce((acc, indicator) => {
                        if (!acc[indicator.category]) acc[indicator.category] = [];
                        acc[indicator.category].push(indicator);
                        return acc;
                      }, {} as Record<string, typeof indicators>)
                    ).map(([category, categoryIndicators]) => (
                      <div key={category} className="indicator-category">
                        <h4 className="category-title">{category}</h4>
                        <div className="category-indicators">
                          {categoryIndicators.map(indicator => (
                            <label key={indicator.id} className="indicator-item">
                              <input
                                type="checkbox"
                                checked={selectedIndicators.includes(indicator.id)}
                                onChange={() => handleIndicatorToggle(indicator.id)}
                              />
                              <span className="indicator-name">{indicator.name}</span>
                              <span className="indicator-id">({indicator.id})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Annotations Tab */}
            {activeTab === 'annotations' && (
              <div className="annotations-controls">
                <div className="control-group">
                  <label className="control-label">Drawing Tools</label>
                  <div className="annotation-tools">
                    <div className="tool-selector">
                      {[
                        { id: 'trend', name: 'Trend Line', icon: '📈' },
                        { id: 'support', name: 'Support', icon: '⬆️' },
                        { id: 'resistance', name: 'Resistance', icon: '⬇️' },
                        { id: 'note', name: 'Note', icon: '📝' }
                      ].map(tool => (
                        <button
                          key={tool.id}
                          className={`tool-btn ${annotationType === tool.id ? 'active' : ''}`}
                          onClick={() => setAnnotationType(tool.id as any)}
                        >
                          <span className="tool-icon">{tool.icon}</span>
                          <span className="tool-name">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                    
                    <button
                      className={`add-annotation-btn ${isAddingAnnotation ? 'active' : ''}`}
                      onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
                    >
                      {isAddingAnnotation ? 'Cancel Drawing' : 'Start Drawing'}
                    </button>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    Active Annotations ({annotations.length})
                  </label>
                  <div className="annotations-list">
                    {annotations.map(annotation => (
                      <div key={annotation.id} className="annotation-item">
                        <div 
                          className="annotation-color"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <span className="annotation-info">
                          {annotation.type.toUpperCase()} at {annotation.value.toFixed(2)}
                        </span>
                        <button
                          className="delete-annotation-btn"
                          onClick={() => handleDeleteAnnotation(annotation.id)}
                          title="Delete Annotation"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {annotations.length === 0 && (
                      <div className="no-annotations">
                        No annotations added yet. Select a tool and click on the chart.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className="export-controls">
                <div className="control-group">
                  <label className="control-label">Export Format</label>
                  <div className="export-formats">
                    {exportFormats.map(format => (
                      <button
                        key={format.id}
                        className="export-format-btn"
                        onClick={() => onExport(format.id)}
                        title={`Export as ${format.name}`}
                      >
                        <span className="format-icon">{format.icon}</span>
                        <span className="format-name">{format.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">Export Options</label>
                  <div className="export-options">
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked />
                      <span className="checkbox-text">Include Legend</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked />
                      <span className="checkbox-text">Include Annotations</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked />
                      <span className="checkbox-text">High Resolution</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span className="checkbox-text">Transparent Background</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <label htmlFor="zoom-slider" className="zoom-label">Zoom: {zoomLevel}%</label>
        <input
          id="zoom-slider"
          type="range"
          min="25"
          max="400"
          step="25"
          value={zoomLevel}
          onChange={(e) => {
            const newZoom = parseInt(e.target.value);
            setZoomLevel(newZoom);
            onZoom(newZoom / 100);
          }}
          className="zoom-slider"
          aria-label={`Zoom level: ${zoomLevel}%`}
        />
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="shortcuts-hint">
        <span>💡 Tip: Use keyboard shortcuts for quick navigation</span>
      </div>
    </div>
  );
};

export default DesktopChartControls; 

