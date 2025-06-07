/**
 * STUDENT ANALYST - Tablet Chart Interactions
 * Advanced chart interactions optimized for tablet devices
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import './TabletChartInteractions.css';

interface TabletChartInteractionsProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onExport?: () => void;
  onReset?: () => void;
  onZoom?: (scale: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  allowZoom?: boolean;
  allowPan?: boolean;
  maxZoom?: number;
  minZoom?: number;
  className?: string;
}

interface InteractionState {
  isTouch: boolean;
  hasMouse: boolean;
  isZooming: boolean;
  isPanning: boolean;
  scale: number;
  translateX: number;
  translateY: number;
  lastTouchDistance: number;
  lastTouchCenter: { x: number; y: number };
  pointerCount: number;
}

const TabletChartInteractions: React.FC<TabletChartInteractionsProps> = ({
  children,
  title,
  subtitle,
  onExport,
  onReset,
  onZoom,
  onPan,
  allowZoom = true,
  allowPan = true,
  maxZoom = 3,
  minZoom = 0.5,
  className = ''
}) => {
  // State Management
  const [interactionState, setInteractionState] = useState<InteractionState>({
    isTouch: false,
    hasMouse: true,
    isZooming: false,
    isPanning: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
    lastTouchDistance: 0,
    lastTouchCenter: { x: 0, y: 0 },
    pointerCount: 0
  });

  const [showControls, setShowControls] = useState(false);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  // Refs
  const chartRef = useRef<HTMLDivElement>(null);

  // Detect device capabilities
  useEffect(() => {
    const checkCapabilities = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasMouse = window.PointerEvent !== undefined || !hasTouch;
      const landscape = window.innerWidth > window.innerHeight;
      
      setInteractionState(prev => ({
        ...prev,
        isTouch: hasTouch,
        hasMouse: hasMouse
      }));
      
      setIsLandscape(landscape);
    };

    checkCapabilities();
    window.addEventListener('resize', checkCapabilities);
    window.addEventListener('orientationchange', checkCapabilities);

    return () => {
      window.removeEventListener('resize', checkCapabilities);
      window.removeEventListener('orientationchange', checkCapabilities);
    };
  }, []);

  // Calculate distance between two touches
  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;
    const touchCount = touches.length;
    
    setInteractionState(prev => ({ ...prev, pointerCount: touchCount }));
    
    if (touchCount === 2 && allowZoom) {
      const distance = getTouchDistance(touches);
      setInteractionState(prev => ({
        ...prev,
        isZooming: true,
        lastTouchDistance: distance
      }));
    } else if (touchCount === 1 && allowPan) {
      setInteractionState(prev => ({
        ...prev,
        isPanning: true
      }));
    }
  }, [allowZoom, allowPan, getTouchDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 2 && interactionState.isZooming && allowZoom) {
      const distance = getTouchDistance(touches);
      if (interactionState.lastTouchDistance > 0) {
        const scale = Math.min(
          maxZoom,
          Math.max(minZoom, interactionState.scale * (distance / interactionState.lastTouchDistance))
        );
        
        setInteractionState(prev => ({
          ...prev,
          scale,
          lastTouchDistance: distance
        }));
        
        onZoom?.(scale);
      }
    }
  }, [interactionState.isZooming, interactionState.scale, interactionState.lastTouchDistance, allowZoom, maxZoom, minZoom, onZoom, getTouchDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      isZooming: false,
      isPanning: false,
      pointerCount: 0
    }));
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!allowZoom || !interactionState.hasMouse) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(maxZoom, Math.max(minZoom, interactionState.scale * delta));
    
    setInteractionState(prev => ({ ...prev, scale: newScale }));
    onZoom?.(newScale);
  }, [allowZoom, interactionState.hasMouse, interactionState.scale, maxZoom, minZoom, onZoom]);

  // Reset transformations
  const handleReset = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      scale: 1,
      translateX: 0,
      translateY: 0
    }));
    
    onReset?.();
    onZoom?.(1);
    onPan?.(0, 0);
  }, [onReset, onZoom, onPan]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(maxZoom, interactionState.scale * 1.2);
    setInteractionState(prev => ({ ...prev, scale: newScale }));
    onZoom?.(newScale);
  }, [interactionState.scale, maxZoom, onZoom]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(minZoom, interactionState.scale * 0.8);
    setInteractionState(prev => ({ ...prev, scale: newScale }));
    onZoom?.(newScale);
  }, [interactionState.scale, minZoom, onZoom]);

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  return (
    <div className={`tablet-chart-interactions ${className} ${isLandscape ? 'landscape' : 'portrait'}`}>
      {/* Chart Header */}
      <div className="chart-header">
        <div className="header-info">
          <h3 className="chart-title">{title}</h3>
          {subtitle && <span className="chart-subtitle">{subtitle}</span>}
        </div>
        
        <div className="header-controls">
          <button
            className="control-btn secondary touch-friendly"
            onClick={toggleControls}
            aria-label="Toggle chart controls"
          >
            ⚙️
          </button>
          
          {onExport && (
            <button
              className="control-btn primary touch-friendly"
              onClick={onExport}
              aria-label="Export chart"
            >
              📥
            </button>
          )}
        </div>
      </div>

      {/* Chart Controls Panel */}
      {showControls && (
        <div className="controls-panel">
          <div className="control-group">
            <span className="control-label">Zoom</span>
            <div className="zoom-controls">
              <button
                className="zoom-btn touch-friendly"
                onClick={handleZoomOut}
                disabled={interactionState.scale <= minZoom}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="zoom-level">{Math.round(interactionState.scale * 100)}%</span>
              <button
                className="zoom-btn touch-friendly"
                onClick={handleZoomIn}
                disabled={interactionState.scale >= maxZoom}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="control-group">
            <button
              className="reset-btn touch-friendly"
              onClick={handleReset}
              aria-label="Reset view"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}

      {/* Interactive Chart Container */}
      <div
        className="chart-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          ref={chartRef}
          className="chart-content"
          style={{
            transform: `translate(${interactionState.translateX}px, ${interactionState.translateY}px) scale(${interactionState.scale})`,
            transformOrigin: 'center center'
          }}
        >
          {children}
        </div>
      </div>

      {/* Interaction Instructions */}
      <div className="interaction-instructions">
        <div className="instruction-row">
          {interactionState.isTouch && (
            <span className="instruction-item">
              👆 Single tap: Pan • 🤏 Pinch: Zoom
            </span>
          )}
          {interactionState.hasMouse && (
            <span className="instruction-item">
              🖱️ Scroll: Zoom • ⚙️ Controls: More options
            </span>
          )}
        </div>
      </div>

      {/* Gesture Feedback */}
      {(interactionState.isZooming || interactionState.isPanning) && (
        <div className="gesture-feedback">
          <div className="feedback-content">
            {interactionState.isZooming && (
              <span className="feedback-text">🔍 Zooming: {Math.round(interactionState.scale * 100)}%</span>
            )}
            {interactionState.isPanning && !interactionState.isZooming && (
              <span className="feedback-text">👋 Panning</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabletChartInteractions; 

