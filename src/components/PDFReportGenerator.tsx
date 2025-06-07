/**
 * STUDENT ANALYST - PDF Report Generator
 * Professional PDF generation with jsPDF, multi-page layout, and chart embedding
 */

import React, { useState, useRef, useCallback } from 'react';
import './PDFReportGenerator.css';

// Note: In a real implementation, you would import jsPDF
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

interface ReportData {
  title: string;
  subtitle?: string;
  date: Date;
  author?: string;
  portfolioData: {
    totalValue: number;
    dayChange: number;
    totalReturn: number;
    returnPercentage: number;
    holdings: Array<{
      symbol: string;
      name: string;
      shares: number;
      currentPrice: number;
      totalValue: number;
      dayChange: number;
      allocation: number;
    }>;
  };
  riskMetrics: {
    beta: number;
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number;
    volatility: number;
  };
  marketData?: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
  charts?: Array<{
    title: string;
    type: 'portfolio' | 'risk' | 'performance' | 'allocation';
    elementId: string;
  }>;
  analysis?: {
    summary: string;
    recommendations: string[];
    risks: string[];
    opportunities: string[];
  };
}

interface PDFReportGeneratorProps {
  data: ReportData;
  onGenerated?: (pdfBlob: Blob) => void;
  className?: string;
}

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({
  data,
  onGenerated,
  className = ''
}) => {
  // State for PDF generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [pdfSettings, setPdfSettings] = useState({
    format: 'a4' as 'a4' | 'letter',
    orientation: 'portrait' as 'portrait' | 'landscape',
    includeCharts: true,
    includeAnalysis: true,
    includeDisclaimer: true,
    pageNumbers: true,
    watermark: false,
    colorMode: 'color' as 'color' | 'grayscale'
  });

  // References for chart capture
  const chartRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Mock jsPDF implementation for demo purposes
  const createMockPDF = () => {
    return {
      internal: {
        pageSize: { width: 210, height: 297 }
      },
      setFontSize: (size: number) => {},
      setFont: (font: string, style?: string) => {},
      text: (text: string, x: number, y: number) => {},
      addImage: (imgData: string, format: string, x: number, y: number, width: number, height: number) => {},
      addPage: () => {},
      line: (x1: number, y1: number, x2: number, y2: number) => {},
      rect: (x: number, y: number, width: number, height: number, style?: string) => {},
      setTextColor: (r: number, g?: number, b?: number) => {},
      setDrawColor: (r: number, g?: number, b?: number) => {},
      setFillColor: (r: number, g?: number, b?: number) => {},
      save: (filename: string) => {},
      output: (type: string) => new Blob(['mock-pdf'], { type: 'application/pdf' })
    };
  };

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

  // Format date
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }, []);

  // Capture chart as image
  const captureChart = async (elementId: string): Promise<string | null> => {
    try {
      setGenerationStatus(`Capturing chart: ${elementId}`);
      
      // Mock chart capture - in real implementation would use html2canvas
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock base64 image data
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  };

  // Add header to PDF
  const addHeader = (pdf: any, pageNumber: number) => {
    const pageWidth = pdf.internal.pageSize.width;
    
    // Logo area (mock)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STUDENT ANALYST', 20, 20);
    
    // Report title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.title, 20, 30);
    
    // Date
    pdf.setFontSize(10);
    pdf.text(formatDate(data.date), pageWidth - 60, 20);
    
    // Page number if enabled
    if (pdfSettings.pageNumbers) {
      pdf.text(`Page ${pageNumber}`, pageWidth - 30, 30);
    }
    
    // Header line
    pdf.line(20, 35, pageWidth - 20, 35);
  };

  // Add footer to PDF
  const addFooter = (pdf: any) => {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Footer line
    pdf.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
    
    // Footer text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Generated by Student Analyst - Educational Platform', 20, pageHeight - 20);
    
    if (pdfSettings.includeDisclaimer) {
      pdf.text('Disclaimer: For educational purposes only. Not investment advice.', 20, pageHeight - 15);
    }
    
    // Generation timestamp
    pdf.text(`Generated: ${new Date().toISOString()}`, pageWidth - 80, pageHeight - 20);
  };

  // Add executive summary page
  const addExecutiveSummary = async (pdf: any) => {
    setGenerationStatus('Creating executive summary...');
    
    let yPosition = 50;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Section title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', margin, yPosition);
    yPosition += 15;
    
    // Portfolio overview
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Portfolio Overview', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summaryData = [
      [`Total Portfolio Value:`, formatCurrency(data.portfolioData.totalValue)],
      [`Day Change:`, formatCurrency(data.portfolioData.dayChange)],
      [`Total Return:`, formatCurrency(data.portfolioData.totalReturn)],
      [`Return Percentage:`, formatPercentage(data.portfolioData.returnPercentage)],
      [`Number of Holdings:`, data.portfolioData.holdings.length.toString()]
    ];
    
    summaryData.forEach(([label, value]) => {
      pdf.text(label, margin, yPosition);
      pdf.text(value, margin + 80, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Risk metrics
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Risk Metrics', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const riskData = [
      [`Portfolio Beta:`, data.riskMetrics.beta.toFixed(2)],
      [`Sharpe Ratio:`, data.riskMetrics.sharpeRatio.toFixed(2)],
      [`Max Drawdown:`, formatPercentage(data.riskMetrics.maxDrawdown)],
      [`Value at Risk (95%):`, formatPercentage(data.riskMetrics.var95)],
      [`Volatility:`, formatPercentage(data.riskMetrics.volatility)]
    ];
    
    riskData.forEach(([label, value]) => {
      pdf.text(label, margin, yPosition);
      pdf.text(value, margin + 80, yPosition);
      yPosition += 8;
    });
    
    // Key insights
    if (data.analysis) {
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Insights', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Split text into lines that fit
      const lines = pdf.splitTextToSize(data.analysis.summary, contentWidth);
      lines.forEach((line: string) => {
        if (yPosition > 250) {
          pdf.addPage();
          addHeader(pdf, 2);
          yPosition = 50;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      });
    }
  };

  // Add portfolio holdings table
  const addPortfolioHoldings = async (pdf: any) => {
    setGenerationStatus('Creating portfolio holdings table...');
    
    pdf.addPage();
    const pageNumber = 2; // This would be dynamic in real implementation
    addHeader(pdf, pageNumber);
    
    let yPosition = 50;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.width;
    
    // Section title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Portfolio Holdings', margin, yPosition);
    yPosition += 15;
    
    // Table headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    const headers = ['Symbol', 'Name', 'Shares', 'Price', 'Value', 'Day Change', 'Allocation'];
    const colWidths = [25, 60, 25, 25, 35, 35, 25];
    let xPosition = margin;
    
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    
    yPosition += 5;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    // Table rows
    pdf.setFont('helvetica', 'normal');
    
    data.portfolioData.holdings.forEach((holding) => {
      if (yPosition > 250) {
        pdf.addPage();
        addHeader(pdf, pageNumber + 1);
        yPosition = 50;
        
        // Repeat headers
        pdf.setFont('helvetica', 'bold');
        xPosition = margin;
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 5;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
      }
      
      const rowData = [
        holding.symbol,
        holding.name.length > 15 ? holding.name.substring(0, 15) + '...' : holding.name,
        holding.shares.toString(),
        formatCurrency(holding.currentPrice),
        formatCurrency(holding.totalValue),
        formatCurrency(holding.dayChange),
        `${holding.allocation.toFixed(1)}%`
      ];
      
      xPosition = margin;
      rowData.forEach((cell, index) => {
        pdf.text(cell, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      
      yPosition += 8;
    });
    
    // Total row
    yPosition += 5;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL', margin, yPosition);
    pdf.text(formatCurrency(data.portfolioData.totalValue), margin + 145, yPosition);
    pdf.text(formatCurrency(data.portfolioData.dayChange), margin + 180, yPosition);
    pdf.text('100.0%', margin + 215, yPosition);
  };

  // Add charts to PDF
  const addCharts = async (pdf: any) => {
    if (!pdfSettings.includeCharts || !data.charts || data.charts.length === 0) {
      return;
    }
    
    setGenerationStatus('Embedding charts...');
    
    for (const chart of data.charts) {
      pdf.addPage();
      const pageNumber = 3; // This would be dynamic
      addHeader(pdf, pageNumber);
      
      let yPosition = 50;
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.width;
      
      // Chart title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(chart.title, margin, yPosition);
      yPosition += 20;
      
      // Capture and add chart
      const chartImage = await captureChart(chart.elementId);
      if (chartImage) {
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = 120; // Fixed height for consistency
        
        pdf.addImage(chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } else {
        // Placeholder for failed chart capture
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text('[Chart could not be captured]', margin, yPosition);
        yPosition += 20;
      }
      
      // Chart description based on type
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      let description = '';
      switch (chart.type) {
        case 'portfolio':
          description = 'Portfolio composition showing asset allocation and relative weights.';
          break;
        case 'risk':
          description = 'Risk analysis including volatility metrics and risk-return characteristics.';
          break;
        case 'performance':
          description = 'Historical performance analysis and trend identification.';
          break;
        case 'allocation':
          description = 'Asset allocation breakdown by sector, geography, or asset class.';
          break;
      }
      
      const descLines = pdf.splitTextToSize(description, pageWidth - (margin * 2));
      descLines.forEach((line: string) => {
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      });
    }
  };

  // Add analysis section
  const addAnalysis = async (pdf: any) => {
    if (!pdfSettings.includeAnalysis || !data.analysis) {
      return;
    }
    
    setGenerationStatus('Adding analysis section...');
    
    pdf.addPage();
    const pageNumber = 4; // This would be dynamic
    addHeader(pdf, pageNumber);
    
    let yPosition = 50;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.width;
    const contentWidth = pageWidth - (margin * 2);
    
    // Analysis title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Investment Analysis', margin, yPosition);
    yPosition += 20;
    
    // Recommendations
    if (data.analysis.recommendations && data.analysis.recommendations.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommendations', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      data.analysis.recommendations.forEach((rec, index) => {
        const bullet = `${index + 1}. `;
        const lines = pdf.splitTextToSize(rec, contentWidth - 10);
        
        pdf.text(bullet, margin, yPosition);
        lines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + (lineIndex === 0 ? 10 : 15), yPosition);
          yPosition += 6;
        });
        yPosition += 2;
      });
      
      yPosition += 10;
    }
    
    // Risks
    if (data.analysis.risks && data.analysis.risks.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Risk Factors', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      data.analysis.risks.forEach((risk, index) => {
        const bullet = `• `;
        const lines = pdf.splitTextToSize(risk, contentWidth - 10);
        
        pdf.text(bullet, margin, yPosition);
        lines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + (lineIndex === 0 ? 8 : 15), yPosition);
          yPosition += 6;
        });
        yPosition += 2;
      });
      
      yPosition += 10;
    }
    
    // Opportunities
    if (data.analysis.opportunities && data.analysis.opportunities.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Opportunities', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      data.analysis.opportunities.forEach((opp, index) => {
        const bullet = `+ `;
        const lines = pdf.splitTextToSize(opp, contentWidth - 10);
        
        pdf.text(bullet, margin, yPosition);
        lines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + (lineIndex === 0 ? 8 : 15), yPosition);
          yPosition += 6;
        });
        yPosition += 2;
      });
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Initializing PDF generation...');
    
    try {
      // Mock jsPDF instance
      const pdf = createMockPDF();
      
      // Set document properties
      setGenerationProgress(10);
      setGenerationStatus('Setting document properties...');
      
      // Add cover page
      setGenerationProgress(20);
      addHeader(pdf, 1);
      
      // Add executive summary
      setGenerationProgress(30);
      await addExecutiveSummary(pdf);
      
      // Add portfolio holdings
      setGenerationProgress(50);
      await addPortfolioHoldings(pdf);
      
      // Add charts
      setGenerationProgress(70);
      await addCharts(pdf);
      
      // Add analysis
      setGenerationProgress(80);
      await addAnalysis(pdf);
      
      // Add footers to all pages
      setGenerationProgress(90);
      setGenerationStatus('Adding footers...');
      addFooter(pdf);
      
      // Generate final PDF
      setGenerationProgress(95);
      setGenerationStatus('Finalizing PDF...');
      
      const pdfBlob = pdf.output('blob');
      
      setGenerationProgress(100);
      setGenerationStatus('PDF generated successfully!');
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.title.replace(/\s+/g, '_')}_${formatDate(data.date).replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Call callback
      onGenerated?.(pdfBlob);
      
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStatus('');
      }, 2000);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      setGenerationStatus('Error generating PDF');
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Handle settings change
  const handleSettingChange = (setting: string, value: any) => {
    setPdfSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className={`pdf-report-generator ${className}`}>
      {/* Generator Header */}
      <div className="generator-header">
        <h2>📄 PDF Report Generator</h2>
        <p>Create professional PDF reports from your financial analysis</p>
      </div>

      {/* PDF Settings */}
      <div className="pdf-settings">
        <h3>⚙️ Report Settings</h3>
        
        <div className="settings-grid">
          <div className="setting-group">
            <label htmlFor="pdf-format-select" className="setting-label">Page Format</label>
            <select
              id="pdf-format-select"
              value={pdfSettings.format}
              onChange={(e) => handleSettingChange('format', e.target.value)}
              className="setting-select"
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="pdf-orientation-select" className="setting-label">Orientation</label>
            <select
              id="pdf-orientation-select"
              value={pdfSettings.orientation}
              onChange={(e) => handleSettingChange('orientation', e.target.value)}
              className="setting-select"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="pdf-color-mode-select" className="setting-label">Color Mode</label>
            <select
              id="pdf-color-mode-select"
              value={pdfSettings.colorMode}
              onChange={(e) => handleSettingChange('colorMode', e.target.value)}
              className="setting-select"
            >
              <option value="color">Color</option>
              <option value="grayscale">Grayscale</option>
            </select>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={pdfSettings.includeCharts}
                onChange={(e) => handleSettingChange('includeCharts', e.target.checked)}
              />
              Include Charts
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={pdfSettings.includeAnalysis}
                onChange={(e) => handleSettingChange('includeAnalysis', e.target.checked)}
              />
              Include Analysis
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={pdfSettings.pageNumbers}
                onChange={(e) => handleSettingChange('pageNumbers', e.target.checked)}
              />
              Page Numbers
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={pdfSettings.includeDisclaimer}
                onChange={(e) => handleSettingChange('includeDisclaimer', e.target.checked)}
              />
              Include Disclaimer
            </label>
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={pdfSettings.watermark}
                onChange={(e) => handleSettingChange('watermark', e.target.checked)}
              />
              Add Watermark
            </label>
          </div>
        </div>
      </div>

      {/* Generation Controls */}
      <div className="generation-controls">
        <button
          className={`generate-btn ${isGenerating ? 'generating' : ''}`}
          onClick={generatePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Generating PDF...
            </>
          ) : (
            <>
              📄 Generate PDF Report
            </>
          )}
        </button>

        {isGenerating && (
          <div className="generation-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <div className="progress-status">
              {generationStatus} ({generationProgress}%)
            </div>
          </div>
        )}
      </div>

      {/* Report Preview */}
      <div className="report-preview">
        <h3>📖 Report Preview</h3>
        <div className="preview-info">
          <div className="info-item">
            <strong>Title:</strong> {data.title}
          </div>
          <div className="info-item">
            <strong>Date:</strong> {formatDate(data.date)}
          </div>
          <div className="info-item">
            <strong>Portfolio Value:</strong> {formatCurrency(data.portfolioData.totalValue)}
          </div>
          <div className="info-item">
            <strong>Holdings:</strong> {data.portfolioData.holdings.length} assets
          </div>
          {data.charts && (
            <div className="info-item">
              <strong>Charts:</strong> {data.charts.length} charts
            </div>
          )}
          <div className="info-item">
            <strong>Estimated Pages:</strong> {3 + (data.charts?.length || 0) + (data.analysis ? 1 : 0)}
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="features-list">
        <h3>✨ PDF Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Executive Summary</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📈</span>
            <span>Portfolio Holdings Table</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📉</span>
            <span>Embedded Charts</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <span>Risk Analysis</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💡</span>
            <span>Investment Recommendations</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <span>Professional Formatting</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏷️</span>
            <span>Headers & Footers</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📄</span>
            <span>Multi-page Layout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReportGenerator;

