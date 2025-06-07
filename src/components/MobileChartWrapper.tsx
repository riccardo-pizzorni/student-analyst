/**
 * STUDENT ANALYST - Mobile Chart Wrapper
 * Optimized chart interactions for mobile devices with minimal UI
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import './MobileChartWrapper.css';

interface MobileChartWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onExport?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

interface TouchState {
  isActive: boolean;
  startX: number;
  startY: number;
  scale: number;
  translateX: number;
  translateY: number;
}

const MobileChartWrapper: React.FC<MobileChartWrapperProps> = ({
  children,
  title,
  subtitle,
  actions,
  onExport,
  onReset,
  isLoading = false,
  error,
  className = ''
}) => {
  // State Management
  const [isMinimized, setIsMinimized] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    isActive: false,
    startX: 0,
    startY: 0,
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  // Refs
  const chartRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle chart minimization
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Toggle actions menu
  const toggleActions = useCallback(() => {
    setShowActions(prev => !prev);
  }, []);

  // Handle export with feedback
  const handleExport = useCallback(async () => {
    if (!onExport) return;
    
    try {
      await onExport();
      // Show success feedback
      const feedback = document.createElement('div');
      feedback.className = 'export-feedback success';
      feedback.textContent = '✓ Chart exported!';
      document.body.appendChild(feedback);
      
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 2000);
    } catch (error) {
      // Show error feedback
      const feedback = document.createElement('div');
      feedback.className = 'export-feedback error';
      feedback.textContent = '✗ Export failed';
      document.body.appendChild(feedback);
      
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 2000);
    }
    
    setShowActions(false);
  }, [onExport]);

  // Handle reset with confirmation on mobile
  const handleReset = useCallback(() => {
    if (!onReset) return;
    
    if (isMobile) {
      const confirmed = window.confirm('Reset chart to default view?');
      if (!confirmed) return;
    }
    
    onReset();
    setTouchState({
      isActive: false,
      startX: 0,
      startY: 0,
      scale: 1,
      translateX: 0,
      translateY: 0
    });
    setShowActions(false);
  }, [onReset, isMobile]);

  // Touch event handlers for basic pan/zoom (if needed)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      isActive: true,
      startX: touch.clientX - prev.translateX,
      startY: touch.clientY - prev.translateY
    }));
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchState.isActive || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    setTouchState(prev => ({
      ...prev,
      translateX: touch.clientX - prev.startX,
      translateY: touch.clientY - prev.startY
    }));
  }, [isMobile, touchState.isActive]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    
    setTouchState(prev => ({
      ...prev,
      isActive: false
    }));
  }, [isMobile]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  return (
    <div 
      ref={wrapperRef}
      className={`mobile-chart-wrapper ${className} ${isMinimized ? 'minimized' : ''} ${isMobile ? 'is-mobile' : ''}`}
    >
      {/* Chart Header */}
      <div className="chart-header">
        <div className="chart-title-section">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
        
        <div className="chart-controls">
          {/* Actions Menu Button */}
          {(actions || onExport || onReset) && (
            <button
              className="chart-action-btn touch-friendly"
              onClick={toggleActions}
              aria-label="Chart options"
            >
              <span className="action-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          )}
          
          {/* Minimize Button */}
          <button
            className="minimize-btn touch-friendly"
            onClick={toggleMinimized}
            aria-label={isMinimized ? 'Expand chart' : 'Minimize chart'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="chart-actions-menu">
          <div className="actions-content">
            {onExport && (
              <button
                className="action-item touch-friendly"
                onClick={handleExport}
              >
                📥 Export Chart
              </button>
            )}
            
            {onReset && (
              <button
                className="action-item touch-friendly"
                onClick={handleReset}
              >
                🔄 Reset View
              </button>
            )}
            
            {actions}
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div 
        ref={chartRef}
        className="chart-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isMobile ? `translate(${touchState.translateX}px, ${touchState.translateY}px) scale(${touchState.scale})` : undefined
        }}
      >
        {isLoading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <span>Loading chart...</span>
          </div>
        ) : error ? (
          <div className="chart-error">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              <strong>Chart Error</strong>
              <span>{error}</span>
            </div>
            {onReset && (
              <button
                className="retry-btn touch-friendly"
                onClick={handleReset}
              >
                Try Again
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Mobile Chart Instructions */}
      {isMobile && !isMinimized && !isLoading && !error && (
        <div className="mobile-instructions">
          <span className="instruction-text">
            📱 Tap and hold for options • Swipe to navigate
          </span>
        </div>
      )}
    </div>
  );
};

export default MobileChartWrapper; 

