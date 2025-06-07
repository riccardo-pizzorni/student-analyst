/**
 * STUDENT ANALYST - Export UI Demo
 * Interactive demonstration of the unified export system
 */

import React, { useState, useCallback, useMemo } from 'react';
import ExportUI from './ExportUI';
import './ExportUIDemo.css';

interface ExportHistory {
  id: string;
  timestamp: string;
  filename: string;
  format: string;
  size: string;
  type: string;
  status: 'completed' | 'failed';
}

const ExportUIDemo: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'history' | 'guide'>('system');
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      filename: 'portfolio_full_portfolio_2024-01-15.xlsx',
      format: 'Excel',
      size: '4.2MB',
      type: 'Complete Portfolio',
      status: 'completed'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      filename: 'portfolio_holdings_2024-01-15.csv',
      format: 'CSV',
      size: '45KB',
      type: 'Portfolio Holdings',
      status: 'completed'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      filename: 'portfolio_analysis_2024-01-15.pdf',
      format: 'PDF',
      size: '1.8MB',
      type: 'Analysis Report',
      status: 'completed'
    }
  ]);

  // Mock portfolio data
  const mockPortfolioData = useMemo(() => ({
    holdings: [
      { symbol: 'AAPL', name: 'Apple Inc.', shares: 150, price: 185.24, value: 27786, weight: 0.2547 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', shares: 100, price: 348.52, value: 34852, weight: 0.3195 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 75, price: 138.93, value: 10419.75, weight: 0.0955 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', shares: 50, price: 481.33, value: 24066.5, weight: 0.2206 },
      { symbol: 'TSLA', name: 'Tesla Inc.', shares: 40, price: 248.42, value: 9936.8, weight: 0.0911 },
      { symbol: 'AMD', name: 'Advanced Micro Devices', shares: 80, price: 147.21, value: 11776.8, weight: 0.1080 }
    ],
    historicalData: generateMockHistoricalData(),
    metadata: {
      portfolioName: 'Tech Growth Portfolio',
      created: '2023-06-15',
      lastUpdated: new Date().toISOString(),
      totalValue: 109091.05,
      currency: 'USD',
      benchmark: 'NASDAQ-100'
    },
    availableAssets: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMD'],
    dateRange: {
      start: '2023-01-01',
      end: new Date().toISOString().split('T')[0]
    }
  }), []);

  // Generate mock historical data
  function generateMockHistoricalData() {
    const data = [];
    const startDate = new Date('2023-01-01');
    const endDate = new Date();
    const assets = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMD'];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      assets.forEach(asset => {
        const basePrice = asset === 'AAPL' ? 150 : asset === 'MSFT' ? 300 : asset === 'GOOGL' ? 120 : 
                         asset === 'NVDA' ? 400 : asset === 'TSLA' ? 200 : 130;
        const volatility = Math.random() * 0.04 - 0.02; // -2% to +2%
        const price = basePrice * (1 + volatility + Math.sin(d.getTime() / (1000 * 60 * 60 * 24 * 30)) * 0.1);
        
        data.push({
          date: d.toISOString().split('T')[0],
          symbol: asset,
          open: price * 0.99,
          high: price * 1.02,
          low: price * 0.98,
          close: price,
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          return: volatility
        });
      });
    }
    
    return data;
  }

  // Handle export completion
  const handleExportComplete = useCallback((result: { filename: string; format: string; size: string }) => {
    const newExport: ExportHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      filename: result.filename,
      format: result.format,
      size: result.size,
      type: 'Complete Portfolio', // This would come from the export options
      status: 'completed'
    };
    
    setExportHistory(prev => [newExport, ...prev].slice(0, 10)); // Keep only last 10
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} minutes ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Export format statistics
  const exportStats = useMemo(() => {
    const formatCounts = exportHistory.reduce((acc, exp) => {
      acc[exp.format] = (acc[exp.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalSize = exportHistory.reduce((total, exp) => {
      const sizeMatch = exp.size.match(/(\d+\.?\d*)([KMG]B)/);
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2];
        const multiplier = unit === 'KB' ? 1 : unit === 'MB' ? 1024 : 1024 * 1024;
        return total + (value * multiplier);
      }
      return total;
    }, 0);
    
    return {
      formatCounts,
      totalExports: exportHistory.length,
      totalSizeKB: totalSize,
      totalSizeMB: totalSize / 1024
    };
  }, [exportHistory]);

  return (
    <div className="export-ui-demo">
      {/* Demo Header */}
      <div className="demo-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📤 Export System Control Center</h1>
            <p>Unified interface for exporting portfolio data in multiple formats</p>
          </div>
          <button
            className="primary-export-btn"
            onClick={() => setIsExportModalOpen(true)}
          >
            <span className="btn-icon">📊</span>
            Start New Export
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <span className="stat-value">{exportStats.totalExports}</span>
            <span className="stat-label">Total Exports</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{exportStats.totalSizeMB.toFixed(1)}MB</span>
            <span className="stat-label">Data Exported</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">4</span>
            <span className="stat-label">Formats Available</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{mockPortfolioData.availableAssets.length}</span>
            <span className="stat-label">Assets in Portfolio</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="demo-tabs">
        <button
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          🎛️ Export System
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Export History
        </button>
        <button
          className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          📖 User Guide
        </button>
      </div>

      {/* Tab Content */}
      <div className="demo-content">
        {activeTab === 'system' && (
          <div className="system-overview">
            <div className="overview-grid">
              {/* Portfolio Summary */}
              <div className="overview-card portfolio-summary">
                <h3>📊 Portfolio Overview</h3>
                <div className="portfolio-stats">
                  <div className="portfolio-stat">
                    <span className="stat-label">Total Value:</span>
                    <span className="stat-value">${mockPortfolioData.metadata.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="portfolio-stat">
                    <span className="stat-label">Assets:</span>
                    <span className="stat-value">{mockPortfolioData.availableAssets.length}</span>
                  </div>
                  <div className="portfolio-stat">
                    <span className="stat-label">Data Range:</span>
                    <span className="stat-value">{mockPortfolioData.dateRange.start} to {mockPortfolioData.dateRange.end}</span>
                  </div>
                </div>
                <div className="holdings-preview">
                  <h4>Top Holdings:</h4>
                  {mockPortfolioData.holdings.slice(0, 3).map(holding => (
                    <div key={holding.symbol} className="holding-item">
                      <span className="holding-symbol">{holding.symbol}</span>
                      <span className="holding-weight">{(holding.weight * 100).toFixed(1)}%</span>
                      <span className="holding-value">${holding.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Formats */}
              <div className="overview-card export-formats">
                <h3>📋 Available Formats</h3>
                <div className="format-list">
                  <div className="format-item">
                    <span className="format-icon">📊</span>
                    <div className="format-details">
                      <h4>Excel (.xlsx)</h4>
                      <p>Multi-sheet workbooks with formulas and charts</p>
                      <div className="format-features">
                        <span className="feature-tag">✓ Formulas</span>
                        <span className="feature-tag">✓ Charts</span>
                        <span className="feature-tag">✓ Multiple Sheets</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="format-item">
                    <span className="format-icon">📄</span>
                    <div className="format-details">
                      <h4>CSV (.csv)</h4>
                      <p>Universal format for spreadsheet applications</p>
                      <div className="format-features">
                        <span className="feature-tag">✓ Universal</span>
                        <span className="feature-tag">✓ Lightweight</span>
                        <span className="feature-tag">✓ Fast Export</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="format-item">
                    <span className="format-icon">📑</span>
                    <div className="format-details">
                      <h4>PDF (.pdf)</h4>
                      <p>Professional reports with charts and analysis</p>
                      <div className="format-features">
                        <span className="feature-tag">✓ Print Ready</span>
                        <span className="feature-tag">✓ Professional</span>
                        <span className="feature-tag">✓ Charts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="format-item">
                    <span className="format-icon">📋</span>
                    <div className="format-details">
                      <h4>JSON (.json)</h4>
                      <p>Structured data for developers and APIs</p>
                      <div className="format-features">
                        <span className="feature-tag">✓ API Ready</span>
                        <span className="feature-tag">✓ Structured</span>
                        <span className="feature-tag">✓ Machine Readable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Types */}
              <div className="overview-card export-types">
                <h3>🎯 Export Types</h3>
                <div className="type-list">
                  <div className="type-item">
                    <span className="type-icon">💼</span>
                    <div className="type-details">
                      <h4>Portfolio Holdings</h4>
                      <p>Current positions and allocations (~50KB)</p>
                    </div>
                  </div>
                  
                  <div className="type-item">
                    <span className="type-icon">📈</span>
                    <div className="type-details">
                      <h4>Historical Data</h4>
                      <p>Price history and performance (~2MB)</p>
                    </div>
                  </div>
                  
                  <div className="type-item">
                    <span className="type-icon">🎯</span>
                    <div className="type-details">
                      <h4>Analysis Report</h4>
                      <p>Risk metrics and performance analysis (~200KB)</p>
                    </div>
                  </div>
                  
                  <div className="type-item">
                    <span className="type-icon">📦</span>
                    <div className="type-details">
                      <h4>Complete Portfolio</h4>
                      <p>All data with comprehensive analysis (~5MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div className="overview-card advanced-features">
                <h3>⚙️ Advanced Features</h3>
                <div className="features-grid">
                  <div className="feature-card">
                    <span className="feature-icon">📅</span>
                    <h4>Custom Date Ranges</h4>
                    <p>Export data for specific time periods</p>
                  </div>
                  
                  <div className="feature-card">
                    <span className="feature-icon">🎯</span>
                    <h4>Asset Selection</h4>
                    <p>Choose specific assets to include</p>
                  </div>
                  
                  <div className="feature-card">
                    <span className="feature-icon">📊</span>
                    <h4>Chart Data</h4>
                    <p>Pre-formatted data for visualization</p>
                  </div>
                  
                  <div className="feature-card">
                    <span className="feature-icon">🔢</span>
                    <h4>Live Formulas</h4>
                    <p>Excel formulas for dynamic calculations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="export-history">
            <div className="history-header">
              <h2>📋 Export History</h2>
              <div className="history-stats">
                <div className="history-stat">
                  <span className="stat-value">{exportStats.totalExports}</span>
                  <span className="stat-label">Total Exports</span>
                </div>
                <div className="history-stat">
                  <span className="stat-value">{exportStats.totalSizeMB.toFixed(1)}MB</span>
                  <span className="stat-label">Total Size</span>
                </div>
                <div className="history-stat">
                  <span className="stat-value">{Object.keys(exportStats.formatCounts).length}</span>
                  <span className="stat-label">Formats Used</span>
                </div>
              </div>
            </div>

            {/* Format Distribution */}
            <div className="format-distribution">
              <h3>Format Distribution</h3>
              <div className="distribution-chart">
                {Object.entries(exportStats.formatCounts).map(([format, count]) => (
                  <div key={format} className="distribution-bar">
                    <span className="format-name">{format}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: `${(count / exportStats.totalExports) * 100}%` }}
                      ></div>
                    </div>
                    <span className="format-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* History Table */}
            <div className="history-table">
              <div className="table-header">
                <div className="header-cell">File</div>
                <div className="header-cell">Format</div>
                <div className="header-cell">Type</div>
                <div className="header-cell">Size</div>
                <div className="header-cell">Created</div>
                <div className="header-cell">Status</div>
                <div className="header-cell">Actions</div>
              </div>
              
              {exportHistory.map(export_ => (
                <div key={export_.id} className="table-row">
                  <div className="table-cell filename">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{export_.filename}</span>
                  </div>
                  <div className="table-cell">
                    <span className={`format-badge ${export_.format.toLowerCase()}`}>
                      {export_.format}
                    </span>
                  </div>
                  <div className="table-cell">{export_.type}</div>
                  <div className="table-cell">{export_.size}</div>
                  <div className="table-cell">{formatTimestamp(export_.timestamp)}</div>
                  <div className="table-cell">
                    <span className={`status-badge ${export_.status}`}>
                      {export_.status === 'completed' ? '✅ Complete' : '❌ Failed'}
                    </span>
                  </div>
                  <div className="table-cell">
                    <button className="action-btn download">
                      📥 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="user-guide">
            <div className="guide-header">
              <h2>📖 Export System User Guide</h2>
              <p>Complete guide to using the STUDENT ANALYST export features</p>
            </div>

            <div className="guide-sections">
              <div className="guide-section">
                <h3>🚀 Getting Started</h3>
                <div className="guide-content">
                  <ol className="guide-steps">
                    <li>
                      <strong>Open Export Modal:</strong> Click the "Start New Export" button to open the export configuration dialog.
                    </li>
                    <li>
                      <strong>Choose Format:</strong> Select from Excel, CSV, PDF, or JSON based on your needs.
                    </li>
                    <li>
                      <strong>Select Data Type:</strong> Choose what data to export - holdings only, historical data, analysis, or complete portfolio.
                    </li>
                    <li>
                      <strong>Configure Options:</strong> Set date ranges, select specific assets, and enable advanced features.
                    </li>
                    <li>
                      <strong>Start Export:</strong> Review your settings and click "Start Export" to begin processing.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="guide-section">
                <h3>📊 Format Selection Guide</h3>
                <div className="guide-content">
                  <div className="format-comparison">
                    <div className="comparison-item">
                      <h4>📊 Excel - Best for Analysis</h4>
                      <ul>
                        <li>✅ Live formulas for dynamic calculations</li>
                        <li>✅ Multiple worksheets (Holdings, Historical, Analysis, Charts)</li>
                        <li>✅ Chart-ready data sources</li>
                        <li>✅ Professional formatting</li>
                        <li>⚠️ Larger file size</li>
                      </ul>
                    </div>
                    
                    <div className="comparison-item">
                      <h4>📄 CSV - Best for Import</h4>
                      <ul>
                        <li>✅ Universal compatibility</li>
                        <li>✅ Small file size</li>
                        <li>✅ Fast export/import</li>
                        <li>✅ Easy to process programmatically</li>
                        <li>⚠️ No formulas or charts</li>
                      </ul>
                    </div>
                    
                    <div className="comparison-item">
                      <h4>📑 PDF - Best for Reports</h4>
                      <ul>
                        <li>✅ Professional presentation</li>
                        <li>✅ Print-ready format</li>
                        <li>✅ Embedded charts and visualizations</li>
                        <li>✅ Consistent formatting across devices</li>
                        <li>⚠️ Not editable</li>
                      </ul>
                    </div>
                    
                    <div className="comparison-item">
                      <h4>📋 JSON - Best for Developers</h4>
                      <ul>
                        <li>✅ API-ready format</li>
                        <li>✅ Structured nested data</li>
                        <li>✅ Machine-readable</li>
                        <li>✅ Easy to parse programmatically</li>
                        <li>⚠️ Not human-readable</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="guide-section">
                <h3>⚙️ Advanced Features</h3>
                <div className="guide-content">
                  <div className="features-detail">
                    <div className="feature-detail">
                      <h4>📅 Custom Date Ranges</h4>
                      <p>Export data for specific time periods. Useful for quarterly reports, year-end analysis, or performance comparisons. You can select predefined ranges (1 month, 3 months, 6 months, 1 year) or set custom start and end dates.</p>
                    </div>
                    
                    <div className="feature-detail">
                      <h4>🎯 Asset Selection</h4>
                      <p>Choose specific assets to include in your export. This is particularly useful when creating focused reports on specific sectors or when sharing data with limited scope. Use "Select All" or "Deselect All" for quick selection.</p>
                    </div>
                    
                    <div className="feature-detail">
                      <h4>📊 Chart Data Integration</h4>
                      <p>When enabled, exports include pre-formatted data sources that are ready for chart creation in Excel or other visualization tools. This feature structures the data with proper headers and formatting for immediate use in charts.</p>
                    </div>
                    
                    <div className="feature-detail">
                      <h4>🔢 Live Excel Formulas</h4>
                      <p>Excel exports can include live formulas that automatically calculate portfolio metrics. These formulas update when you modify the underlying data, making your exported files dynamic and interactive.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="guide-section">
                <h3>💡 Best Practices</h3>
                <div className="guide-content">
                  <div className="best-practices">
                    <div className="practice-item">
                      <h4>🎯 Choose the Right Format</h4>
                      <p>Use Excel for detailed analysis, CSV for data import/export, PDF for presentations, and JSON for API integration or custom applications.</p>
                    </div>
                    
                    <div className="practice-item">
                      <h4>📅 Optimize Date Ranges</h4>
                      <p>For large portfolios, consider using shorter date ranges to reduce export time and file size. Full historical data exports can be several megabytes.</p>
                    </div>
                    
                    <div className="practice-item">
                      <h4>🗜️ Use Compression Wisely</h4>
                      <p>Enable compression for large exports or when sharing files via email. Compression can reduce file sizes by 60-80% but may slightly increase export time.</p>
                    </div>
                    
                    <div className="practice-item">
                      <h4>💾 Organize Your Exports</h4>
                      <p>Use descriptive filenames and maintain a consistent export schedule. The export history helps track your exports and file versions.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="guide-section">
                <h3>🔧 Troubleshooting</h3>
                <div className="guide-content">
                  <div className="troubleshooting">
                    <div className="trouble-item">
                      <h4>❓ Export Takes Too Long</h4>
                      <p><strong>Solution:</strong> Try reducing the date range, selecting fewer assets, or choosing a simpler format like CSV instead of Excel with all features enabled.</p>
                    </div>
                    
                    <div className="trouble-item">
                      <h4>❓ File Size Too Large</h4>
                      <p><strong>Solution:</strong> Enable compression, export specific data types instead of the complete portfolio, or use CSV format for smaller files.</p>
                    </div>
                    
                    <div className="trouble-item">
                      <h4>❓ Excel Formulas Not Working</h4>
                      <p><strong>Solution:</strong> Ensure you have "Include Formulas" enabled in advanced options. Some spreadsheet applications may require enabling macros or external references.</p>
                    </div>
                    
                    <div className="trouble-item">
                      <h4>❓ Can't Open Downloaded File</h4>
                      <p><strong>Solution:</strong> Check that you have the appropriate software installed (Excel for .xlsx, PDF reader for .pdf). Try downloading the file again if it appears corrupted.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export UI Modal */}
      <ExportUI
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        portfolioData={mockPortfolioData}
        onExportComplete={handleExportComplete}
      />
    </div>
  );
};

export default ExportUIDemo;

