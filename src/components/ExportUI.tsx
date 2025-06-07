/**
 * STUDENT ANALYST - Export UI
 * Unified export interface with modal, format selection, and progress tracking
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './ExportUI.css';

// Export format types
type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';
type ExportType = 'holdings' | 'historical' | 'analysis' | 'full_portfolio';
type DateRange = 'all' | '1y' | '6m' | '3m' | '1m' | 'custom';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  dateRange: DateRange;
  customStartDate?: string;
  customEndDate?: string;
  selectedAssets?: string[];
  includeMetadata: boolean;
  includeCharts: boolean;
  includeFormulas: boolean;
  compression: boolean;
}

interface ExportProgress {
  isExporting: boolean;
  progress: number;
  status: string;
  currentStep: string;
  estimatedTime?: number;
  fileSize?: string;
  downloadUrl?: string;
}

interface ExportUIProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: {
    holdings: any[];
    historicalData: any[];
    metadata: any;
    availableAssets: string[];
    dateRange: {
      start: string;
      end: string;
    };
  };
  onExportComplete?: (result: { filename: string; format: string; size: string }) => void;
}

const ExportUI: React.FC<ExportUIProps> = ({
  isOpen,
  onClose,
  portfolioData,
  onExportComplete
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState<'options' | 'progress' | 'complete'>('options');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    type: 'full_portfolio',
    dateRange: 'all',
    selectedAssets: [],
    includeMetadata: true,
    includeCharts: true,
    includeFormulas: true,
    compression: false
  });
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    status: '',
    currentStep: ''
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Format configurations
  const formatConfigs = {
    csv: {
      name: 'CSV',
      description: 'Comma-separated values for Excel/Sheets',
      icon: '📄',
      features: ['Universal compatibility', 'Small file size', 'Easy to import'],
      supports: { charts: false, formulas: false, multiple_sheets: false }
    },
    excel: {
      name: 'Excel',
      description: 'Microsoft Excel with formulas and charts',
      icon: '📊',
      features: ['Advanced formulas', 'Multiple sheets', 'Chart data'],
      supports: { charts: true, formulas: true, multiple_sheets: true }
    },
    json: {
      name: 'JSON',
      description: 'Structured data for developers',
      icon: '📋',
      features: ['API-ready format', 'Nested data', 'Easy parsing'],
      supports: { charts: false, formulas: false, multiple_sheets: false }
    },
    pdf: {
      name: 'PDF',
      description: 'Professional report document',
      icon: '📑',
      features: ['Print-ready', 'Professional layout', 'Charts included'],
      supports: { charts: true, formulas: false, multiple_sheets: true }
    }
  };

  // Export type configurations
  const typeConfigs = {
    holdings: {
      name: 'Portfolio Holdings',
      description: 'Current positions and allocations',
      icon: '💼',
      estimatedSize: '50KB'
    },
    historical: {
      name: 'Historical Data',
      description: 'Price history and performance',
      icon: '📈',
      estimatedSize: '2MB'
    },
    analysis: {
      name: 'Analysis Report',
      description: 'Risk metrics and performance analysis',
      icon: '🎯',
      estimatedSize: '200KB'
    },
    full_portfolio: {
      name: 'Complete Portfolio',
      description: 'All data with comprehensive analysis',
      icon: '📦',
      estimatedSize: '5MB'
    }
  };

  // Date range options
  const dateRangeOptions = [
    { value: 'all', label: 'All Available Data', days: null },
    { value: '1y', label: 'Last 12 Months', days: 365 },
    { value: '6m', label: 'Last 6 Months', days: 180 },
    { value: '3m', label: 'Last 3 Months', days: 90 },
    { value: '1m', label: 'Last Month', days: 30 },
    { value: 'custom', label: 'Custom Range', days: null }
  ];

  // Calculate estimated file size and time
  const estimatedMetrics = useMemo(() => {
    const baseSize = parseInt(typeConfigs[exportOptions.type].estimatedSize.replace(/[^\d]/g, ''));
    let multiplier = 1;

    // Adjust for format
    if (exportOptions.format === 'excel') multiplier *= 1.5;
    if (exportOptions.format === 'pdf') multiplier *= 2;
    if (exportOptions.format === 'json') multiplier *= 0.8;

    // Adjust for options
    if (exportOptions.includeCharts) multiplier *= 1.3;
    if (exportOptions.includeFormulas) multiplier *= 1.2;
    if (exportOptions.compression) multiplier *= 0.6;

    // Adjust for date range
    if (exportOptions.dateRange !== 'all') {
      const rangeOption = dateRangeOptions.find(r => r.value === exportOptions.dateRange);
      if (rangeOption?.days) {
        const totalDays = 365; // Assume 1 year of data
        multiplier *= (rangeOption.days / totalDays);
      }
    }

    const estimatedSize = Math.round(baseSize * multiplier);
    const estimatedTime = Math.max(2, Math.round(estimatedSize / 1000)); // Rough estimate

    return {
      size: estimatedSize > 1000 ? `${(estimatedSize / 1000).toFixed(1)}MB` : `${estimatedSize}KB`,
      time: estimatedTime
    };
  }, [exportOptions]);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    
    if (exportOptions.type === 'historical' && exportOptions.dateRange === 'custom') {
      if (!exportOptions.customStartDate || !exportOptions.customEndDate) {
        errors.push('Custom date range requires both start and end dates');
      }
      if (exportOptions.customStartDate && exportOptions.customEndDate && 
          new Date(exportOptions.customStartDate) >= new Date(exportOptions.customEndDate)) {
        errors.push('Start date must be before end date');
      }
    }

    if (exportOptions.selectedAssets && exportOptions.selectedAssets.length === 0 && 
        exportOptions.type !== 'full_portfolio') {
      errors.push('Please select at least one asset');
    }

    const format = formatConfigs[exportOptions.format];
    if (exportOptions.includeCharts && !format.supports.charts) {
      errors.push(`${format.name} format does not support charts`);
    }
    if (exportOptions.includeFormulas && !format.supports.formulas) {
      errors.push(`${format.name} format does not support formulas`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [exportOptions]);

  // Handle option changes
  const updateOption = useCallback((key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle asset selection
  const toggleAsset = useCallback((asset: string) => {
    setExportOptions(prev => ({
      ...prev,
      selectedAssets: prev.selectedAssets?.includes(asset)
        ? prev.selectedAssets.filter(a => a !== asset)
        : [...(prev.selectedAssets || []), asset]
    }));
  }, []);

  // Mock export function
  const performExport = useCallback(async () => {
    setCurrentStep('progress');
    setExportProgress({
      isExporting: true,
      progress: 0,
      status: 'Initializing export...',
      currentStep: 'Preparing data'
    });

    try {
      // Simulate export steps
      const steps = [
        { progress: 10, status: 'Collecting portfolio data...', step: 'Data collection' },
        { progress: 25, status: 'Processing holdings...', step: 'Holdings processing' },
        { progress: 45, status: 'Generating historical analysis...', step: 'Historical data' },
        { progress: 65, status: 'Creating risk metrics...', step: 'Risk analysis' },
        { progress: 80, status: 'Formatting output...', step: 'Format generation' },
        { progress: 95, status: 'Finalizing file...', step: 'File preparation' },
        { progress: 100, status: 'Export complete!', step: 'Complete' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        setExportProgress(prev => ({
          ...prev,
          progress: step.progress,
          status: step.status,
          currentStep: step.step,
          estimatedTime: step.progress < 100 ? Math.round((100 - step.progress) * 0.1) : 0
        }));
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `portfolio_${exportOptions.type}_${timestamp}.${exportOptions.format}`;
      
      // Simulate file creation
      const blob = new Blob(['Mock export data'], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      setExportProgress(prev => ({
        ...prev,
        downloadUrl: url,
        fileSize: estimatedMetrics.size
      }));

      setCurrentStep('complete');
      
      onExportComplete?.({
        filename,
        format: formatConfigs[exportOptions.format].name,
        size: estimatedMetrics.size
      });

    } catch (error) {
      setErrors(['Export failed. Please try again.']);
      setCurrentStep('options');
      setExportProgress({
        isExporting: false,
        progress: 0,
        status: '',
        currentStep: ''
      });
    }
  }, [exportOptions, estimatedMetrics, onExportComplete]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (exportProgress.downloadUrl) {
      const link = document.createElement('a');
      link.href = exportProgress.downloadUrl;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `portfolio_${exportOptions.type}_${timestamp}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [exportProgress.downloadUrl, exportOptions]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!exportProgress.isExporting) {
      setCurrentStep('options');
      setExportProgress({
        isExporting: false,
        progress: 0,
        status: '',
        currentStep: ''
      });
      setErrors([]);
      onClose();
    }
  }, [exportProgress.isExporting, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !exportProgress.isExporting) {
        handleClose();
      }
      if (e.key === 'Enter' && currentStep === 'options' && validation.isValid) {
        performExport();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, exportProgress.isExporting, currentStep, validation.isValid, handleClose, performExport]);

  if (!isOpen) return null;

  return (
    <div className="export-ui-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="export-ui-modal">
        {/* Modal Header */}
        <div className="export-modal-header">
          <div className="export-modal-title">
            <span className="export-icon">📤</span>
            <h2>Export Portfolio Data</h2>
          </div>
          {!exportProgress.isExporting && (
            <button 
              className="export-close-btn"
              onClick={handleClose}
              aria-label="Close export modal"
            >
              ✕
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="export-steps">
          <div className={`export-step ${currentStep === 'options' ? 'active' : currentStep !== 'options' ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Configure</span>
          </div>
          <div className="export-step-connector"></div>
          <div className={`export-step ${currentStep === 'progress' ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Export</span>
          </div>
          <div className="export-step-connector"></div>
          <div className={`export-step ${currentStep === 'complete' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Download</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="export-modal-content">
          {currentStep === 'options' && (
            <div className="export-options">
              {/* Format Selection */}
              <div className="export-section">
                <h3>📋 Export Format</h3>
                <div className="format-grid">
                  {Object.entries(formatConfigs).map(([key, config]) => (
                    <button
                      key={key}
                      className={`format-card ${exportOptions.format === key ? 'selected' : ''}`}
                      onClick={() => updateOption('format', key as ExportFormat)}
                    >
                      <span className="format-icon">{config.icon}</span>
                      <div className="format-info">
                        <h4>{config.name}</h4>
                        <p>{config.description}</p>
                        <ul className="format-features">
                          {config.features.map(feature => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Type Selection */}
              <div className="export-section">
                <h3>📊 Data Type</h3>
                <div className="type-grid">
                  {Object.entries(typeConfigs).map(([key, config]) => (
                    <button
                      key={key}
                      className={`type-card ${exportOptions.type === key ? 'selected' : ''}`}
                      onClick={() => updateOption('type', key as ExportType)}
                    >
                      <span className="type-icon">{config.icon}</span>
                      <div className="type-info">
                        <h4>{config.name}</h4>
                        <p>{config.description}</p>
                        <span className="type-size">~{config.estimatedSize}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="export-section">
                <h3>📅 Date Range</h3>
                <div className="date-range-controls">
                  <div className="date-range-options">
                    {dateRangeOptions.map(option => (
                      <label
                        key={option.value}
                        className={`date-range-option ${exportOptions.dateRange === option.value ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="dateRange"
                          value={option.value}
                          checked={exportOptions.dateRange === option.value}
                          onChange={(e) => updateOption('dateRange', e.target.value as DateRange)}
                        />
                        <span className="radio-label">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  {exportOptions.dateRange === 'custom' && (
                    <div className="custom-date-inputs">
                      <div className="date-input-group">
                        <label htmlFor="custom-start-date">Start Date</label>
                        <input
                          id="custom-start-date"
                          type="date"
                          value={exportOptions.customStartDate || ''}
                          onChange={(e) => updateOption('customStartDate', e.target.value)}
                          max={exportOptions.customEndDate || portfolioData.dateRange.end}
                        />
                      </div>
                      <div className="date-input-group">
                        <label htmlFor="custom-end-date">End Date</label>
                        <input
                          id="custom-end-date"
                          type="date"
                          value={exportOptions.customEndDate || ''}
                          onChange={(e) => updateOption('customEndDate', e.target.value)}
                          min={exportOptions.customStartDate || portfolioData.dateRange.start}
                          max={portfolioData.dateRange.end}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Selection */}
              {exportOptions.type !== 'full_portfolio' && (
                <div className="export-section">
                  <h3>🎯 Asset Selection</h3>
                  <div className="asset-selection">
                    <div className="asset-selection-header">
                      <button
                        className="select-all-btn"
                        onClick={() => updateOption('selectedAssets', 
                          exportOptions.selectedAssets?.length === portfolioData.availableAssets.length 
                            ? [] 
                            : portfolioData.availableAssets
                        )}
                      >
                        {exportOptions.selectedAssets?.length === portfolioData.availableAssets.length 
                          ? 'Deselect All' 
                          : 'Select All'}
                      </button>
                      <span className="selection-count">
                        {exportOptions.selectedAssets?.length || 0} of {portfolioData.availableAssets.length} selected
                      </span>
                    </div>
                    <div className="asset-list">
                      {portfolioData.availableAssets.map(asset => (
                        <label
                          key={asset}
                          className={`asset-option ${exportOptions.selectedAssets?.includes(asset) ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={exportOptions.selectedAssets?.includes(asset) || false}
                            onChange={() => toggleAsset(asset)}
                          />
                          <span className="asset-symbol">{asset}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Options */}
              <div className="export-section">
                <h3>⚙️ Advanced Options</h3>
                <div className="advanced-options">
                  <label className={`option-toggle ${exportOptions.includeMetadata ? 'enabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => updateOption('includeMetadata', e.target.checked)}
                    />
                    <span className="toggle-label">Include Metadata</span>
                    <span className="toggle-description">Portfolio info and timestamps</span>
                  </label>

                  {formatConfigs[exportOptions.format].supports.charts && (
                    <label className={`option-toggle ${exportOptions.includeCharts ? 'enabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={exportOptions.includeCharts}
                        onChange={(e) => updateOption('includeCharts', e.target.checked)}
                      />
                      <span className="toggle-label">Include Chart Data</span>
                      <span className="toggle-description">Data formatted for charts</span>
                    </label>
                  )}

                  {formatConfigs[exportOptions.format].supports.formulas && (
                    <label className={`option-toggle ${exportOptions.includeFormulas ? 'enabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={exportOptions.includeFormulas}
                        onChange={(e) => updateOption('includeFormulas', e.target.checked)}
                      />
                      <span className="toggle-label">Include Formulas</span>
                      <span className="toggle-description">Live calculations in spreadsheets</span>
                    </label>
                  )}

                  <label className={`option-toggle ${exportOptions.compression ? 'enabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={exportOptions.compression}
                      onChange={(e) => updateOption('compression', e.target.checked)}
                    />
                    <span className="toggle-label">Compress File</span>
                    <span className="toggle-description">Reduce file size with ZIP compression</span>
                  </label>
                </div>
              </div>

              {/* Export Summary */}
              <div className="export-summary">
                <div className="summary-item">
                  <span className="summary-label">Estimated Size:</span>
                  <span className="summary-value">{estimatedMetrics.size}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Estimated Time:</span>
                  <span className="summary-value">{estimatedMetrics.time}s</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Format:</span>
                  <span className="summary-value">{formatConfigs[exportOptions.format].name}</span>
                </div>
              </div>

              {/* Validation Errors */}
              {!validation.isValid && (
                <div className="export-errors">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="error-message">
                      ⚠️ {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'progress' && (
            <div className="export-progress-view">
              <div className="progress-animation">
                <div className="progress-circle">
                  <svg viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#1e40af"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - exportProgress.progress / 100)}`}
                      transform="rotate(-90 50 50)"
                      className="progress-stroke"
                    />
                  </svg>
                  <div className="progress-text">
                    <span className="progress-percentage">{exportProgress.progress}%</span>
                  </div>
                </div>
              </div>
              
              <div className="progress-details">
                <h3>{exportProgress.status}</h3>
                <p>Current step: {exportProgress.currentStep}</p>
                {exportProgress.estimatedTime && exportProgress.estimatedTime > 0 && (
                  <p className="progress-time">
                    Estimated time remaining: {exportProgress.estimatedTime}s
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="export-complete-view">
              <div className="success-animation">
                <div className="success-icon">✅</div>
              </div>
              
              <div className="complete-details">
                <h3>Export Complete!</h3>
                <p>Your portfolio data has been successfully exported.</p>
                
                <div className="export-result">
                  <div className="result-item">
                    <span className="result-label">Format:</span>
                    <span className="result-value">{formatConfigs[exportOptions.format].name}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">File Size:</span>
                    <span className="result-value">{exportProgress.fileSize}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Data Type:</span>
                    <span className="result-value">{typeConfigs[exportOptions.type].name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="export-modal-footer">
          {currentStep === 'options' && (
            <>
              <button
                className="export-btn secondary"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                className={`export-btn primary ${!validation.isValid ? 'disabled' : ''}`}
                onClick={performExport}
                disabled={!validation.isValid}
              >
                Start Export
              </button>
            </>
          )}

          {currentStep === 'progress' && (
            <div className="progress-footer">
              <span className="progress-status-text">
                Please wait while we prepare your export...
              </span>
            </div>
          )}

          {currentStep === 'complete' && (
            <>
              <button
                className="export-btn secondary"
                onClick={handleClose}
              >
                Close
              </button>
              <button
                className="export-btn primary"
                onClick={handleDownload}
              >
                📥 Download File
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportUI;

