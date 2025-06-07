/**
 * STUDENT ANALYST - CSV Data Exporter
 * Professional CSV export system for financial data
 */

import React, { useState, useCallback, useMemo } from 'react';
import './CSVExporter.css';

// Data interfaces for export
interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
  weight: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  sector?: string;
  currency?: string;
}

interface HistoricalDataPoint {
  date: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

interface ReturnsDataPoint {
  date: string;
  symbol: string;
  price: number;
  dailyReturn: number;
  cumulativeReturn: number;
  portfolioWeight: number;
  weightedReturn: number;
}

interface ExportMetadata {
  exportDate: string;
  portfolioName: string;
  totalValue: number;
  baseCurrency: string;
  dataSource: string;
  analysisDate: string;
  riskMetrics: {
    beta: number;
    sharpeRatio: number;
    volatility: number;
    var95: number;
    maxDrawdown: number;
  };
  performanceMetrics: {
    totalReturn: number;
    annualizedReturn: number;
    ytdReturn: number;
    monthlyReturn: number;
  };
}

interface CSVExporterProps {
  portfolioData: {
    holdings: PortfolioHolding[];
    historicalData: HistoricalDataPoint[];
    returnsData: ReturnsDataPoint[];
    metadata: ExportMetadata;
  };
  onExportComplete?: (filename: string, type: string) => void;
  className?: string;
}

type ExportType = 'portfolio_weights' | 'historical_data' | 'returns_series' | 'metadata' | 'full_package';

const CSVExporter: React.FC<CSVExporterProps> = ({
  portfolioData,
  onExportComplete,
  className = ''
}) => {
  // State management
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportSettings, setExportSettings] = useState({
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD' as 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY',
    numberFormat: 'decimal' as 'decimal' | 'percentage',
    delimiter: ',' as ',' | ';' | '\t',
    encoding: 'UTF-8' as 'UTF-8' | 'UTF-16',
    includeMetadata: true,
    timezone: 'UTC' as 'UTC' | 'Local'
  });

  // Export statistics
  const exportStats = useMemo(() => {
    return {
      holdingsCount: portfolioData.holdings.length,
      historicalDataPoints: portfolioData.historicalData.length,
      returnsDataPoints: portfolioData.returnsData.length,
      dateRange: {
        start: portfolioData.historicalData.length > 0 
          ? portfolioData.historicalData[0].date 
          : '',
        end: portfolioData.historicalData.length > 0 
          ? portfolioData.historicalData[portfolioData.historicalData.length - 1].date 
          : ''
      }
    };
  }, [portfolioData]);

  // CSV utility functions
  const escapeCSVField = useCallback((field: any): string => {
    if (field === null || field === undefined) return '';
    
    const stringField = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    
    return stringField;
  }, []);

