/**
 * STUDENT ANALYST - Data Transformation Demo Component
 * Professional demonstration of data transformation and normalization capabilities
 */

import React, { useState, useCallback } from 'react';
import { alphaVantageService } from '../services/AlphaVantageService';
import { dataTransformationService, TransformationResult } from '../services/DataTransformationService';
import { DataAnomaly } from '../models/StandardizedData';

interface TransformationState {
  isProcessing: boolean;
  result: TransformationResult | null;
  error: string;
  processingSteps: string[];
}

const DataTransformationDemo: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [transformationState, setTransformationState] = useState<TransformationState>({
    isProcessing: false,
    result: null,
    error: '',
    processingSteps: []
  });

  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);

  const demoSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF' }
  ];

  const addProcessingStep = useCallback((step: string) => {
    setTransformationState(prev => ({
      ...prev,
      processingSteps: [...prev.processingSteps, step]
    }));
  }, []);

  const performTransformation = async () => {
    setTransformationState({
      isProcessing: true,
      result: null,
      error: '',
      processingSteps: []
    });

    try {
      addProcessingStep('🔄 Fetching raw data from Alpha Vantage...');
      
      const rawData = await alphaVantageService.getStockData({
        symbol,
        timeframe
      });

      addProcessingStep(`✅ Raw data retrieved: ${rawData.data.length} data points`);
      addProcessingStep('🔧 Starting data transformation process...');

      const transformationOptions = {
        adjustForSplits: true,
        adjustForDividends: true,
        detectAnomalies: true,
        validateData: true,
        minQualityScore: 70,
        allowPartialData: true
      };

      addProcessingStep('📅 Normalizing dates to ISO 8601 format...');
      addProcessingStep('💰 Adjusting prices for stock splits...');
      addProcessingStep('📊 Standardizing volume units...');
      addProcessingStep('🔍 Detecting data anomalies...');
      addProcessingStep('✔️ Validating OHLC consistency...');

      const result = await dataTransformationService.transformAlphaVantageData(
        rawData,
        transformationOptions
      );

      addProcessingStep(`🎯 Transformation completed with quality score: ${result.data?.quality.qualityScore || 0}`);

      setTransformationState(prev => ({
        ...prev,
        isProcessing: false,
        result
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTransformationState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
    }
  };

  const getQualityColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Data Transformation & Normalization System
          </h1>
          <p className="text-gray-600 mb-6">
            Professional demonstration of our advanced data transformation engine that converts raw financial data 
            into standardized, validated, and enriched datasets ready for sophisticated analysis.
          </p>

          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Symbol
              </label>
              <select
                id="stock-symbol-select"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                aria-label="Stock Symbol Selection"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={transformationState.isProcessing}
              >
                {demoSymbols.map(stock => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <select
                id="timeframe-select"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                aria-label="Timeframe Selection"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={transformationState.isProcessing}
              >
                <option value="DAILY">Daily Data</option>
                <option value="WEEKLY">Weekly Data</option>
                <option value="MONTHLY">Monthly Data</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={performTransformation}
                disabled={transformationState.isProcessing}
                className={`w-full px-6 py-2 rounded-md font-medium transition-colors ${
                  transformationState.isProcessing
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {transformationState.isProcessing ? '⏳ Processing...' : '🚀 Transform Data'}
              </button>
            </div>
          </div>

          {/* Processing Steps */}
          {transformationState.processingSteps.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Processing Steps</h3>
              <div className="space-y-2">
                {transformationState.processingSteps.map((step) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <span className="mr-2">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {transformationState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-600 text-xl mr-2">❌</span>
                <div>
                  <h3 className="text-red-800 font-semibold">Transformation Failed</h3>
                  <p className="text-red-700">{transformationState.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {transformationState.result?.success && transformationState.result.data && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Quality Score</p>
                    <p className={`text-2xl font-bold ${getQualityColor(transformationState.result.data.quality.qualityScore)}`}>
                      {transformationState.result.data.quality.qualityScore}%
                    </p>
                  </div>
                  <span className="text-2xl">⭐</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Points</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {transformationState.result.data.data.length}
                    </p>
                  </div>
                  <span className="text-2xl">📈</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Processing Time</p>
                    <p className="text-2xl font-bold text-green-600">
                      {transformationState.result.processingTime}ms
                    </p>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Anomalies</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {transformationState.result.data.quality.anomalies.length}
                    </p>
                  </div>
                  <span className="text-2xl">🔍</span>
                </div>
              </div>
            </div>

            {/* Data Quality Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Data Quality Assessment</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Quality Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price Confidence</span>
                      <span className="font-semibold text-blue-600">
                        {transformationState.result.data.quality.priceConfidence}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Volume Confidence</span>
                      <span className="font-semibold text-blue-600">
                        {transformationState.result.data.quality.volumeConfidence}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Date Confidence</span>
                      <span className="font-semibold text-blue-600">
                        {transformationState.result.data.quality.dateConfidence}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Issues</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        transformationState.result.data.quality.hasPriceAnomalies ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                      <span className="text-sm text-gray-700">Price Anomalies</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        transformationState.result.data.quality.hasVolumeAnomalies ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                      <span className="text-sm text-gray-700">Volume Anomalies</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        transformationState.result.data.quality.hasDateGaps ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                      <span className="text-sm text-gray-700">Date Gaps</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomalies List */}
              {transformationState.result.data.quality.anomalies.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">🚨 Detected Anomalies</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {transformationState.result.data.quality.anomalies.map((anomaly: DataAnomaly, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{anomaly.date}</span>
                            <p className="text-sm mt-1">{anomaly.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                            {anomaly.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Data Sample */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Transformed Data Sample</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Open</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">High</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Low</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Close</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Volume</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformationState.result.data.data.slice(0, 10).map((point: any, index: number) => (
                      <tr 
                        key={index} 
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          point.hasAnomalies ? 'bg-yellow-50' : ''
                        }`}
                        onClick={() => setSelectedDataPoint(point)}
                      >
                        <td className="py-3 px-4 text-sm">{point.date}</td>
                        <td className="py-3 px-4 text-sm">${formatNumber(point.open)}</td>
                        <td className="py-3 px-4 text-sm">${formatNumber(point.high)}</td>
                        <td className="py-3 px-4 text-sm">${formatNumber(point.low)}</td>
                        <td className="py-3 px-4 text-sm">${formatNumber(point.close)}</td>
                        <td className="py-3 px-4 text-sm">{formatVolume(point.volume)}</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center">
                            {point.isAdjusted && <span className="text-blue-600 mr-1" title="Split Adjusted">🔄</span>}
                            {point.hasAnomalies && <span className="text-yellow-600 mr-1" title="Has Anomalies">⚠️</span>}
                            {point.marketOpen ? <span className="text-green-600" title="Market Open">✅</span> : <span className="text-gray-400" title="Market Closed">⭕</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                Showing first 10 of {transformationState.result.data.data.length} data points. 
                Click a row to see detailed information.
              </p>
            </div>

            {/* Processing Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Transformation Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Processing Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Records Processed:</span>
                      <span className="font-medium">{transformationState.result.transformationSummary.recordsProcessed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Records Filtered:</span>
                      <span className="font-medium">{transformationState.result.transformationSummary.recordsFiltered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Anomalies Detected:</span>
                      <span className="font-medium">{transformationState.result.transformationSummary.anomaliesDetected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adjustments Applied:</span>
                      <span className="font-medium">{transformationState.result.transformationSummary.adjustmentsApplied}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Metadata</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Symbol:</span>
                      <span className="font-medium">{transformationState.result.data.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">{transformationState.result.data.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Type:</span>
                      <span className="font-medium">{transformationState.result.data.dataType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timeframe:</span>
                      <span className="font-medium">{transformationState.result.data.timeframe}</span>
                    </div>
                  </div>
                </div>
              </div>

              {transformationState.result.warnings.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Warnings</h4>
                  <ul className="list-disc list-inside text-yellow-700 text-sm">
                    {transformationState.result.warnings.map((warning) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Data Point Details */}
        {selectedDataPoint && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Data Point Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Price Data</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{selectedDataPoint.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Open:</span>
                    <span className="font-medium">${formatNumber(selectedDataPoint.open)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High:</span>
                    <span className="font-medium">${formatNumber(selectedDataPoint.high)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Low:</span>
                    <span className="font-medium">${formatNumber(selectedDataPoint.low)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Close:</span>
                    <span className="font-medium">${formatNumber(selectedDataPoint.close)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium">{selectedDataPoint.volume.toLocaleString()} shares</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quality Flags</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Split Adjusted:</span>
                    <span className={`font-medium ${selectedDataPoint.isAdjusted ? 'text-blue-600' : 'text-gray-500'}`}>
                      {selectedDataPoint.isAdjusted ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Has Anomalies:</span>
                    <span className={`font-medium ${selectedDataPoint.hasAnomalies ? 'text-yellow-600' : 'text-green-600'}`}>
                      {selectedDataPoint.hasAnomalies ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market Open:</span>
                    <span className={`font-medium ${selectedDataPoint.marketOpen ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedDataPoint.marketOpen ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {selectedDataPoint.validationFlags.length > 0 && (
                    <div>
                      <span className="text-gray-600">Validation Flags:</span>
                      <div className="mt-1">
                        {selectedDataPoint.validationFlags.map((flag: string, index: number) => (
                          <span key={index} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-1">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedDataPoint(null)}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTransformationDemo; 

