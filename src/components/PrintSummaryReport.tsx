/**
 * STUDENT ANALYST - Print Summary Report
 * Professional summary report optimized for printing
 */

import React, { useEffect, useState, useCallback } from 'react';
import './PrintSummaryReport.css';

interface ReportData {
  portfolioSummary: {
    totalValue: number;
    dayChange: number;
    totalReturn: number;
    returnPercentage: number;
    assetsCount: number;
  };
  holdings: Array<{
    symbol: string;
    name: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    totalValue: number;
    dayChange: number;
    totalReturn: number;
    allocation: number;
  }>;
  riskMetrics: {
    beta: number;
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number;
    volatility: number;
  };
  marketData: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    pe: number;
  }>;
  reportDate: Date;
  reportTitle: string;
  userSettings?: {
    includeLogo: boolean;
    includeDisclaimer: boolean;
    includeRiskAnalysis: boolean;
    includeMarketData: boolean;
    pageOrientation: 'portrait' | 'landscape';
  };
}

interface PrintSummaryReportProps {
  data: ReportData;
  onPrint?: () => void;
  className?: string;
}

const PrintSummaryReport: React.FC<PrintSummaryReportProps> = ({
  data,
  onPrint,
  className = ''
}) => {
  // State for print optimization
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  // Format number
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  }, []);

  // Format market cap
  const formatMarketCap = useCallback((cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return formatCurrency(cap);
  }, [formatCurrency]);

  // Format date for report
  const formatReportDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }, []);

  // Handle print functionality
  const handlePrint = useCallback(() => {
    setIsPrintMode(true);
    
    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
      onPrint?.();
      setIsPrintMode(false);
    }, 100);
  }, [onPrint]);

  // Listen for print events
  useEffect(() => {
    const handleBeforePrint = () => setIsPrintMode(true);
    const handleAfterPrint = () => setIsPrintMode(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Generate report timestamp
  useEffect(() => {
    setReportGenerated(true);
  }, [data]);

  // Calculate portfolio metrics
  const portfolioMetrics = {
    totalAllocated: data.holdings.reduce((sum, holding) => sum + holding.allocation, 0),
    topHolding: data.holdings.reduce((prev, current) => 
      prev.allocation > current.allocation ? prev : current
    ),
    positiveDayChange: data.holdings.filter(h => h.dayChange > 0).length,
    negativeDayChange: data.holdings.filter(h => h.dayChange < 0).length
  };

  // CSS classes
  const reportClasses = [
    'print-summary-report',
    className,
    isPrintMode ? 'print-mode' : '',
    data.userSettings?.pageOrientation === 'landscape' ? 'landscape-mode' : 'portrait-mode'
  ].filter(Boolean).join(' ');

  return (
    <div className={reportClasses}>
      {/* Print Controls - Hidden in print */}
      <div className="print-controls no-print">
        <div className="controls-header">
          <h2>📄 Generate Summary Report</h2>
          <p>Professional financial analysis report optimized for printing</p>
        </div>
        
        <div className="print-actions">
          <button
            className="print-btn primary"
            onClick={handlePrint}
            title="Print Report"
          >
            🖨️ Print Report
          </button>
          
          <button
            className="print-btn secondary"
            onClick={() => window.open('', '_blank')}
            title="Preview in New Window"
          >
            👁️ Preview
          </button>
          
          <div className="print-info">
            <span className="report-status">
              {reportGenerated ? '✅ Report Ready' : '⏳ Generating...'}
            </span>
            <span className="page-count">
              Estimated: 3-4 pages
            </span>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {/* Report Header */}
        <header className="report-header page-break-avoid">
          {data.userSettings?.includeLogo && (
            <div className="report-logo print-only">
              <div className="logo-placeholder">
                🏢 STUDENT ANALYST
              </div>
            </div>
          )}
          
          <div className="report-title">
            <h1>{data.reportTitle || 'Portfolio Analysis Report'}</h1>
            <div className="report-meta">
              <div className="report-date">
                <strong>Report Date:</strong> {formatReportDate(data.reportDate)}
              </div>
              <div className="report-id">
                <strong>Report ID:</strong> SA-{Date.now().toString(36).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Executive Summary */}
        <section className="executive-summary section page-break-avoid">
          <h2>📊 Executive Summary</h2>
          
          <div className="summary-grid">
            <div className="summary-card">
              <h3>Portfolio Value</h3>
              <div className="summary-value">{formatCurrency(data.portfolioSummary.totalValue)}</div>
              <div className="summary-detail">
                Day Change: <span className={data.portfolioSummary.dayChange >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(data.portfolioSummary.dayChange)}
                </span>
              </div>
            </div>

            <div className="summary-card">
              <h3>Total Return</h3>
              <div className="summary-value">{formatCurrency(data.portfolioSummary.totalReturn)}</div>
              <div className="summary-detail">
                Return: <span className={data.portfolioSummary.returnPercentage >= 0 ? 'positive' : 'negative'}>
                  {formatPercentage(data.portfolioSummary.returnPercentage)}
                </span>
              </div>
            </div>

            <div className="summary-card">
              <h3>Portfolio Composition</h3>
              <div className="summary-value">{data.portfolioSummary.assetsCount}</div>
              <div className="summary-detail">Assets</div>
            </div>

            <div className="summary-card">
              <h3>Risk Profile</h3>
              <div className="summary-value">{data.riskMetrics.beta.toFixed(2)}</div>
              <div className="summary-detail">Beta</div>
            </div>
          </div>

          <div className="key-insights">
            <h3>Key Insights</h3>
            <ul>
              <li>
                <strong>Top Holding:</strong> {portfolioMetrics.topHolding.symbol} represents {portfolioMetrics.topHolding.allocation}% of the portfolio
              </li>
              <li>
                <strong>Performance:</strong> {portfolioMetrics.positiveDayChange} positions gained, {portfolioMetrics.negativeDayChange} positions declined today
              </li>
              <li>
                <strong>Risk Assessment:</strong> Portfolio beta of {data.riskMetrics.beta.toFixed(2)} indicates {data.riskMetrics.beta > 1 ? 'higher' : 'lower'} volatility than the market
              </li>
              <li>
                <strong>Diversification:</strong> Portfolio is {portfolioMetrics.totalAllocated > 95 ? 'fully' : 'partially'} allocated across {data.portfolioSummary.assetsCount} assets
              </li>
            </ul>
          </div>
        </section>

        {/* Portfolio Holdings */}
        <section className="portfolio-holdings section page-break-before">
          <h2>📈 Portfolio Holdings</h2>
          
          <div className="holdings-table-container">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>Shares</th>
                  <th>Avg Cost</th>
                  <th>Current Price</th>
                  <th>Total Value</th>
                  <th>Day Change</th>
                  <th>Total Return</th>
                  <th>Allocation</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((holding, index) => (
                  <tr key={holding.symbol} className="page-break-inside-avoid">
                    <td className="symbol-cell">
                      <strong>{holding.symbol}</strong>
                    </td>
                    <td className="name-cell">{holding.name}</td>
                    <td className="number-cell">{formatNumber(holding.shares)}</td>
                    <td className="currency-cell">{formatCurrency(holding.avgCost)}</td>
                    <td className="currency-cell">{formatCurrency(holding.currentPrice)}</td>
                    <td className="currency-cell"><strong>{formatCurrency(holding.totalValue)}</strong></td>
                    <td className={`currency-cell ${holding.dayChange >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(holding.dayChange)}
                    </td>
                    <td className={`currency-cell ${holding.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(holding.totalReturn)}
                    </td>
                    <td className="percentage-cell">{holding.allocation.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td colSpan={5}><strong>PORTFOLIO TOTAL</strong></td>
                  <td className="currency-cell"><strong>{formatCurrency(data.portfolioSummary.totalValue)}</strong></td>
                  <td className={`currency-cell ${data.portfolioSummary.dayChange >= 0 ? 'positive' : 'negative'}`}>
                    <strong>{formatCurrency(data.portfolioSummary.dayChange)}</strong>
                  </td>
                  <td className={`currency-cell ${data.portfolioSummary.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    <strong>{formatCurrency(data.portfolioSummary.totalReturn)}</strong>
                  </td>
                  <td className="percentage-cell"><strong>100.0%</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Risk Analysis */}
        {data.userSettings?.includeRiskAnalysis !== false && (
          <section className="risk-analysis section section-break">
            <h2>⚠️ Risk Analysis</h2>
            
            <div className="risk-metrics-grid">
              <div className="risk-metric">
                <h3>Portfolio Beta</h3>
                <div className="metric-value">{data.riskMetrics.beta.toFixed(2)}</div>
                <div className="metric-description">
                  {data.riskMetrics.beta > 1 ? 'More volatile than market' : 'Less volatile than market'}
                </div>
              </div>

              <div className="risk-metric">
                <h3>Sharpe Ratio</h3>
                <div className="metric-value">{data.riskMetrics.sharpeRatio.toFixed(2)}</div>
                <div className="metric-description">
                  {data.riskMetrics.sharpeRatio > 1 ? 'Good risk-adjusted returns' : 'Consider risk optimization'}
                </div>
              </div>

              <div className="risk-metric">
                <h3>Max Drawdown</h3>
                <div className="metric-value">{formatPercentage(data.riskMetrics.maxDrawdown)}</div>
                <div className="metric-description">Largest peak-to-trough decline</div>
              </div>

              <div className="risk-metric">
                <h3>Value at Risk (95%)</h3>
                <div className="metric-value">{formatPercentage(data.riskMetrics.var95)}</div>
                <div className="metric-description">Daily loss not exceeded 95% of time</div>
              </div>
            </div>

            <div className="risk-assessment">
              <h3>Risk Assessment Summary</h3>
              <p>
                Based on the current portfolio composition and risk metrics, the portfolio exhibits{' '}
                <strong>
                  {data.riskMetrics.beta < 0.8 ? 'low' : 
                   data.riskMetrics.beta > 1.2 ? 'high' : 'moderate'}
                </strong>{' '}
                risk characteristics. The Sharpe ratio of {data.riskMetrics.sharpeRatio.toFixed(2)} indicates{' '}
                <strong>
                  {data.riskMetrics.sharpeRatio > 1.5 ? 'excellent' :
                   data.riskMetrics.sharpeRatio > 1.0 ? 'good' :
                   data.riskMetrics.sharpeRatio > 0.5 ? 'adequate' : 'poor'}
                </strong>{' '}
                risk-adjusted performance.
              </p>
            </div>
          </section>
        )}

        {/* Market Data */}
        {data.userSettings?.includeMarketData !== false && (
          <section className="market-data section section-break">
            <h2>🔍 Market Data Reference</h2>
            
            <div className="market-table-container">
              <table className="market-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company Name</th>
                    <th>Price</th>
                    <th>Change</th>
                    <th>Change %</th>
                    <th>Volume</th>
                    <th>Market Cap</th>
                    <th>P/E Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.marketData.map((stock) => (
                    <tr key={stock.symbol} className="page-break-inside-avoid">
                      <td className="symbol-cell"><strong>{stock.symbol}</strong></td>
                      <td className="name-cell">{stock.name}</td>
                      <td className="currency-cell">{formatCurrency(stock.price)}</td>
                      <td className={`currency-cell ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(stock.change)}
                      </td>
                      <td className={`percentage-cell ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercentage(stock.changePercent)}
                      </td>
                      <td className="number-cell">{formatNumber(stock.volume)}</td>
                      <td className="currency-cell">{formatMarketCap(stock.marketCap)}</td>
                      <td className="number-cell">{stock.pe.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="report-footer print-footer">
          <div className="footer-content">
            <div className="generation-info">
              <p>
                <strong>Report Generated:</strong> {formatReportDate(new Date())} by Student Analyst Platform
              </p>
              <p>
                <strong>Data Sources:</strong> Real-time market data aggregated from multiple financial data providers
              </p>
            </div>

            {data.userSettings?.includeDisclaimer !== false && (
              <div className="disclaimer">
                <h4>Important Disclaimer</h4>
                <p>
                  This report is generated for informational purposes only and should not be considered as investment advice. 
                  Past performance does not guarantee future results. All investments carry risk, including the potential 
                  loss of principal. Before making any investment decisions, please consult with a qualified financial advisor. 
                  Student Analyst is a portfolio analysis tool and does not provide investment recommendations or advisory services.
                </p>
                <p>
                  The data presented in this report is based on publicly available information and may not reflect real-time 
                  market conditions. Users should verify all information independently before making investment decisions.
                </p>
              </div>
            )}
          </div>
        </footer>
      </div>

      {/* Print-only page breaks */}
      <div className="print-only">
        <div style={{ pageBreakAfter: 'always' }}></div>
      </div>
    </div>
  );
};

export default PrintSummaryReport; 

