/**
 * STUDENT ANALYST - Tablet Layout Component
 * Optimized layout for tablet devices with 2-column design and hybrid interactions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TabletLayout.css';

interface TabletLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  secondaryContent?: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  className?: string;
}

interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
  angle: number;
  width: number;
  height: number;
}

interface TouchState {
  isTouch: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  activePointers: number;
}

const TabletLayout: React.FC<TabletLayoutProps> = ({
  children,
  sidebarContent,
  headerContent,
  secondaryContent,
  currentStep,
  totalSteps,
  onStepChange,
  className = ''
}) => {
  // State Management
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [orientation, setOrientation] = useState<OrientationState>({
    isPortrait: true,
    isLandscape: false,
    angle: 0,
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [touchState, setTouchState] = useState<TouchState>({
    isTouch: false,
    hasMouse: true,
    hasKeyboard: false,
    activePointers: 0
  });
  const [use2ColumnLayout, setUse2ColumnLayout] = useState(false);

  // Refs
  const layoutRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Constants
  const TABLET_MIN_WIDTH = 768;
  const TABLET_MAX_WIDTH = 1024;
  const TWO_COLUMN_MIN_WIDTH = 900;
  const SIDEBAR_WIDTH = 320;

  // Detect tablet device and capabilities
  const detectDeviceCapabilities = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Detect tablet
    const isTabletDevice = width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH;
    setIsTablet(isTabletDevice);
    
    // Detect orientation
    const isPortraitMode = height > width;
    const isLandscapeMode = width > height;
    
    setOrientation({
      isPortrait: isPortraitMode,
      isLandscape: isLandscapeMode,
      angle: screen.orientation?.angle || 0,
      width,
      height
    });
    
    // Determine 2-column layout
    const shouldUse2Column = isTabletDevice && width >= TWO_COLUMN_MIN_WIDTH && isLandscapeMode;
    setUse2ColumnLayout(shouldUse2Column);
    
    // Auto-manage sidebar based on layout
    if (shouldUse2Column) {
      setIsSidebarOpen(true);
    } else if (isPortraitMode) {
      setIsSidebarOpen(false);
    }
    
    // Detect input capabilities
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasPointer = window.PointerEvent !== undefined;
    const hasKeyboardSupport = !(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    setTouchState(prev => ({
      ...prev,
      isTouch: hasTouch,
      hasMouse: hasPointer || !hasTouch,
      hasKeyboard: hasKeyboardSupport
    }));
  }, []);

  // Handle orientation change
  const handleOrientationChange = useCallback(() => {
    // Add small delay to ensure dimensions are updated
    setTimeout(() => {
      detectDeviceCapabilities();
    }, 100);
  }, [detectDeviceCapabilities]);

  // Handle window resize
  const handleResize = useCallback(() => {
    detectDeviceCapabilities();
  }, [detectDeviceCapabilities]);

  // Handle touch start/end for pointer tracking
  const handlePointerChange = useCallback((delta: number) => {
    setTouchState(prev => ({
      ...prev,
      activePointers: Math.max(0, prev.activePointers + delta)
    }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    detectDeviceCapabilities();
    
    // Orientation change listeners
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    // Touch/pointer listeners
    const handleTouchStart = () => handlePointerChange(1);
    const handleTouchEnd = () => handlePointerChange(-1);
    const handleMouseEnter = () => setTouchState(prev => ({ ...prev, hasMouse: true }));
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // Keyboard detection
    const handleKeyDown = () => setTouchState(prev => ({ ...prev, hasKeyboard: true }));
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [detectDeviceCapabilities, handleOrientationChange, handleResize, handlePointerChange]);

  // Setup ResizeObserver for dynamic content sizing
  useEffect(() => {
    if (layoutRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          
          // Update orientation based on content size
          setOrientation(prev => ({
            ...prev,
            width,
            height,
            isPortrait: height > width,
            isLandscape: width > height
          }));
        }
      });
      
      resizeObserverRef.current.observe(layoutRef.current);
    }
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Handle step navigation
  const navigateStep = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentStep > 1) {
      onStepChange(currentStep - 1);
    } else if (direction === 'next' && currentStep < totalSteps) {
      onStepChange(currentStep + 1);
    }
  }, [currentStep, totalSteps, onStepChange]);

  // Progress percentage
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  // CSS classes
  const layoutClasses = [
    'tablet-layout',
    className,
    isTablet ? 'is-tablet' : '',
    orientation.isPortrait ? 'portrait' : 'landscape',
    use2ColumnLayout ? 'two-column' : 'single-column',
    touchState.isTouch ? 'touch-enabled' : '',
    touchState.hasMouse ? 'mouse-enabled' : '',
    touchState.hasKeyboard ? 'keyboard-enabled' : '',
    isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={layoutRef}
      className={layoutClasses}
      data-orientation={orientation.isPortrait ? 'portrait' : 'landscape'}
      data-active-pointers={touchState.activePointers}
    >
      {/* Tablet Header */}
      <header className="tablet-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="sidebar-toggle-btn touch-optimized"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <span className={`hamburger-icon ${isSidebarOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            
            <div className="app-title">
              <h1>📊 Student Analyst</h1>
              <span className="device-indicator">
                {isTablet ? '📱 Tablet' : '💻 Desktop'} • 
                {orientation.isPortrait ? 'Portrait' : 'Landscape'}
              </span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="step-navigation">
              <button
                className="nav-btn prev-btn touch-optimized"
                onClick={() => navigateStep('prev')}
                disabled={currentStep <= 1}
              >
                ← Prev
              </button>
              
              <div className="step-indicator">
                <span className="current-step">{currentStep}</span>
                <span className="step-separator">/</span>
                <span className="total-steps">{totalSteps}</span>
              </div>
              
              <button
                className="nav-btn next-btn touch-optimized"
                onClick={() => navigateStep('next')}
                disabled={currentStep >= totalSteps}
              >
                Next →
              </button>
            </div>
          </div>
          
          <div className="header-right">
            {headerContent}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="tablet-content">
        {/* Sidebar */}
        <aside className={`tablet-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-content">
            {sidebarContent}
          </div>
        </aside>

        {/* Primary Content */}
        <main className="primary-content">
          <div className="content-wrapper">
            {children}
          </div>
        </main>

        {/* Secondary Content (2-column layout) */}
        {use2ColumnLayout && secondaryContent && (
          <aside className="secondary-content">
            <div className="secondary-wrapper">
              {secondaryContent}
            </div>
          </aside>
        )}
      </div>

      {/* Step Dots Navigation (Portrait mode) */}
      {orientation.isPortrait && (
        <div className="step-dots-container">
          <div className="step-dots">
            {Array.from({ length: totalSteps }, (_, index) => (
              <button
                key={index}
                className={`step-dot touch-optimized ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
                onClick={() => onStepChange(index + 1)}
                aria-label={`Go to step ${index + 1}`}
              >
                {index + 1 < currentStep ? '✓' : index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orientation Change Notice */}
      <div className="orientation-notice">
        <div className="notice-content">
          <span className="notice-icon">🔄</span>
          <span className="notice-text">
            {orientation.isPortrait 
              ? 'Rotate to landscape for enhanced view' 
              : 'Landscape mode active - optimal layout enabled'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default TabletLayout; 

