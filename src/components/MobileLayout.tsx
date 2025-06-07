/**
 * STUDENT ANALYST - Mobile Layout Component
 * Professional mobile-first layout with collapsible sidebar and touch interactions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  onStepChange,
  sidebarContent,
  headerContent,
  className = ''
}) => {
  // State Management
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false
  });

  // Refs
  const layoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Constants
  const SWIPE_THRESHOLD = 50;
  const BREAKPOINT_MOBILE = 768;
  const BREAKPOINT_TABLET = 1024;

  // Detect device type
  const detectDeviceType = useCallback(() => {
    const width = window.innerWidth;
    setIsMobile(width < BREAKPOINT_MOBILE);
    setIsTablet(width >= BREAKPOINT_MOBILE && width < BREAKPOINT_TABLET);
    
    // Auto-close sidebar on mobile
    if (width < BREAKPOINT_MOBILE) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    detectDeviceType();
    
    const handleResize = () => {
      detectDeviceType();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [detectDeviceType]);

  // Touch event handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true
    });
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !swipeState.isDragging) return;
    
    const touch = e.touches[0];
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
  }, [isMobile, swipeState.isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !swipeState.isDragging) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = Math.abs(swipeState.currentY - swipeState.startY);
    
    // Only process horizontal swipes (vertical scroll should work normally)
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && deltaY < SWIPE_THRESHOLD * 2) {
      if (deltaX > 0 && currentStep > 1) {
        // Swipe right - previous step
        onStepChange(currentStep - 1);
      } else if (deltaX < 0 && currentStep < totalSteps) {
        // Swipe left - next step
        onStepChange(currentStep + 1);
      }
    }
    
    setSwipeState(prev => ({ ...prev, isDragging: false }));
  }, [isMobile, swipeState, currentStep, totalSteps, onStepChange]);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Close sidebar when clicking outside
  const handleOverlayClick = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Progress calculation
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div 
      ref={layoutRef}
      className={`mobile-layout ${className} ${isMobile ? 'is-mobile' : ''} ${isTablet ? 'is-tablet' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="header-content">
          <button
            className="sidebar-toggle-btn touch-friendly"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
          >
            <span className={`hamburger ${isSidebarOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className="header-title">
            <h1>📊 Student Analyst</h1>
            <span className="step-indicator">Step {currentStep} of {totalSteps}</span>
          </div>

          {headerContent && (
            <div className="header-actions">
              {headerContent}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isMobile && isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={handleOverlayClick}
        ></div>
      )}

      {/* Collapsible Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}
      >
        <div className="sidebar-content">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        ref={mainContentRef}
        className={`main-content ${isSidebarOpen && !isMobile ? 'sidebar-open' : ''}`}
      >
        <div className="content-wrapper">
          {children}
        </div>

        {/* Mobile Navigation Controls */}
        {isMobile && (
          <div className="mobile-nav-controls">
            <button
              className={`nav-btn prev-btn touch-friendly ${currentStep <= 1 ? 'disabled' : ''}`}
              onClick={() => onStepChange(currentStep - 1)}
              disabled={currentStep <= 1}
            >
              ← Previous
            </button>

            <div className="step-dots">
              {Array.from({ length: totalSteps }, (_, index) => (
                <button
                  key={index}
                  className={`step-dot touch-friendly ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
                  onClick={() => onStepChange(index + 1)}
                  aria-label={`Go to step ${index + 1}`}
                >
                  {index + 1 < currentStep ? '✓' : index + 1}
                </button>
              ))}
            </div>

            <button
              className={`nav-btn next-btn touch-friendly ${currentStep >= totalSteps ? 'disabled' : ''}`}
              onClick={() => onStepChange(currentStep + 1)}
              disabled={currentStep >= totalSteps}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Swipe Indicator */}
      {isMobile && swipeState.isDragging && (
        <div className="swipe-indicator">
          <div className="swipe-hint">
            {swipeState.currentX > swipeState.startX ? '← Previous Step' : 'Next Step →'}
          </div>
        </div>
      )}

      {/* Touch Feedback */}
      <div className="touch-feedback"></div>
    </div>
  );
};

export default MobileLayout; 

