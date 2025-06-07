/**
 * STUDENT ANALYST - PDF Report Generator Demo
 * Interactive demonstration of PDF generation capabilities
 */

import React, { useState, useEffect } from 'react';
import PDFReportGenerator from './PDFReportGenerator';
import './PDFReportDemo.css';

// Mock financial data for demo
const generateMockPortfolioData = () => {
  const holdings = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 150,
      currentPrice: 182.52,
      totalValue: 27378,
      dayChange: -127.14,
      allocation: 25.8
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 200,
      currentPrice: 338.47,
      totalValue: 67694,
      dayChange: 1015.41,
      allocation: 63.8
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 50,
      currentPrice: 138.21,
      totalValue: 6910.5,
      dayChange: -103.58,
      allocation: 6.5
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 25,
      currentPrice: 163.57,
      totalValue: 4089.25,
      dayChange: 81.79,
      allocation: 3.9
    }
  ];

  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
  const dayChange = holdings.reduce((sum, holding) => sum + holding.dayChange, 0);
  const totalReturn = totalValue * 0.127; // 12.7% return
  const returnPercentage = 12.7;

  return {
    totalValue,
    dayChange,
    totalReturn,
    returnPercentage,
    holdings
  };
};

const generateMockRiskMetrics = () => ({
  beta: 1.15,
  sharpeRatio: 1.42,
  maxDrawdown: -18.5,
  var95: -4.2,
  volatility: 22.3
});

const generateMockAnalysis = () => ({
  summary: 'The portfolio demonstrates strong performance with a balanced allocation across technology sector leaders. Current positioning favors growth over value, with moderate risk exposure suitable for long-term investors seeking capital appreciation.',
  recommendations: [
    'Consider reducing concentration in technology sector to improve diversification',
    'Implement systematic rebalancing strategy to maintain target allocations',
    'Monitor interest rate sensitivity given growth stock exposure',
    'Evaluate adding defensive positions for portfolio stability'
  ],
  risks: [
    'High correlation between holdings during market downturns',
    'Concentration risk in technology sector (96% allocation)',
    'Interest rate sensitivity of growth-oriented positions',
    'Regulatory risks affecting large-cap technology companies'
  ],
  opportunities: [
    'Strong fundamentals support continued growth potential',
    'AI and cloud computing tailwinds for core holdings',
    'Potential for dividend growth from mature positions',
    'Tax-loss harvesting opportunities during volatility'
  ]
});

const generateMockCharts = () => [
  {
    title: 'Portfolio Allocation by Holding',
    type: 'allocation' as const,
    elementId: 'allocation-chart'
  },
  {
    title: 'Risk-Return Analysis',
    type: 'risk' as const,
    elementId: 'risk-chart'
  },
  {
    title: 'Performance Over Time',
    type: 'performance' as const,
    elementId: 'performance-chart'
  }
];

