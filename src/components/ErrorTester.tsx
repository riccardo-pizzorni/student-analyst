import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BuggyComponentProps {
  shouldThrow: boolean;
  errorType: string;
}

// Component that throws errors on purpose for testing
const BuggyComponent: React.FC<BuggyComponentProps> = ({ shouldThrow, errorType }) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'render': {
        throw new Error('Simulated render error - Component failed during rendering');
      }
      case 'null-access': {
        const obj = null as unknown;
        return <div>{(obj as { nonExistentProperty: string }).nonExistentProperty}</div>;
      }
      case 'undefined-method': {
        const undefinedObj = {} as { nonExistentMethod: () => void };
        undefinedObj.nonExistentMethod();
        break;
      }
      case 'type-error': {
        const str = "hello" as unknown;
        (str as string[]).push('world'); // This will throw TypeError
        break;
      }
      case 'custom': {
        throw new Error('Custom test error triggered by user');
      }
      default:
        throw new Error('Generic test error');
    }
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-800">✅ Component is working normally - no errors thrown</p>
    </div>
  );
};

export const ErrorTester: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [errorType, setErrorType] = useState('render');

  const errorTypes = [
    { value: 'render', label: 'Render Error', description: 'Error during component rendering' },
    { value: 'null-access', label: 'Null Access', description: 'Accessing property of null object' },
    { value: 'undefined-method', label: 'Undefined Method', description: 'Calling undefined method' },
    { value: 'type-error', label: 'Type Error', description: 'Type mismatch error' },
    { value: 'custom', label: 'Custom Error', description: 'Custom triggered error' }
  ];

  const handleTriggerError = () => {
    setShouldThrow(true);
  };

  const handleReset = () => {
    setShouldThrow(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Error Boundary Tester
        </h2>
        <p className="text-gray-600">
          Test the error handling capabilities of our application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Type Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            🎯 Error Type Selection
          </h3>
          
          <div className="space-y-2 mb-4">
            {errorTypes.map((type) => (
              <label key={type.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  value={type.value}
                  checked={errorType === type.value}
                  onChange={(e) => setErrorType(e.target.value)}
                  className="text-blue-600"
                />
                <div>
                  <span className="font-medium">{type.label}</span>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleTriggerError}
              variant="destructive"
              className="w-full"
              disabled={shouldThrow}
            >
              🚨 Trigger Error
            </Button>
            
            <Button 
              onClick={handleReset}
              variant="outline"
              className="w-full"
              disabled={!shouldThrow}
            >
              🔄 Reset Component
            </Button>
          </div>
        </div>

        {/* Error Information */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            📋 Error Information
          </h3>
          
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <h4 className="font-semibold text-blue-800">What ErrorBoundary CATCHES:</h4>
              <ul className="list-disc list-inside text-blue-700 mt-1">
                <li>Errors during rendering</li>
                <li>Errors in lifecycle methods</li>
                <li>Errors in constructor</li>
                <li>Errors in child components</li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
              <h4 className="font-semibold text-red-800">What ErrorBoundary DOESN'T CATCH:</h4>
              <ul className="list-disc list-inside text-red-700 mt-1">
                <li>Event handlers</li>
                <li>Async code (setTimeout, promises)</li>
                <li>Server-side rendering</li>
                <li>Errors in ErrorBoundary itself</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Test Components */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🔬 Test Components
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Component Under Test (Wrapped in ErrorBoundary):</h4>
            <BuggyComponent shouldThrow={shouldThrow} errorType={errorType} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorTester; 