  const formatNumber = useCallback((value: number, type: 'currency' | 'percentage' | 'decimal' = 'decimal'): string => {
    if (isNaN(value)) return '0';
    
    switch (type) {
      case 'currency':
        return value.toFixed(2);
      case 'percentage':
        return exportSettings.numberFormat === 'percentage' 
          ? `${(value * 100).toFixed(2)}%` 
          : (value * 100).toFixed(4);
      case 'decimal':
      default:
        return value.toFixed(4);
    }
  }, [exportSettings.numberFormat]);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    
    switch (exportSettings.dateFormat) {
      case 'MM/DD/YYYY':
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'DD/MM/YYYY':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'YYYY-MM-DD':
      default:
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
  }, [exportSettings.dateFormat]);

  // Export functions
  const exportPortfolioWeights = useCallback(async (): Promise<string> => {
    setExportStatus('Generating portfolio weights CSV...');
    
    const headers = [
      'Symbol',
      'Company Name',
      'Shares',
      'Current Price',
      'Total Value',
      'Portfolio Weight (%)',
      'Day Change ($)',
      'Day Change (%)',
      'Total Return ($)',
      'Total Return (%)',
      'Sector',
      'Currency'
    ];

    const rows = portfolioData.holdings.map(holding => [
      escapeCSVField(holding.symbol),
      escapeCSVField(holding.name),
      formatNumber(holding.shares, 'decimal'),
      formatNumber(holding.currentPrice, 'currency'),
      formatNumber(holding.totalValue, 'currency'),
      formatNumber(holding.weight, 'percentage'),
      formatNumber(holding.dayChange, 'currency'),
      formatNumber(holding.dayChangePercent, 'percentage'),
      formatNumber(holding.totalReturn, 'currency'),
      formatNumber(holding.totalReturnPercent, 'percentage'),
      escapeCSVField(holding.sector || 'N/A'),
      escapeCSVField(holding.currency || 'USD')
    ]);

    const csvContent = [
      ...(exportSettings.includeHeaders ? [headers.join(exportSettings.delimiter)] : []),
      ...rows.map(row => row.join(exportSettings.delimiter))
    ].join('\n');

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    return csvContent;
  }, [portfolioData.holdings, exportSettings, escapeCSVField, formatNumber]);

  const exportHistoricalData = useCallback(async (): Promise<string> => {
    setExportStatus('Generating historical data CSV...');
    
    const headers = [
      'Date',
      'Symbol',
      'Open',
      'High',
      'Low',
      'Close',
      'Volume',
      'Adjusted Close'
    ];

    const rows = portfolioData.historicalData.map(dataPoint => [
      formatDate(dataPoint.date),
      escapeCSVField(dataPoint.symbol),
      formatNumber(dataPoint.open, 'currency'),
      formatNumber(dataPoint.high, 'currency'),
      formatNumber(dataPoint.low, 'currency'),
      formatNumber(dataPoint.close, 'currency'),
      dataPoint.volume.toString(),
      formatNumber(dataPoint.adjustedClose || dataPoint.close, 'currency')
    ]);

    const csvContent = [
      ...(exportSettings.includeHeaders ? [headers.join(exportSettings.delimiter)] : []),
      ...rows.map(row => row.join(exportSettings.delimiter))
    ].join('\n');

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
    return csvContent;
  }, [portfolioData.historicalData, exportSettings, escapeCSVField, formatNumber, formatDate]);

  const exportReturnsTimeSeries = useCallback(async (): Promise<string> => {
    setExportStatus('Generating returns time series CSV...');
    
    const headers = [
      'Date',
      'Symbol',
      'Price',
      'Daily Return (%)',
      'Cumulative Return (%)',
      'Portfolio Weight (%)',
      'Weighted Return (%)'
    ];

    const rows = portfolioData.returnsData.map(dataPoint => [
      formatDate(dataPoint.date),
      escapeCSVField(dataPoint.symbol),
      formatNumber(dataPoint.price, 'currency'),
      formatNumber(dataPoint.dailyReturn, 'percentage'),
      formatNumber(dataPoint.cumulativeReturn, 'percentage'),
      formatNumber(dataPoint.portfolioWeight, 'percentage'),
      formatNumber(dataPoint.weightedReturn, 'percentage')
    ]);

    const csvContent = [
      ...(exportSettings.includeHeaders ? [headers.join(exportSettings.delimiter)] : []),
      ...rows.map(row => row.join(exportSettings.delimiter))
    ].join('\n');

    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate processing
    return csvContent;
  }, [portfolioData.returnsData, exportSettings, escapeCSVField, formatNumber, formatDate]);

  const exportMetadata = useCallback(async (): Promise<string> => {
    setExportStatus('Generating metadata CSV...');
    
    const metadata = portfolioData.metadata;
    
    const metadataRows = [
      ['Export Information', ''],
      ['Export Date', formatDate(metadata.exportDate)],
      ['Portfolio Name', escapeCSVField(metadata.portfolioName)],
      ['Total Portfolio Value', formatNumber(metadata.totalValue, 'currency')],
      ['Base Currency', metadata.baseCurrency],
      ['Data Source', metadata.dataSource],
      ['Analysis Date', formatDate(metadata.analysisDate)],
      ['', ''],
      ['Risk Metrics', ''],
      ['Beta', formatNumber(metadata.riskMetrics.beta, 'decimal')],
      ['Sharpe Ratio', formatNumber(metadata.riskMetrics.sharpeRatio, 'decimal')],
      ['Volatility (%)', formatNumber(metadata.riskMetrics.volatility, 'percentage')],
      ['Value at Risk 95% (%)', formatNumber(metadata.riskMetrics.var95, 'percentage')],
      ['Max Drawdown (%)', formatNumber(metadata.riskMetrics.maxDrawdown, 'percentage')],
      ['', ''],
      ['Performance Metrics', ''],
      ['Total Return (%)', formatNumber(metadata.performanceMetrics.totalReturn, 'percentage')],
      ['Annualized Return (%)', formatNumber(metadata.performanceMetrics.annualizedReturn, 'percentage')],
      ['YTD Return (%)', formatNumber(metadata.performanceMetrics.ytdReturn, 'percentage')],
      ['Monthly Return (%)', formatNumber(metadata.performanceMetrics.monthlyReturn, 'percentage')]
    ];

    const csvContent = metadataRows
      .map(row => row.map(cell => escapeCSVField(cell)).join(exportSettings.delimiter))
      .join('\n');

    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate processing
    return csvContent;
  }, [portfolioData.metadata, exportSettings, escapeCSVField, formatNumber, formatDate]);

  // Download CSV file
  const downloadCSV = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { 
      type: `text/csv;charset=${exportSettings.encoding}` 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportSettings.encoding]);

  // Main export function
  const handleExport = useCallback(async (exportType: ExportType) => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const portfolioName = portfolioData.metadata.portfolioName.replace(/\s+/g, '_');
      
      switch (exportType) {
        case 'portfolio_weights': {
          setExportProgress(20);
          const content = await exportPortfolioWeights();
          setExportProgress(80);
          const filename = `${portfolioName}_weights_${timestamp}.csv`;
          downloadCSV(content, filename);
          onExportComplete?.(filename, 'Portfolio Weights');
          break;
        }
        
        case 'historical_data': {
          setExportProgress(20);
          const content = await exportHistoricalData();
          setExportProgress(80);
          const filename = `${portfolioName}_historical_${timestamp}.csv`;
          downloadCSV(content, filename);
          onExportComplete?.(filename, 'Historical Data');
          break;
        }
        
        case 'returns_series': {
          setExportProgress(20);
          const content = await exportReturnsTimeSeries();
          setExportProgress(80);
          const filename = `${portfolioName}_returns_${timestamp}.csv`;
          downloadCSV(content, filename);
          onExportComplete?.(filename, 'Returns Time Series');
          break;
        }
        
        case 'metadata': {
          setExportProgress(20);
          const content = await exportMetadata();
          setExportProgress(80);
          const filename = `${portfolioName}_metadata_${timestamp}.csv`;
          downloadCSV(content, filename);
          onExportComplete?.(filename, 'Metadata');
          break;
        }
        
        case 'full_package': {
          setExportProgress(10);
          const [weightsContent, historicalContent, returnsContent, metadataContent] = await Promise.all([
            exportPortfolioWeights(),
            exportHistoricalData(),
            exportReturnsTimeSeries(),
            exportMetadata()
          ]);
          
          setExportProgress(70);
          
          // Download all files
          downloadCSV(weightsContent, `${portfolioName}_weights_${timestamp}.csv`);
          downloadCSV(historicalContent, `${portfolioName}_historical_${timestamp}.csv`);
          downloadCSV(returnsContent, `${portfolioName}_returns_${timestamp}.csv`);
          downloadCSV(metadataContent, `${portfolioName}_metadata_${timestamp}.csv`);
          
          onExportComplete?.(`${portfolioName}_package_${timestamp}`, 'Full Package');
          break;
        }
      }
      
      setExportProgress(100);
      setExportStatus('Export completed successfully!');
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus('');
      }, 2000);
      
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('Export failed. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [
    isExporting,
    portfolioData,
    exportPortfolioWeights,
    exportHistoricalData,
    exportReturnsTimeSeries,
    exportMetadata,
    downloadCSV,
    onExportComplete
  ]);

  // Settings handlers
  const handleSettingChange = useCallback((setting: string, value: any) => {
    setExportSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  }, []);

  return (
    <div className={`csv-exporter ${className}`}>
      {/* Exporter Header */}
      <div className="exporter-header">
        <h2>📊 CSV Data Exporter</h2>
        <p>Export your financial data to Excel-compatible CSV files</p>
      </div>

      {/* Export Statistics */}
      <div className="export-stats">
        <h3>📈 Data Overview</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{exportStats.holdingsCount}</span>
            <span className="stat-label">Holdings</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{exportStats.historicalDataPoints.toLocaleString()}</span>
            <span className="stat-label">Historical Data Points</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{exportStats.returnsDataPoints.toLocaleString()}</span>
            <span className="stat-label">Returns Data Points</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{exportStats.dateRange.start} - {exportStats.dateRange.end}</span>
            <span className="stat-label">Date Range</span>
          </div>
        </div>
      </div>

      {/* Export Settings */}
      <div className="export-settings">
        <h3>⚙️ Export Settings</h3>
        
        <div className="settings-grid">
          <div className="setting-group">
            <label htmlFor="date-format-select" className="setting-label">Date Format</label>
            <select
              id="date-format-select"
              value={exportSettings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
              className="setting-select"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="number-format-select" className="setting-label">Number Format</label>
            <select
              id="number-format-select"
              value={exportSettings.numberFormat}
              onChange={(e) => handleSettingChange('numberFormat', e.target.value)}
              className="setting-select"
            >
              <option value="decimal">Decimal (0.1234)</option>
              <option value="percentage">Percentage (12.34%)</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="delimiter-select" className="setting-label">Delimiter</label>
            <select
              id="delimiter-select"
              value={exportSettings.delimiter}
              onChange={(e) => handleSettingChange('delimiter', e.target.value)}
              className="setting-select"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="encoding-select" className="setting-label">Encoding</label>
            <select
              id="encoding-select"
              value={exportSettings.encoding}
              onChange={(e) => handleSettingChange('encoding', e.target.value)}
              className="setting-select"
            >
              <option value="UTF-8">UTF-8</option>
              <option value="UTF-16">UTF-16</option>
            </select>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={exportSettings.includeHeaders}
                onChange={(e) => handleSettingChange('includeHeaders', e.target.checked)}
              />
              Include Headers
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={exportSettings.includeMetadata}
                onChange={(e) => handleSettingChange('includeMetadata', e.target.checked)}
              />
              Include Metadata
            </label>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="export-actions">
        <h3>💾 Export Options</h3>
        
        <div className="actions-grid">
          <button
            className="export-btn portfolio-weights"
            onClick={() => handleExport('portfolio_weights')}
            disabled={isExporting}
          >
            <span className="btn-icon">⚖️</span>
            <span className="btn-text">
              <strong>Portfolio Weights</strong>
              <small>Holdings, allocations, performance</small>
            </span>
          </button>

          <button
            className="export-btn historical-data"
            onClick={() => handleExport('historical_data')}
            disabled={isExporting}
          >
            <span className="btn-icon">📈</span>
            <span className="btn-text">
              <strong>Historical Data</strong>
              <small>OHLCV time series data</small>
            </span>
          </button>

          <button
            className="export-btn returns-series"
            onClick={() => handleExport('returns_series')}
            disabled={isExporting}
          >
            <span className="btn-icon">📊</span>
            <span className="btn-text">
              <strong>Returns Series</strong>
              <small>Daily & cumulative returns</small>
            </span>
          </button>

          <button
            className="export-btn metadata"
            onClick={() => handleExport('metadata')}
            disabled={isExporting}
          >
            <span className="btn-icon">📋</span>
            <span className="btn-text">
              <strong>Metadata</strong>
              <small>Risk metrics, portfolio info</small>
            </span>
          </button>

          <button
            className="export-btn full-package"
            onClick={() => handleExport('full_package')}
            disabled={isExporting}
          >
            <span className="btn-icon">📦</span>
            <span className="btn-text">
              <strong>Full Package</strong>
              <small>All CSV files combined</small>
            </span>
          </button>
        </div>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <div className="export-progress">
          <div className="progress-header">
            <span>Exporting...</span>
            <span>{exportProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
          <div className="progress-status">
            {exportStatus}
          </div>
        </div>
      )}

      {/* Export Features */}
      <div className="export-features">
        <h3>✨ Export Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Excel Compatible</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>Customizable Format</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📅</span>
            <span>Multiple Date Formats</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌐</span>
            <span>UTF-8/UTF-16 Support</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📈</span>
            <span>Complete Time Series</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Fast Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVExporter;

