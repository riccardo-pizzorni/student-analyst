/**
 * STUDENT ANALYST - Print Styles Demo
 * Comprehensive demonstration of print functionality with financial data
 */

import React, { useState, useMemo } from 'react';
import PrintSummaryReport from './PrintSummaryReport';
import './PrintStylesDemo.css';

const PrintStylesDemo: React.FC = () => {
  // Demo state
  const [selectedReportType, setSelectedReportType] = useState<'summary' | 'detailed' | 'risk'>('summary');
  const [printSettings, setPrintSettings] = useState({
    includeLogo: true,
    includeDisclaimer: true,
    includeRiskAnalysis: true,
    includeMarketData: true,
    pageOrientation: 'portrait' as 'portrait' | 'landscape'
  });

  // Demo financial data
  const demoData = useMemo(() => ({
    portfolioSummary: {
      totalValue: 127550.75,
      dayChange: 1825.30,
      totalReturn: 12750.25,
      returnPercentage: 11.12,
      assetsCount: 6
    },
    holdings: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        shares: 150,
        avgCost: 165.25,
        currentPrice: 178.50,
        totalValue: 26775.00,
        dayChange: 322.50,
        totalReturn: 1987.50,
        allocation: 21.0
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        shares: 75,
        avgCost: 380.75,
        currentPrice: 412.30,
        totalValue: 30922.50,
        dayChange: 435.00,
        totalReturn: 2366.25,
        allocation: 24.2
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        shares: 50,
        avgCost: 142.50,
        currentPrice: 138.75,
        totalValue: 6937.50,
        dayChange: -62.50,
        totalReturn: -187.50,
        allocation: 5.4
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        shares: 100,
        avgCost: 148.75,
        currentPrice: 145.25,
        totalValue: 14525.00,
        dayChange: -75.00,
        totalReturn: -350.00,
        allocation: 11.4
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        shares: 80,
        avgCost: 235.50,
        currentPrice: 245.80,
        totalValue: 19664.00,
        dayChange: 676.00,
        totalReturn: 824.00,
        allocation: 15.4
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        shares: 32,
        avgCost: 820.00,
        currentPrice: 875.60,
        totalValue: 28019.20,
        dayChange: 489.60,
        totalReturn: 1779.20,
        allocation: 22.0
      }
    ],
    riskMetrics: {
      beta: 1.15,
      sharpeRatio: 1.34,
      maxDrawdown: -12.5,
      var95: -5.2,
      volatility: 18.7
    },
    marketData: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 178.50,
        change: 2.15,
        changePercent: 1.22,
        volume: 45250000,
        marketCap: 2850000000000,
        pe: 28.5
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 412.30,
        change: 5.80,
        changePercent: 1.43,
        volume: 22680000,
        marketCap: 3050000000000,
        pe: 32.1
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 138.75,
        change: -1.25,
        changePercent: -0.89,
        volume: 28150000,
        marketCap: 1750000000000,
        pe: 24.8
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        price: 145.25,
        change: -0.75,
        changePercent: -0.51,
        volume: 35420000,
        marketCap: 1520000000000,
        pe: 55.2
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 245.80,
        change: 8.45,
        changePercent: 3.56,
        volume: 85750000,
        marketCap: 780000000000,
        pe: 65.8
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        price: 875.60,
        change: 15.30,
        changePercent: 1.78,
        volume: 42680000,
        marketCap: 2150000000000,
        pe: 68.4
      }
    ],
    reportDate: new Date(),
    reportTitle: 'Q4 2024 Portfolio Analysis Report',
    userSettings: printSettings
  }), [printSettings]);

  // Handle print settings change
  const handleSettingChange = (setting: string, value: any) => {
    setPrintSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Report type options
  const reportTypes = [
    {
      id: 'summary',
      name: 'Summary Report',
      description: 'Comprehensive portfolio overview with key metrics',
      icon: '📊'
    },
    {
      id: 'detailed',
      name: 'Detailed Analysis',
      description: 'In-depth analysis with extended metrics and charts',
      icon: '📈'
    },
    {
      id: 'risk',
      name: 'Risk Assessment',
      description: 'Focus on risk metrics and portfolio optimization',
      icon: '⚠️'
    }
  ];

  return (
    <div className="print-styles-demo">
      {/* Demo Header */}
      <div className="demo-header">
        <h1>🖨️ Print Styles Demo</h1>
        <p>Professional print-optimized reports for financial analysis</p>
      </div>

      {/* Print Configuration */}
      <div className="print-configuration no-print">
        <div className="config-section">
          <h2>📋 Report Configuration</h2>
          
          {/* Report Type Selection */}
          <div className="config-group">
            <h3>Report Type</h3>
            <div className="report-type-grid">
              {reportTypes.map(type => (
                <button
                  key={type.id}
                  className={`report-type-btn ${selectedReportType === type.id ? 'active' : ''}`}
                  onClick={() => setSelectedReportType(type.id as any)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <div className="type-content">
                    <span className="type-name">{type.name}</span>
                    <span className="type-description">{type.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Print Settings */}
          <div className="config-group">
            <h3>Print Settings</h3>
            <div className="settings-grid">
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={printSettings.includeLogo}
                  onChange={(e) => handleSettingChange('includeLogo', e.target.checked)}
                />
                <span className="setting-label">Include Company Logo</span>
                <span className="setting-description">Add branding to report header</span>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={printSettings.includeDisclaimer}
                  onChange={(e) => handleSettingChange('includeDisclaimer', e.target.checked)}
                />
                <span className="setting-label">Include Legal Disclaimer</span>
                <span className="setting-description">Add legal disclaimers and warnings</span>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={printSettings.includeRiskAnalysis}
                  onChange={(e) => handleSettingChange('includeRiskAnalysis', e.target.checked)}
                />
                <span className="setting-label">Include Risk Analysis</span>
                <span className="setting-description">Add comprehensive risk metrics</span>
              </label>

              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={printSettings.includeMarketData}
                  onChange={(e) => handleSettingChange('includeMarketData', e.target.checked)}
                />
                <span className="setting-label">Include Market Data</span>
                <span className="setting-description">Add current market information</span>
              </label>

              <label className="setting-item">
                <select
                  value={printSettings.pageOrientation}
                  onChange={(e) => handleSettingChange('pageOrientation', e.target.value)}
                  className="setting-select"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
                <span className="setting-label">Page Orientation</span>
                <span className="setting-description">Choose page layout orientation</span>
              </label>
            </div>
          </div>

          {/* Print Features Info */}
          <div className="config-group">
            <h3>Print Features</h3>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">📄</div>
                <div className="feature-content">
                  <strong>Smart Page Breaks</strong>
                  <span>Intelligent page breaking prevents content splitting</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🎨</div>
                <div className="feature-content">
                  <strong>Print-Optimized Colors</strong>
                  <span>Colors adjusted for both color and B&W printing</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-content">
                  <strong>Chart Optimization</strong>
                  <span>Charts converted to print-friendly formats</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">📐</div>
                <div className="feature-content">
                  <strong>Professional Layout</strong>
                  <span>Typography and spacing optimized for paper</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🔢</div>
                <div className="feature-content">
                  <strong>Data Tables</strong>
                  <span>Financial tables with proper formatting</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">📋</div>
                <div className="feature-content">
                  <strong>Headers & Footers</strong>
                  <span>Automatic page numbering and metadata</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview */}
      <div className="print-preview">
        <div className="preview-header no-print">
          <h2>📖 Print Preview</h2>
          <p>This is how your report will look when printed</p>
          <div className="preview-controls">
            <button
              className="preview-btn"
              onClick={() => window.print()}
              title="Print Report"
            >
              🖨️ Print Now
            </button>
            <button
              className="preview-btn secondary"
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(document.documentElement.outerHTML);
                  printWindow.document.close();
                  printWindow.focus();
                }
              }}
              title="Open in New Window"
            >
              🔗 New Window
            </button>
          </div>
        </div>

        {/* Report Component */}
        <PrintSummaryReport
          data={demoData}
          onPrint={() => console.log('Report printed!')}
          className="demo-report"
        />
      </div>

      {/* Print Instructions */}
      <div className="print-instructions no-print">
        <div className="instructions-section">
          <h2>📝 Printing Instructions</h2>
          
          <div className="instructions-grid">
            <div className="instruction-item">
              <div className="instruction-number">1</div>
              <div className="instruction-content">
                <h3>Configure Report</h3>
                <p>Select report type and adjust print settings above to customize your report.</p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-number">2</div>
              <div className="instruction-content">
                <h3>Preview Report</h3>
                <p>Review the print preview below to ensure all content displays correctly.</p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-number">3</div>
              <div className="instruction-content">
                <h3>Print Setup</h3>
                <p>Use your browser's print function (Ctrl+P) and select appropriate printer settings.</p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-number">4</div>
              <div className="instruction-content">
                <h3>Print Quality</h3>
                <p>For best results, use high-quality paper and ensure proper ink/toner levels.</p>
              </div>
            </div>
          </div>

          <div className="print-tips">
            <h3>💡 Printing Tips</h3>
            <ul>
              <li><strong>Browser Settings:</strong> Enable "Background graphics" for best visual results</li>
              <li><strong>Paper Size:</strong> Report is optimized for standard A4/Letter size paper</li>
              <li><strong>Margins:</strong> Use browser default margins (usually 0.5 inch) for proper formatting</li>
              <li><strong>Scale:</strong> Keep scaling at 100% to maintain proper proportions</li>
              <li><strong>Headers/Footers:</strong> Browser headers/footers will be automatically added</li>
              <li><strong>Color vs B&W:</strong> Report is optimized for both color and black & white printing</li>
            </ul>
          </div>

          <div className="browser-compatibility">
            <h3>🌐 Browser Compatibility</h3>
            <div className="browser-grid">
              <div className="browser-item">
                <span className="browser-name">Chrome</span>
                <span className="compatibility-status good">✅ Excellent</span>
              </div>
              <div className="browser-item">
                <span className="browser-name">Firefox</span>
                <span className="compatibility-status good">✅ Excellent</span>
              </div>
              <div className="browser-item">
                <span className="browser-name">Safari</span>
                <span className="compatibility-status good">✅ Good</span>
              </div>
              <div className="browser-item">
                <span className="browser-name">Edge</span>
                <span className="compatibility-status good">✅ Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintStylesDemo; 

