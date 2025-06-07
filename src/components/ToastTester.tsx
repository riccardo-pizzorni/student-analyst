import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToastFeedback, useFinancialToasts, useNotifications } from './NotificationProvider';

export const ToastTester: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [isAutomatedTest, setIsAutomatedTest] = useState(false);
  
  const { showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showLoadingToast } = useToastFeedback();
  const {
    notifyCalculationStart,
    notifyCalculationSuccess,
    notifyCalculationError,
    notifyDataValidation,
    notifyApiConnection,
    notifyPerformanceIssue,
    notifyFallbackUsed,
  } = useFinancialToasts();
  const { notifications, clearAll } = useNotifications();

  const incrementCounter = () => setCounter(prev => prev + 1);

  // Basic Toast Tests
  const testSuccessToast = () => {
    incrementCounter();
    showSuccessToast(
      'Operation Successful',
      `Test #${counter + 1}: This is a success message that auto-dismisses after 3 seconds.`
    );
  };

  const testErrorToast = () => {
    incrementCounter();
    showErrorToast(
      'Critical Error',
      `Test #${counter + 1}: This is an error message that persists until manually dismissed.`,
      { persistent: true }
    );
  };

  const testWarningToast = () => {
    incrementCounter();
    showWarningToast(
      'Warning Alert',
      `Test #${counter + 1}: This is a warning that auto-dismisses after 6 seconds.`
    );
  };

  const testInfoToast = () => {
    incrementCounter();
    showInfoToast(
      'Information',
      `Test #${counter + 1}: This is an informational message that auto-dismisses after 5 seconds.`
    );
  };

  const testLoadingToast = () => {
    incrementCounter();
    const loadingId = showLoadingToast(
      'Processing',
      `Test #${counter + 1}: This is a loading message that stays until manually dismissed.`
    );
    
    // Auto-dismiss after 3 seconds for demo purposes
    setTimeout(() => {
      showSuccessToast('Loading Complete', 'The operation has finished successfully.');
    }, 3000);
    
    return loadingId;
  };

  // Financial-Specific Toast Tests
  const testCalculationFlow = async () => {
    incrementCounter();
    const testNum = counter + 1;
    
    // Start calculation
    const loadingId = notifyCalculationStart('Portfolio Analysis');
    
    // Simulate calculation time
    setTimeout(() => {
      notifyCalculationSuccess('Portfolio Analysis', 245, 'PyScript');
    }, 2000);
  };

  const testCalculationError = () => {
    incrementCounter();
    notifyCalculationError(
      'Monte Carlo Simulation',
      'Invalid input parameters: volatility cannot be negative'
    );
  };

  const testApiFlow = async () => {
    incrementCounter();
    
    // Connecting
    notifyApiConnection('Alpha Vantage', 'connecting');
    
    setTimeout(() => {
      notifyApiConnection('Alpha Vantage', 'connected');
    }, 1500);
    
    setTimeout(() => {
      notifyApiConnection('Yahoo Finance', 'error', 'Rate limit exceeded');
    }, 3000);
  };

  const testPerformanceWarning = () => {
    incrementCounter();
    notifyPerformanceIssue('Portfolio Optimization', 2500, 1000);
  };

  const testFallbackNotification = () => {
    incrementCounter();
    notifyFallbackUsed('PyScript', 'JavaScript', 'Browser compatibility issue detected');
  };

  const testDataValidation = () => {
    incrementCounter();
    notifyDataValidation('Some stock prices appear unusually high. Please verify data accuracy.');
  };

  // Queue Testing
  const testMultipleToasts = () => {
    const baseCounter = counter;
    
    showInfoToast('Queue Test Started', 'Testing multiple notifications in sequence...');
    
    setTimeout(() => showSuccessToast('Queue Item 1', `Success notification #${baseCounter + 1}`), 200);
    setTimeout(() => showWarningToast('Queue Item 2', `Warning notification #${baseCounter + 2}`), 400);
    setTimeout(() => showErrorToast('Queue Item 3', `Error notification #${baseCounter + 3}`), 600);
    setTimeout(() => showInfoToast('Queue Test Complete', 'All notifications queued successfully'), 800);
    
    setCounter(prev => prev + 5);
  };

  const testLongMessages = () => {
    incrementCounter();
    showWarningToast(
      'Very Long Notification Title That Tests Text Wrapping',
      `Test #${counter + 1}: This is a very long message that tests how the toast component handles extensive text content. It should wrap properly and maintain readability while not taking up too much screen space. The message includes details about portfolio analysis, risk metrics, and various financial calculations.`
    );
  };

  // Automated Test Suite
  const runAutomatedTests = async () => {
    setIsAutomatedTest(true);
    
    const tests = [
      { name: 'Success Toast', fn: testSuccessToast, delay: 1000 },
      { name: 'Warning Toast', fn: testWarningToast, delay: 1500 },
      { name: 'Info Toast', fn: testInfoToast, delay: 2000 },
      { name: 'Loading Toast', fn: testLoadingToast, delay: 2500 },
      { name: 'Calculation Flow', fn: testCalculationFlow, delay: 3000 },
      { name: 'API Flow', fn: testApiFlow, delay: 4000 },
      { name: 'Performance Warning', fn: testPerformanceWarning, delay: 6000 },
      { name: 'Fallback Notification', fn: testFallbackNotification, delay: 7000 },
      { name: 'Data Validation', fn: testDataValidation, delay: 8000 },
    ];
    
    showInfoToast('Automated Test Started', `Running ${tests.length} toast notification tests...`);
    
    for (const test of tests) {
      setTimeout(() => {
        test.fn();
        showInfoToast('Test Running', `Executing: ${test.name}`);
      }, test.delay);
    }
    
    setTimeout(() => {
      showSuccessToast('All Tests Complete', 'Automated toast testing finished successfully');
      setIsAutomatedTest(false);
    }, 9000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          🍞 Toast Notification System Tester
        </h2>
        <p className="text-gray-600">
          Test the enhanced user feedback system with animations, progress bars, and auto-dismiss functionality
        </p>
        
        <div className="flex justify-center items-center space-x-4">
          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
            Tests Run: <span className="font-bold">{counter}</span>
          </div>
          <div className="bg-blue-100 px-3 py-1 rounded-full text-sm">
            Active Notifications: <span className="font-bold">{notifications.length}</span>
          </div>
        </div>
      </div>

      {/* Basic Toast Tests */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🎨 Basic Toast Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button onClick={testSuccessToast} variant="outline" className="bg-green-50 hover:bg-green-100">
            ✅ Success
          </Button>
          <Button onClick={testErrorToast} variant="outline" className="bg-red-50 hover:bg-red-100">
            ❌ Error
          </Button>
          <Button onClick={testWarningToast} variant="outline" className="bg-yellow-50 hover:bg-yellow-100">
            ⚠️ Warning
          </Button>
          <Button onClick={testInfoToast} variant="outline" className="bg-blue-50 hover:bg-blue-100">
            ℹ️ Info
          </Button>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button onClick={testLoadingToast} variant="outline">
            🔄 Loading Toast
          </Button>
          <Button onClick={testLongMessages} variant="outline">
            📝 Long Message
          </Button>
        </div>
      </div>

      {/* Financial-Specific Tests */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          💼 Financial Application Tests
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button onClick={testCalculationFlow} variant="outline">
            📊 Calculation Flow
          </Button>
          <Button onClick={testCalculationError} variant="outline">
            ❌ Calculation Error
          </Button>
          <Button onClick={testApiFlow} variant="outline">
            🌐 API Connection Flow
          </Button>
          <Button onClick={testPerformanceWarning} variant="outline">
            ⚡ Performance Warning
          </Button>
          <Button onClick={testFallbackNotification} variant="outline">
            🔄 Fallback System
          </Button>
          <Button onClick={testDataValidation} variant="outline">
            🔍 Data Validation
          </Button>
        </div>
      </div>

      {/* Advanced Tests */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🚀 Advanced Testing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={testMultipleToasts} variant="outline">
            📋 Queue Test
          </Button>
          <Button 
            onClick={runAutomatedTests} 
            disabled={isAutomatedTest}
            className="bg-purple-50 hover:bg-purple-100"
          >
            {isAutomatedTest ? '🔄 Running...' : '🤖 Auto Test Suite'}
          </Button>
          <Button onClick={clearAll} variant="destructive">
            🗑️ Clear All
          </Button>
        </div>
      </div>

      {/* Test Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-800">📋 Test Features:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <ul className="space-y-1">
            <li>• <strong>Auto-dismiss:</strong> Success (3s), Info (5s), Warning (6s), Error (8s)</li>
            <li>• <strong>Persistent:</strong> Loading messages and critical errors</li>
            <li>• <strong>Progress bars:</strong> Visual countdown for auto-dismiss</li>
            <li>• <strong>Hover pause:</strong> Mouse over to pause auto-dismiss</li>
          </ul>
          <ul className="space-y-1">
            <li>• <strong>Animations:</strong> Smooth slide-in/out with opacity</li>
            <li>• <strong>Queue management:</strong> Multiple notifications stack properly</li>
            <li>• <strong>Accessibility:</strong> ARIA labels and keyboard navigation</li>
            <li>• <strong>Responsive:</strong> Adapts to different screen sizes</li>
          </ul>
        </div>
      </div>

      {/* Current State Display */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-900">📊 Active Notifications:</h4>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="text-sm text-blue-700 bg-white p-2 rounded">
                <span className="font-medium">{notification.type.toUpperCase()}:</span> {notification.title}
                {notification.persistent && <span className="ml-2 text-xs bg-blue-100 px-1 rounded">PERSISTENT</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 

