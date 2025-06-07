import React, { useState, useEffect } from 'react';
import { RequestQueueManager, ProgressInfo, QueueMetrics } from '../services/RequestQueueManager';

interface QueueProgressTrackerProps {
  queueManager: RequestQueueManager;
  className?: string;
}

const QueueProgressTracker: React.FC<QueueProgressTrackerProps> = ({ 
  queueManager, 
  className = '' 
}) => {
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Subscribe to progress updates
    const handleProgress = (progressInfo: ProgressInfo) => {
      setProgress(progressInfo);
    };

    const handleError = (error: Error) => {
      console.error('Queue processing error:', (error));
    };

    queueManager.onProgress(handleProgress);
    queueManager.onError(handleError);

    // Update metrics every 5 seconds
    const metricsInterval = setInterval(() => {
      setMetrics(queueManager.getMetrics());
    }, 5000);

    // Initial metrics load
    setMetrics(queueManager.getMetrics());

    return () => {
      clearInterval(metricsInterval);
    };
  }, [queueManager]);

  const formatTime = (milliseconds: number): string => {
    if (milliseconds < 1000) return '< 1s';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  const getProgressPercentage = (): number => {
    if (!progress || progress.totalRequests === 0) return 0;
    return (progress.completedRequests / progress.totalRequests) * 100;
  };

  const getStatusColor = () => {
    if (!progress) return 'bg-gray-200';
    if (progress.failedRequests > progress.completedRequests * 0.1) return 'bg-red-500';
    if (progress.completedRequests === progress.totalRequests) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    if (!progress) return <span className="text-sm">🕒</span>;
    if (progress.failedRequests > progress.completedRequests * 0.1) return <span className="text-sm text-red-500">❌</span>;
    if (progress.completedRequests === progress.totalRequests) return <span className="text-sm text-green-500">✅</span>;
    return <span className="text-sm text-blue-500">▶️</span>;
  };

  const handlePauseResume = () => {
    const status = queueManager.getQueueStatus();
    if (status.isProcessing) {
      queueManager.pauseProcessing();
    } else {
      queueManager.resumeProcessing();
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('Are you sure you want to clear all pending requests?')) {
      queueManager.clearQueue();
    }
  };

  if (!progress) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-lg text-gray-400">🕒</span>
          <span className="text-sm text-gray-500">Initializing queue manager...</span>
        </div>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const status = queueManager.getQueueStatus();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Main Progress Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium text-sm">
              Request Queue Status
            </span>
            {progress.currentRequest && (
              <span className="text-xs text-gray-500">
                Processing {progress.currentRequest.symbol}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePauseResume}
              className="p-1 hover:bg-gray-100 rounded"
              title={status.isProcessing ? 'Pause Queue' : 'Resume Queue'}
            >
              {status.isProcessing ? 
                <span className="text-sm text-gray-600">⏸️</span> : 
                <span className="text-sm text-gray-600">▶️</span>
              }
            </button>
            <button
              onClick={handleClearQueue}
              className="p-1 hover:bg-gray-100 rounded"
              title="Clear Queue"
            >
              <span className="text-sm text-gray-600">🗑️</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {isExpanded ? 'Less' : 'More'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{progress.completedRequests} of {progress.totalRequests} completed</span>
            <span>{formatPercentage(progressPercentage / 100)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Time Remaining:</span>
            <span className="ml-1 font-medium">
              {formatTime(progress.estimatedTimeRemaining)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Success Rate:</span>
            <span className="ml-1 font-medium">
              {formatPercentage(progress.successRate)}
            </span>
          </div>
        </div>
      </div>

      {/* Rate Limiting Status */}
      <div className="px-4 py-2 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-gray-500">
              Rate Limit: {progress.rateLimitStatus.requestsThisMinute}/5 per minute
            </span>
            {progress.rateLimitStatus.dailyLimitReached && (
              <div className="flex items-center space-x-1 text-red-600">
                <span className="text-xs">⚠️</span>
                <span>Daily limit reached</span>
              </div>
            )}
          </div>
          {progress.rateLimitStatus.nextAvailableSlot > Date.now() && (
            <span className="text-gray-500">
              Next slot: {formatTime(progress.rateLimitStatus.nextAvailableSlot - Date.now())}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t space-y-3">
          {/* Current Request Details */}
          {progress.currentRequest && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Current Request</h4>
              <div className="text-xs text-gray-600">
                <div>Symbol: {progress.currentRequest.symbol}</div>
                <div>Timeframe: {progress.currentRequest.timeframe}</div>
                <div>Priority: {progress.currentRequest.priority}</div>
                {progress.currentRequest.retryCount > 0 && (
                  <div>Retry: {progress.currentRequest.retryCount}/{progress.currentRequest.maxRetries}</div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Statistics */}
          {metrics && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                <div>
                  <span className="text-gray-500">Total Processed:</span>
                  <span className="ml-1">{metrics.totalProcessed}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg Processing:</span>
                  <span className="ml-1">{formatTime(metrics.averageProcessingTime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Error Rate:</span>
                  <span className="ml-1">{formatPercentage(metrics.errorRate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Throughput:</span>
                  <span className="ml-1">{metrics.throughputPerMinute}/min</span>
                </div>
              </div>
            </div>
          )}

          {/* Failed Requests */}
          {progress.failedRequests > 0 && (
            <div>
              <h4 className="text-xs font-medium text-red-700 mb-1">Issues</h4>
              <div className="text-xs text-red-600">
                {progress.failedRequests} requests failed
                {progress.failedRequests > 0 && (
                  <span className="ml-2 text-gray-500">
                    (automatic retry in progress)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueueProgressTracker; 

