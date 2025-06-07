/**
 * STUDENT ANALYST - Excel Exporter
 * Advanced Excel export system with multiple sheets and formulas
 */

import React, { useState, useCallback, useMemo } from 'react';
import './ExcelExporter.css';

// Mock XLSX library interface (in real app, would import from 'xlsx')
interface WorkSheet {
  [key: string]: any;
}

interface WorkBook {
  Sheets: { [name: string]: WorkSheet };
  SheetNames: string[];
}

// Mock XLSX implementation for demo
const XLSX = {
  utils: {
    book_new: (): WorkBook => ({ Sheets: {}, SheetNames: [] }),
    aoa_to_sheet: (data: any[][]): WorkSheet => {
      const ws: WorkSheet = {};
      data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellRef = this.encode_cell({ r: rowIndex, c: colIndex });
          ws[cellRef] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
        });
      });
      return ws;
    },
    json_to_sheet: (data: any[]): WorkSheet => {
      const ws: WorkSheet = {};
      const headers = Object.keys(data[0] || {});
      
      // Add headers
      headers.forEach((header, colIndex) => {
        const cellRef = this.encode_cell({ r: 0, c: colIndex });
        ws[cellRef] = { v: header, t: 's' };
      });
      
      // Add data
      data.forEach((row, rowIndex) => {
        headers.forEach((header, colIndex) => {
          const cellRef = this.encode_cell({ r: rowIndex + 1, c: colIndex });
          const value = row[header];
          ws[cellRef] = { 
            v: value, 
            t: typeof value === 'number' ? 'n' : 's',
            f: value && typeof value === 'string' && value.startsWith('=') ? value : undefined
          };
        });
      });
      
      return ws;
    },
    book_append_sheet: (wb: WorkBook, ws: WorkSheet, name: string) => {
      wb.Sheets[name] = ws;
      wb.SheetNames.push(name);
    },
    encode_cell: ({ r, c }: { r: number; c: number }): string => {
      const col = String.fromCharCode(65 + c);
      return `${col}${r + 1}`;
    }
  },
  writeFile: (wb: WorkBook, filename: string) => {
    // Mock implementation - would normally write actual Excel file
    const blob = new Blob([JSON.stringify(wb, null, 2)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Data interfaces
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

interface ExcelExporterProps {
  portfolioData: {
    holdings: PortfolioHolding[];
    historicalData: HistoricalDataPoint[];
    metadata: {
      portfolioName: string;
      totalValue: number;
      baseCurrency: string;
      exportDate: string;
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
    };
  };
  onExportComplete?: (filename: string, type: string) => void;
  className?: string;
}

type ExcelExportType = 'standard' | 'professional' | 'analyst_report' | 'dashboard';

const ExcelExporter: React.FC<ExcelExporterProps> = ({
  portfolioData,
  onExportComplete,
  className = ''
}) => {
  // State management
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportSettings, setExportSettings] = useState({
    includeCharts: true,
    includeFormulas: true,
    includeSummary: true,
    includeRawData: true,
    chartType: 'pie' as 'pie' | 'bar' | 'line',
    dateFormat: 'YYYY-MM-DD' as 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY',
    currencySymbol: '$',
    autoCalculate: true,
    colorScheme: 'professional' as 'professional' | 'vibrant' | 'monochrome'
  });

  // Export statistics
  const exportStats = useMemo(() => {
    return {
      totalSheets: 5, // Summary, Holdings, Historical, Analysis, Charts
      totalFormulas: portfolioData.holdings.length * 8 + 25,
      dataPoints: portfolioData.holdings.length + portfolioData.historicalData.length,
      estimatedSize: Math.round((portfolioData.holdings.length * 0.5 + portfolioData.historicalData.length * 0.1) / 10) / 100
    };
  }, [portfolioData]);

  // Excel formatting utilities
  const formatExcelFormula = useCallback((formula: string, row: number): string => {
    return formula.replace(/\{ROW\}/g, row.toString());
  }, []);

  const generatePortfolioSummarySheet = useCallback((): any[][] => {
    const metadata = portfolioData.metadata;
    const totalValue = metadata.totalValue;
    
    return [
      ['PORTFOLIO SUMMARY REPORT', '', '', ''],
      ['Generated on:', new Date().toLocaleDateString(), '', ''],
      ['Portfolio Name:', metadata.portfolioName, '', ''],
      ['', '', '', ''],
      ['PORTFOLIO OVERVIEW', '', '', ''],
      ['Total Portfolio Value:', `${exportSettings.currencySymbol}${totalValue.toLocaleString()}`, '', ''],
      ['Base Currency:', metadata.baseCurrency, '', ''],
      ['Number of Holdings:', portfolioData.holdings.length, '', ''],
      ['', '', '', ''],
      ['PERFORMANCE METRICS', '', '', ''],
      ['Total Return:', `${(metadata.performanceMetrics.totalReturn * 100).toFixed(2)}%`, '', ''],
      ['Annualized Return:', `${(metadata.performanceMetrics.annualizedReturn * 100).toFixed(2)}%`, '', ''],
      ['YTD Return:', `${(metadata.performanceMetrics.ytdReturn * 100).toFixed(2)}%`, '', ''],
      ['Monthly Return:', `${(metadata.performanceMetrics.monthlyReturn * 100).toFixed(2)}%`, '', ''],
      ['', '', '', ''],
      ['RISK METRICS', '', '', ''],
      ['Beta:', metadata.riskMetrics.beta.toFixed(3), '', ''],
      ['Sharpe Ratio:', metadata.riskMetrics.sharpeRatio.toFixed(3), '', ''],
      ['Volatility:', `${(metadata.riskMetrics.volatility * 100).toFixed(2)}%`, '', ''],
      ['Value at Risk (95%):', `${(metadata.riskMetrics.var95 * 100).toFixed(2)}%`, '', ''],
      ['Max Drawdown:', `${(metadata.riskMetrics.maxDrawdown * 100).toFixed(2)}%`, '', ''],
      ['', '', '', ''],
      ['TOP HOLDINGS', '', '', ''],
      ['Symbol', 'Name', 'Weight (%)', 'Value'],
      ...portfolioData.holdings
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map(holding => [
          holding.symbol,
          holding.name,
          holding.weight.toFixed(2),
          `${exportSettings.currencySymbol}${holding.totalValue.toLocaleString()}`
        ])
    ];
  }, [portfolioData, exportSettings]);

  const generateHoldingsSheet = useCallback((): any[] => {
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

    const data = portfolioData.holdings.map((holding, index) => ({
      'Symbol': holding.symbol,
      'Company Name': holding.name,
      'Shares': holding.shares,
      'Current Price': holding.currentPrice,
      'Total Value': exportSettings.includeFormulas 
        ? `=C${index + 2}*D${index + 2}` 
        : holding.totalValue,
      'Portfolio Weight (%)': exportSettings.includeFormulas
        ? `=E${index + 2}/$E$${portfolioData.holdings.length + 2}`
        : holding.weight,
      'Day Change ($)': holding.dayChange,
      'Day Change (%)': holding.dayChangePercent,
      'Total Return ($)': holding.totalReturn,
      'Total Return (%)': holding.totalReturnPercent,
      'Sector': holding.sector || 'N/A',
      'Currency': holding.currency || 'USD'
    }));

    // Add totals row if formulas enabled
    if (exportSettings.includeFormulas) {
      data.push({
        'Symbol': 'TOTAL',
        'Company Name': '',
        'Shares': `=SUM(C2:C${data.length + 1})`,
        'Current Price': '',
        'Total Value': `=SUM(E2:E${data.length + 1})`,
        'Portfolio Weight (%)': '100.00%',
        'Day Change ($)': `=SUM(G2:G${data.length + 1})`,
        'Day Change (%)': '',
        'Total Return ($)': `=SUM(I2:I${data.length + 1})`,
        'Total Return (%)': '',
        'Sector': '',
        'Currency': ''
      });
    }

    return data;
  }, [portfolioData.holdings, exportSettings]);

  const generateHistoricalDataSheet = useCallback((): any[] => {
    return portfolioData.historicalData.map(dataPoint => ({
      'Date': dataPoint.date,
      'Symbol': dataPoint.symbol,
      'Open': dataPoint.open,
      'High': dataPoint.high,
      'Low': dataPoint.low,
      'Close': dataPoint.close,
      'Volume': dataPoint.volume,
      'Adjusted Close': dataPoint.adjustedClose || dataPoint.close,
      'Daily Return (%)': exportSettings.includeFormulas 
        ? '=(H3-H2)/H2*100' 
        : Math.random() * 4 - 2 // Mock daily return
    }));
  }, [portfolioData.historicalData, exportSettings]);

  const generateAnalysisSheet = useCallback((): any[][] => {
    const holdings = portfolioData.holdings;
    
    return [
      ['PORTFOLIO ANALYSIS', '', '', ''],
      ['', '', '', ''],
      ['SECTOR ALLOCATION', '', '', ''],
      ['Sector', 'Count', 'Total Value', 'Weight (%)'],
      ...Object.entries(
        holdings.reduce((acc, holding) => {
          const sector = holding.sector || 'Other';
          if (!acc[sector]) {
            acc[sector] = { count: 0, totalValue: 0 };
          }
          acc[sector].count += 1;
          acc[sector].totalValue += holding.totalValue;
          return acc;
        }, {} as Record<string, { count: number; totalValue: number }>)
      ).map(([sector, data]) => [
        sector,
        data.count,
        data.totalValue,
        ((data.totalValue / portfolioData.metadata.totalValue) * 100).toFixed(2)
      ]),
      ['', '', '', ''],
      ['PERFORMANCE ANALYSIS', '', '', ''],
      ['Metric', 'Value', 'Formula', 'Description'],
      ['Average Position Size', 
       `${exportSettings.currencySymbol}${(portfolioData.metadata.totalValue / holdings.length).toLocaleString()}`,
       exportSettings.includeFormulas ? '=SUM(Holdings!E:E)/COUNT(Holdings!E:E)' : '',
       'Average value per holding'
      ],
      ['Largest Position Weight',
       `${Math.max(...holdings.map(h => h.weight)).toFixed(2)}%`,
       exportSettings.includeFormulas ? '=MAX(Holdings!F:F)' : '',
       'Weight of largest single holding'
      ],
      ['Position Concentration',
       `${holdings.filter(h => h.weight > 5).length}`,
       '',
       'Number of positions > 5% weight'
      ],
      ['', '', '', ''],
      ['RISK INDICATORS', '', '', ''],
      ['Metric', 'Current Value', 'Threshold', 'Status'],
      ['Beta', 
       portfolioData.metadata.riskMetrics.beta.toFixed(3),
       '1.000',
       portfolioData.metadata.riskMetrics.beta > 1 ? 'Higher Risk' : 'Lower Risk'
      ],
      ['Sharpe Ratio',
       portfolioData.metadata.riskMetrics.sharpeRatio.toFixed(3),
       '1.000',
       portfolioData.metadata.riskMetrics.sharpeRatio > 1 ? 'Good' : 'Needs Improvement'
      ],
      ['Max Drawdown',
       `${(portfolioData.metadata.riskMetrics.maxDrawdown * 100).toFixed(2)}%`,
       '-20.00%',
       Math.abs(portfolioData.metadata.riskMetrics.maxDrawdown) > 0.2 ? 'High Risk' : 'Acceptable'
      ]
    ];
  }, [portfolioData, exportSettings]);

  const generateChartsDataSheet = useCallback((): any[][] => {
    const holdings = portfolioData.holdings;
    
    return [
      ['CHART DATA SOURCES', '', '', ''],
      ['', '', '', ''],
      ['PIE CHART - PORTFOLIO ALLOCATION', '', '', ''],
      ['Symbol', 'Name', 'Value', 'Percentage'],
      ...holdings.map(holding => [
        holding.symbol,
        holding.name,
        holding.totalValue,
        holding.weight
      ]),
      ['', '', '', ''],
      ['BAR CHART - PERFORMANCE COMPARISON', '', '', ''],
      ['Symbol', 'Total Return (%)', 'Day Change (%)', 'Weight (%)'],
      ...holdings.map(holding => [
        holding.symbol,
        holding.totalReturnPercent,
        holding.dayChangePercent,
        holding.weight
      ]),
      ['', '', '', ''],
      ['LINE CHART - TREND ANALYSIS', '', '', ''],
      ['Note: Historical price data available in Historical Data sheet', '', '', ''],
      ['Use this data to create charts in Excel:', '', '', ''],
      ['1. Select data range', '', '', ''],
      ['2. Insert > Charts > Select chart type', '', '', ''],
      ['3. Customize colors and labels as needed', '', '', '']
    ];
  }, [portfolioData.holdings]);

  // Main export function
  const handleExport = useCallback(async (exportType: ExcelExportType) => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initializing Excel workbook...');
    
    try {
      // Create new workbook
      const workbook = XLSX.utils.book_new();
      
      setExportProgress(10);
      setExportStatus('Generating portfolio summary...');
      
      // Add Summary sheet
      const summaryData = generatePortfolioSummarySheet();
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      setExportProgress(25);
      setExportStatus('Processing holdings data...');
      
      // Add Holdings sheet with formulas
      const holdingsData = generateHoldingsSheet();
      const holdingsSheet = XLSX.utils.json_to_sheet(holdingsData);
      XLSX.utils.book_append_sheet(workbook, holdingsSheet, 'Holdings');
      
      setExportProgress(40);
      setExportStatus('Adding historical data...');
      
      // Add Historical Data sheet
      if (exportSettings.includeRawData && portfolioData.historicalData.length > 0) {
        const historicalData = generateHistoricalDataSheet();
        const historicalSheet = XLSX.utils.json_to_sheet(historicalData);
        XLSX.utils.book_append_sheet(workbook, historicalSheet, 'Historical Data');
      }
      
      setExportProgress(60);
      setExportStatus('Generating analysis sheets...');
      
      // Add Analysis sheet
      const analysisData = generateAnalysisSheet();
      const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analysis');
      
      setExportProgress(80);
      setExportStatus('Preparing chart data...');
      
      // Add Charts data sheet
      if (exportSettings.includeCharts) {
        const chartsData = generateChartsDataSheet();
        const chartsSheet = XLSX.utils.aoa_to_sheet(chartsData);
        XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Chart Data');
      }
      
      setExportProgress(95);
      setExportStatus('Finalizing Excel file...');
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const portfolioName = portfolioData.metadata.portfolioName.replace(/\s+/g, '_');
      const filename = `${portfolioName}_${exportType}_${timestamp}.xlsx`;
      
      // Export file
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      XLSX.writeFile(workbook, filename);
      
      setExportProgress(100);
      setExportStatus('Excel file exported successfully!');
      
      onExportComplete?.(filename, `Excel ${exportType}`);
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus('');
      }, 2000);
      
    } catch (error) {
      console.error('Excel export error:', error);
      setExportStatus('Export failed. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [
    isExporting,
    portfolioData,
    exportSettings,
    generatePortfolioSummarySheet,
    generateHoldingsSheet,
    generateHistoricalDataSheet,
    generateAnalysisSheet,
    generateChartsDataSheet,
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
    <div className={`excel-exporter ${className}`}>
      {/* Exporter Header */}
      <div className="exporter-header">
        <h2>📊 Excel Export System</h2>
        <p>Create professional Excel workbooks with multiple sheets and formulas</p>
        <div className="header-stats">
          <span>📄 {exportStats.totalSheets} Sheets</span>
          <span>🧮 {exportStats.totalFormulas} Formulas</span>
          <span>📈 {exportStats.dataPoints} Data Points</span>
          <span>💾 ~{exportStats.estimatedSize} MB</span>
        </div>
      </div>

      {/* Export Templates */}
      <div className="export-templates">
        <h3>📋 Export Templates</h3>
        <div className="templates-grid">
          <button
            className="template-card standard"
            onClick={() => handleExport('standard')}
            disabled={isExporting}
          >
            <span className="template-icon">📄</span>
            <div className="template-info">
              <h4>Standard Report</h4>
              <p>Basic portfolio data with essential metrics</p>
              <ul>
                <li>Summary & Holdings sheets</li>
                <li>Basic formulas</li>
                <li>Clean formatting</li>
              </ul>
            </div>
          </button>

          <button
            className="template-card professional"
            onClick={() => handleExport('professional')}
            disabled={isExporting}
          >
            <span className="template-icon">💼</span>
            <div className="template-info">
              <h4>Professional Report</h4>
              <p>Complete analysis with all features</p>
              <ul>
                <li>All sheets included</li>
                <li>Advanced formulas</li>
                <li>Chart data sources</li>
              </ul>
            </div>
          </button>

          <button
            className="template-card analyst_report"
            onClick={() => handleExport('analyst_report')}
            disabled={isExporting}
          >
            <span className="template-icon">🎯</span>
            <div className="template-info">
              <h4>Analyst Report</h4>
              <p>Investment bank style presentation</p>
              <ul>
                <li>Executive summary</li>
                <li>Risk analysis</li>
                <li>Performance metrics</li>
              </ul>
            </div>
          </button>

          <button
            className="template-card dashboard"
            onClick={() => handleExport('dashboard')}
            disabled={isExporting}
          >
            <span className="template-icon">📊</span>
            <div className="template-info">
              <h4>Interactive Dashboard</h4>
              <p>Excel dashboard with charts and controls</p>
              <ul>
                <li>Chart templates</li>
                <li>Interactive formulas</li>
                <li>Conditional formatting</li>
              </ul>
            </div>
          </button>
        </div>
      </div>

      {/* Export Settings */}
      <div className="export-settings">
        <h3>⚙️ Export Configuration</h3>
        
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
            <label htmlFor="currency-symbol-select" className="setting-label">Currency Symbol</label>
            <select
              id="currency-symbol-select"
              value={exportSettings.currencySymbol}
              onChange={(e) => handleSettingChange('currencySymbol', e.target.value)}
              className="setting-select"
            >
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="chart-type-select" className="setting-label">Chart Type</label>
            <select
              id="chart-type-select"
              value={exportSettings.chartType}
              onChange={(e) => handleSettingChange('chartType', e.target.value)}
              className="setting-select"
            >
              <option value="pie">Pie Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="color-scheme-select" className="setting-label">Color Scheme</label>
            <select
              id="color-scheme-select"
              value={exportSettings.colorScheme}
              onChange={(e) => handleSettingChange('colorScheme', e.target.value)}
              className="setting-select"
            >
              <option value="professional">Professional</option>
              <option value="vibrant">Vibrant</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={exportSettings.includeFormulas}
                onChange={(e) => handleSettingChange('includeFormulas', e.target.checked)}
              />
              Include Excel Formulas
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={exportSettings.includeCharts}
                onChange={(e) => handleSettingChange('includeCharts', e.target.checked)}
              />
              Include Chart Data
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={exportSettings.includeSummary}
                onChange={(e) => handleSettingChange('includeSummary', e.target.checked)}
              />
              Include Executive Summary
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={exportSettings.includeRawData}
                onChange={(e) => handleSettingChange('includeRawData', e.target.checked)}
              />
              Include Historical Data
            </label>
          </div>
        </div>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <div className="export-progress">
          <div className="progress-header">
            <span>Creating Excel Workbook...</span>
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

      {/* Feature Highlights */}
      <div className="feature-highlights">
        <h3>✨ Excel Features</h3>
        <div className="highlights-grid">
          <div className="highlight-item">
            <span className="highlight-icon">📊</span>
            <div className="highlight-content">
              <h4>Multiple Sheets</h4>
              <p>Organized data across Summary, Holdings, Historical, Analysis, and Chart sheets</p>
            </div>
          </div>

          <div className="highlight-item">
            <span className="highlight-icon">🧮</span>
            <div className="highlight-content">
              <h4>Excel Formulas</h4>
              <p>Live calculations for totals, percentages, and performance metrics</p>
            </div>
          </div>

          <div className="highlight-item">
            <span className="highlight-icon">📈</span>
            <div className="highlight-content">
              <h4>Chart Ready Data</h4>
              <p>Pre-formatted data sources for creating professional charts in Excel</p>
            </div>
          </div>

          <div className="highlight-item">
            <span className="highlight-icon">🎨</span>
            <div className="highlight-content">
              <h4>Professional Format</h4>
              <p>Investment-grade presentation with proper formatting and structure</p>
            </div>
          </div>

          <div className="highlight-item">
            <span className="highlight-icon">🔧</span>
            <div className="highlight-content">
              <h4>Customizable</h4>
              <p>Flexible settings for dates, currencies, and chart preferences</p>
            </div>
          </div>

          <div className="highlight-item">
            <span className="highlight-icon">⚡</span>
            <div className="highlight-content">
              <h4>Fast Export</h4>
              <p>Efficient processing of large datasets with progress tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sheets Preview */}
      <div className="sheets-preview">
        <h3>📄 Workbook Structure</h3>
        <div className="sheets-list">
          <div className="sheet-item">
            <span className="sheet-icon">📋</span>
            <div className="sheet-info">
              <h4>Summary</h4>
              <p>Portfolio overview, key metrics, and top holdings</p>
            </div>
          </div>

          <div className="sheet-item">
            <span className="sheet-icon">💼</span>
            <div className="sheet-info">
              <h4>Holdings</h4>
              <p>Complete portfolio positions with live formulas</p>
            </div>
          </div>

          <div className="sheet-item">
            <span className="sheet-icon">📈</span>
            <div className="sheet-info">
              <h4>Historical Data</h4>
              <p>Time series price data for all holdings</p>
            </div>
          </div>

          <div className="sheet-item">
            <span className="sheet-icon">🎯</span>
            <div className="sheet-info">
              <h4>Analysis</h4>
              <p>Sector allocation, risk metrics, and performance analysis</p>
            </div>
          </div>

          <div className="sheet-item">
            <span className="sheet-icon">📊</span>
            <div className="sheet-info">
              <h4>Chart Data</h4>
              <p>Pre-formatted data sources for Excel charts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelExporter;

