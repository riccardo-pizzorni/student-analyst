/**
 * Progress Indicator Tester
 * Comprehensive testing component for progress indicators
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import ProgressIndicator from './ui/ProgressIndicator';
import ProgressManager from './ProgressManager';
import { useProgressIndicator, useMultipleProgressIndicators } from '../hooks/useProgressIndicator';
import { progressIndicatorService } from '../services/ProgressIndicatorService';

export const ProgressIndicatorTester: React.FC = () => {
  const [showManager, setShowManager] = useState(true);
  const [managerPosition, setManagerPosition] = useState<'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'>('top-right');
  
  // Test operations using the hook
  const matrixOp = useProgressIndicator('matrix-operation', {
    initialMessage: 'Preparing matrix calculation...',
    canCancel: true,
    onComplete: (result) => console.log('Matrix operation completed:', result),
    onError: (error) => console.error('Matrix operation failed:', (error))
  });

  const portfolioOp = useProgressIndicator('portfolio-optimization', {
    initialMessage: 'Starting portfolio optimization...',
    canCancel: true,
    metadata: { assets: 50, method: 'max_sharpe' }
  });

  const dataFetchOp = useProgressIndicator('data-fetch', {
    initialMessage: 'Fetching market data...',
    canCancel: false
  });

  const { operations, activeOperations, hasActiveOperations, cancelAll } = useMultipleProgressIndicators();

  // Simulate matrix calculation
  const runMatrixCalculation = async () => {
    matrixOp.start('Initializing matrix calculation...');
    
    try {
      // Simulate progress steps
      const steps = [
        { pct: 10, msg: 'Loading matrix data...', stage: 'loading' },
        { pct: 25, msg: 'Calculating eigenvalues...', stage: 'processing' },
        { pct: 45, msg: 'Computing matrix inverse...', stage: 'processing' },
        { pct: 70, msg: 'Optimizing calculation...', stage: 'optimizing' },
        { pct: 90, msg: 'Finalizing results...', stage: 'finalizing' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (matrixOp.isCancelled) return;
        
        matrixOp.update(step.pct, step.msg, step.stage);
        matrixOp.setMetadata({
          currentStep: step.stage,
          memoryUsage: Math.floor(Math.random() * 100) + 50
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      if (!matrixOp.isCancelled) {
        matrixOp.complete('Matrix calculation completed successfully', {
          result: 'Matrix inverted successfully',
          processingTime: 4500
        });
      }
    } catch (error) {
      matrixOp.fail(error instanceof Error ? error : new Error('Matrix calculation failed'));
    }
  };

  // Simulate portfolio optimization
  const runPortfolioOptimization = async () => {
    portfolioOp.start('Starting portfolio optimization...');
    
    try {
      const steps = [
        { pct: 15, msg: 'Fetching asset data...', stage: 'data-loading' },
        { pct: 30, msg: 'Calculating covariance matrix...', stage: 'covariance' },
        { pct: 55, msg: 'Optimizing weights...', stage: 'optimization' },
        { pct: 80, msg: 'Validating constraints...', stage: 'validation' },
        { pct: 95, msg: 'Computing metrics...', stage: 'metrics' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (portfolioOp.isCancelled) return;
        
        portfolioOp.update(step.pct, step.msg, step.stage);
        portfolioOp.setMetadata({
          assets: 50,
          method: 'max_sharpe',
          currentStep: step.stage,
          sharpeRatio: (Math.random() * 2 + 0.5).toFixed(3)
        });
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      if (!portfolioOp.isCancelled) {
        portfolioOp.complete('Portfolio optimization completed', {
          weights: Array.from({length: 50}, () => Math.random()),
          sharpeRatio: 1.234,
          expectedReturn: 0.085
        });
      }
    } catch (error) {
      portfolioOp.fail(error instanceof Error ? error : new Error('Portfolio optimization failed'));
    }
  };

  // Simulate data fetching
  const runDataFetch = async () => {
    dataFetchOp.start('Connecting to data source...');
    
    try {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
      
      for (let i = 0; i < symbols.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        if (dataFetchOp.isCancelled) return;
        
        const pct = ((i + 1) / symbols.length) * 100;
        dataFetchOp.update(
          pct, 
          `Fetching ${symbols[i]} data...`, 
          'fetching'
        );
        dataFetchOp.setMetadata({
          symbol: symbols[i],
          completed: i + 1,
          total: symbols.length
        });
      }

      if (!dataFetchOp.isCancelled) {
        dataFetchOp.complete('All market data fetched successfully');
      }
    } catch (error) {
      dataFetchOp.fail('Failed to fetch market data');
    }
  };

  // Simulate error scenario
  const runErrorTest = async () => {
    const errorOp = progressIndicatorService;
    const operationId = 'error-test-' + Date.now();
    
    errorOp.startOperation(operationId, 'Starting error test...', true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      errorOp.updateProgress(operationId, 30, 'Processing data...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      errorOp.updateProgress(operationId, 60, 'Encountering issues...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      errorOp.failOperation(operationId, 'Simulated network error');
    } catch (error) {
      errorOp.failOperation(operationId, 'Unexpected error occurred');
    }
  };

  // Simulate batch operations
  const runBatchOperations = async () => {
    const operations = [
      { id: 'batch-1', name: 'Risk Analysis' },
      { id: 'batch-2', name: 'Return Calculation' },
      { id: 'batch-3', name: 'Correlation Matrix' },
      { id: 'batch-4', name: 'Monte Carlo Simulation' }
    ];

    operations.forEach(async (op, index) => {
      await new Promise(resolve => setTimeout(resolve, index * 200));
      
      progressIndicatorService.startOperation(
        op.id,
        `Starting ${op.name}...`,
        true,
        { batchId: 'batch-test', operationName: op.name }
      );

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        progressIndicatorService.updateProgress(
          op.id,
          (i),
          `${op.name}: ${i}% complete`,
          i < 100 ? 'processing' : 'completed'
        );
      }

      progressIndicatorService.completeOperation(op.id, `${op.name} completed`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Manager */}
      {showManager && (
        <ProgressManager 
          position={managerPosition}
          maxVisible={4}
          autoHide={false}
        />
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📊 Progress Indicators System Tester
        </h2>
        <p className="text-gray-600 mb-6">
          Test comprehensive progress tracking with real-time updates, time estimation, 
          cancellation capabilities, and background processing status. This system provides 
          professional feedback for all long-running operations.
        </p>

        {/* Manager Controls */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Manager Controls</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              onClick={() => setShowManager(!showManager)}
              variant={showManager ? "default" : "outline"}
            >
              {showManager ? 'Hide Manager' : 'Show Manager'}
            </Button>
            
            <label htmlFor="manager-position-select" className="sr-only">Manager Position</label>
            <select
              id="manager-position-select"
              value={managerPosition}
              onChange={(e) => setManagerPosition(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="top-right">Top Right</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-left">Bottom Left</option>
            </select>

            {hasActiveOperations && (
              <Button onClick={cancelAll} variant="destructive" size="sm">
                Cancel All Operations
              </Button>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            Active Operations: {activeOperations.length} | 
            Total Tracked: {operations.length}
          </div>
        </div>

        {/* Test Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Single Operations</h3>
            
            <Button 
              onClick={runMatrixCalculation}
              disabled={matrixOp.isActive}
              className="w-full"
            >
              {matrixOp.isActive ? 'Running Matrix Calculation...' : 'Start Matrix Calculation'}
            </Button>

            <Button 
              onClick={runPortfolioOptimization}
              disabled={portfolioOp.isActive}
              className="w-full"
            >
              {portfolioOp.isActive ? 'Optimizing Portfolio...' : 'Start Portfolio Optimization'}
            </Button>

            <Button 
              onClick={runDataFetch}
              disabled={dataFetchOp.isActive}
              className="w-full"
            >
              {dataFetchOp.isActive ? 'Fetching Data...' : 'Start Data Fetch'}
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Batch & Special Tests</h3>
            
            <Button onClick={runBatchOperations} className="w-full">
              Run Batch Operations (4x)
            </Button>

            <Button onClick={runErrorTest} variant="destructive" className="w-full">
              Simulate Error Scenario
            </Button>

            <Button 
              onClick={() => progressIndicatorService.clearAll()} 
              variant="outline"
              className="w-full"
            >
              Clear All Operations
            </Button>
          </div>
        </div>

        {/* Individual Progress Displays */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Individual Progress Indicators</h3>
          
          {/* Matrix Operation */}
          {matrixOp.progress && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Matrix Calculation (Default)</h4>
              <ProgressIndicator
                progress={matrixOp.progress}
                onCancel={() => matrixOp.cancel()}
                variant="default"
                showStage
              />
            </div>
          )}

          {/* Portfolio Operation */}
          {portfolioOp.progress && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Portfolio Optimization (Detailed)</h4>
              <ProgressIndicator
                progress={portfolioOp.progress}
                onCancel={() => portfolioOp.cancel()}
                variant="detailed"
                size="lg"
              />
            </div>
          )}

          {/* Data Fetch Operation */}
          {dataFetchOp.progress && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Data Fetch (Minimal)</h4>
              <ProgressIndicator
                progress={dataFetchOp.progress}
                variant="minimal"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">System Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-800">Active Operations</div>
              <div className="text-blue-600">{activeOperations.length}</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Total Operations</div>
              <div className="text-blue-600">{operations.length}</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Manager Visible</div>
              <div className="text-blue-600">{showManager ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Position</div>
              <div className="text-blue-600">{managerPosition}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicatorTester; 