const PDFReportDemo: React.FC = () => {
  // Demo state
  const [activeDemo, setActiveDemo] = useState('balanced');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPDFs, setGeneratedPDFs] = useState<Array<{
    name: string;
    date: Date;
    size: string;
  }>>([]);

  // Demo scenarios
  const demoScenarios = {
    balanced: {
      title: 'Balanced Growth Portfolio',
      description: 'Diversified portfolio focused on technology growth stocks',
      icon: '⚖️'
    },
    aggressive: {
      title: 'Aggressive Growth Portfolio',
      description: 'High-risk, high-reward technology concentrated portfolio',
      icon: '🚀'
    },
    conservative: {
      title: 'Conservative Value Portfolio',
      description: 'Lower risk portfolio with dividend-focused holdings',
      icon: '🛡️'
    },
    international: {
      title: 'International Diversified',
      description: 'Global portfolio with international exposure',
      icon: '🌍'
    }
  };

  // Generate demo data based on scenario
  const generateDemoData = (scenario: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const baseData = {
        title: demoScenarios[scenario as keyof typeof demoScenarios].title,
        subtitle: 'Quarterly Investment Report',
        date: new Date(),
        author: 'Student Analyst Platform',
        portfolioData: generateMockPortfolioData(),
        riskMetrics: generateMockRiskMetrics(),
        charts: generateMockCharts(),
        analysis: generateMockAnalysis()
      };

      // Modify data based on scenario
      switch (scenario) {
        case 'aggressive':
          baseData.riskMetrics.beta = 1.35;
          baseData.riskMetrics.volatility = 28.7;
          baseData.riskMetrics.maxDrawdown = -24.3;
          baseData.portfolioData.returnPercentage = 18.4;
          break;
        case 'conservative':
          baseData.riskMetrics.beta = 0.75;
          baseData.riskMetrics.volatility = 12.8;
          baseData.riskMetrics.maxDrawdown = -8.2;
          baseData.portfolioData.returnPercentage = 7.3;
          break;
        case 'international':
          baseData.riskMetrics.beta = 0.95;
          baseData.riskMetrics.volatility = 18.9;
          baseData.portfolioData.returnPercentage = 10.8;
          break;
      }

      setReportData(baseData);
      setIsLoading(false);
    }, 1000);
  };

  // Handle PDF generation
  const handlePDFGenerated = (pdfBlob: Blob) => {
    const newPDF = {
      name: reportData.title,
      date: new Date(),
      size: `${(pdfBlob.size / 1024).toFixed(1)} KB`
    };
    setGeneratedPDFs(prev => [newPDF, ...prev.slice(0, 4)]);
  };

  // Initialize with balanced scenario
  useEffect(() => {
    generateDemoData('balanced');
  }, []);

  // Handle scenario change
  const handleScenarioChange = (scenario: string) => {
    setActiveDemo(scenario);
    generateDemoData(scenario);
  };

  return (
    <div className="pdf-report-demo">
      {/* Demo Header */}
      <div className="demo-header">
        <h1>📊 PDF Report Generator</h1>
        <p>Professional financial reports with one click</p>
        <div className="demo-badges">
          <span className="badge badge-feature">Multi-page Layout</span>
          <span className="badge badge-feature">Chart Embedding</span>
          <span className="badge badge-feature">Professional Formatting</span>
          <span className="badge badge-tech">jsPDF Powered</span>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="scenario-selector">
        <h2>🎯 Choose Demo Scenario</h2>
        <div className="scenario-grid">
          {Object.entries(demoScenarios).map(([key, scenario]) => (
            <button
              key={key}
              className={`scenario-card ${activeDemo === key ? 'active' : ''}`}
              onClick={() => handleScenarioChange(key)}
              disabled={isLoading}
            >
              <span className="scenario-icon">{scenario.icon}</span>
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <p>Generating portfolio data...</p>
        </div>
      )}

      {/* Report Generator */}
      {reportData && !isLoading && (
        <div className="generator-section">
          <PDFReportGenerator
            data={reportData}
            onGenerated={handlePDFGenerated}
            className="demo-generator"
          />
        </div>
      )}

      {/* Mock Charts for Demo */}
      <div className="mock-charts" style={{ display: 'none' }}>
        <div id="allocation-chart" style={{ width: '400px', height: '300px', background: '#f0f0f0' }}>
          <svg width="400" height="300">
            <circle cx="200" cy="150" r="80" fill="#667eea" />
            <text x="200" y="155" textAnchor="middle" fill="white" fontSize="14">
              Portfolio Chart
            </text>
          </svg>
        </div>
        <div id="risk-chart" style={{ width: '400px', height: '300px', background: '#f0f0f0' }}>
          <svg width="400" height="300">
            <rect x="50" y="50" width="300" height="200" fill="#764ba2" />
            <text x="200" y="155" textAnchor="middle" fill="white" fontSize="14">
              Risk Analysis
            </text>
          </svg>
        </div>
        <div id="performance-chart" style={{ width: '400px', height: '300px', background: '#f0f0f0' }}>
          <svg width="400" height="300">
            <polyline points="50,250 100,200 150,180 200,150 250,120 300,100 350,80" 
                      fill="none" stroke="#667eea" strokeWidth="3" />
            <text x="200" y="280" textAnchor="middle" fill="#333" fontSize="14">
              Performance Chart
            </text>
          </svg>
        </div>
      </div>

      {/* Generated PDFs History */}
      {generatedPDFs.length > 0 && (
        <div className="pdf-history">
          <h2>📁 Recently Generated Reports</h2>
          <div className="pdf-list">
            {generatedPDFs.map((pdf, index) => (
              <div key={index} className="pdf-item">
                <div className="pdf-icon">📄</div>
                <div className="pdf-info">
                  <div className="pdf-name">{pdf.name}</div>
                  <div className="pdf-meta">
                    {pdf.date.toLocaleString()} • {pdf.size}
                  </div>
                </div>
                <div className="pdf-status">✅ Generated</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="features-overview">
        <h2>✨ PDF Generation Features</h2>
        <div className="features-comparison">
          <div className="feature-category">
            <h3>📄 Layout & Structure</h3>
            <ul>
              <li>✅ Multi-page automatic layout</li>
              <li>✅ Professional headers & footers</li>
              <li>✅ Page numbering system</li>
              <li>✅ Consistent typography</li>
              <li>✅ Responsive table layouts</li>
            </ul>
          </div>
          
          <div className="feature-category">
            <h3>📊 Content Integration</h3>
            <ul>
              <li>✅ Chart embedding (PNG/SVG)</li>
              <li>✅ Portfolio holdings tables</li>
              <li>✅ Risk metrics display</li>
              <li>✅ Executive summary</li>
              <li>✅ Investment analysis</li>
            </ul>
          </div>
          
          <div className="feature-category">
            <h3>⚙️ Customization</h3>
            <ul>
              <li>✅ Multiple page formats (A4/Letter)</li>
              <li>✅ Portrait/Landscape orientation</li>
              <li>✅ Color/Grayscale modes</li>
              <li>✅ Optional disclaimers</li>
              <li>✅ Configurable sections</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Implementation */}
      <div className="tech-implementation">
        <h2>🔧 Technical Implementation</h2>
        <div className="tech-details">
          <div className="tech-item">
            <h4>📦 Dependencies</h4>
            <div className="tech-list">
              <span className="tech-tag">jsPDF</span>
              <span className="tech-tag">html2canvas</span>
              <span className="tech-tag">React 18+</span>
              <span className="tech-tag">TypeScript</span>
            </div>
          </div>
          
          <div className="tech-item">
            <h4>⚡ Performance</h4>
            <ul>
              <li>Client-side generation</li>
              <li>No server dependencies</li>
              <li>Optimized chart capture</li>
              <li>Progressive rendering</li>
            </ul>
          </div>
          
          <div className="tech-item">
            <h4>🎨 Customization</h4>
            <ul>
              <li>Modular component design</li>
              <li>Theme-aware styling</li>
              <li>Responsive layouts</li>
              <li>Accessibility support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="usage-instructions">
        <h2>📋 How to Use</h2>
        <div className="instruction-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Configure Settings</h4>
              <p>Choose page format, orientation, and content options</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Review Preview</h4>
              <p>Check report details and estimated page count</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Generate PDF</h4>
              <p>Click generate and wait for automatic download</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Share & Archive</h4>
              <p>Professional reports ready for distribution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReportDemo;

