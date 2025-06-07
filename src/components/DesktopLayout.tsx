/**
 * STUDENT ANALYST - Desktop Layout Component
 * Advanced desktop experience with full sidebar, keyboard shortcuts, and multiple panels
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './DesktopLayout.css';

interface DesktopLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  className?: string;
}

interface Panel {
  id: string;
  title: string;
  content: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  sidebarContent,
  headerContent,
  currentStep,
  totalSteps,
  onStepChange,
  className = ''
}) => {
  // State Management
  const [isDesktop, setIsDesktop] = useState(false);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [commandPalette, setCommandPalette] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Refs
  const layoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const DESKTOP_MIN_WIDTH = 1024;
  const SIDEBAR_MIN_WIDTH = 250;
  const SIDEBAR_MAX_WIDTH = 500;

  // Detect desktop environment
  useEffect(() => {
    const checkDesktop = () => {
      const width = window.innerWidth;
      const isDesktopDevice = width >= DESKTOP_MIN_WIDTH;
      setIsDesktop(isDesktopDevice);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  // Create new panel
  const createPanel = useCallback((title: string, content: React.ReactNode) => {
    const newPanel: Panel = {
      id: `panel-${Date.now()}`,
      title,
      content,
      position: { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 100 + 100 
      },
      size: { width: 600, height: 400 },
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex
    };

    setPanels(prev => [...prev, newPanel]);
    setActivePanel(newPanel.id);
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  // Close panel
  const closePanel = useCallback((panelId: string) => {
    setPanels(prev => prev.filter(panel => panel.id !== panelId));
    if (activePanel === panelId) {
      setActivePanel(null);
    }
  }, [activePanel]);

  // Minimize/Maximize panel
  const toggleMinimize = useCallback((panelId: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, isMinimized: !panel.isMinimized }
        : panel
    ));
  }, []);

  const toggleMaximize = useCallback((panelId: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, isMaximized: !panel.isMaximized }
        : panel
    ));
  }, []);

  // Bring panel to front
  const bringToFront = useCallback((panelId: string) => {
    setActivePanel(panelId);
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, zIndex: nextZIndex }
        : panel
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  // Toggle sidebar visibility
  const toggleSidebarVisibility = useCallback(() => {
    setSidebarWidth(prev => prev === 0 ? 320 : 0);
  }, []);

  // Handle sidebar resize
  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    setIsResizingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(SIDEBAR_MAX_WIDTH, startWidth + deltaX)
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  // Keyboard shortcuts configuration
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open Command Palette',
      action: () => setCommandPalette(true)
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show Keyboard Shortcuts',
      action: () => setShowShortcuts(true)
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'New Analysis Panel',
      action: () => createPanel('Analysis', React.createElement('div', { className: 'panel-placeholder' }, 'Analysis Panel'))
    },
    {
      key: 'h',
      ctrlKey: true,
      description: 'Toggle Sidebar',
      action: () => toggleSidebarVisibility()
    },
    {
      key: 'ArrowLeft',
      altKey: true,
      description: 'Previous Step',
      action: () => currentStep > 1 && onStepChange(currentStep - 1)
    },
    {
      key: 'ArrowRight',
      altKey: true,
      description: 'Next Step',
      action: () => currentStep < totalSteps && onStepChange(currentStep + 1)
    },
    {
      key: 'Escape',
      description: 'Close Dialogs/Panels',
      action: () => {
        setShowShortcuts(false);
        setCommandPalette(false);
        if (activePanel) {
          closePanel(activePanel);
        }
      }
    }
  ], [currentStep, totalSteps, onStepChange, activePanel, createPanel, toggleSidebarVisibility, closePanel]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : !e.ctrlKey;
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        
        if (
          e.key === shortcut.key &&
          ctrlMatch &&
          altMatch &&
          shiftMatch
        ) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  // Command palette actions
  const commandActions = useMemo(() => [
    { name: 'New Analysis Panel', action: () => createPanel('Analysis', React.createElement('div', {}, 'Analysis')) },
    { name: 'New Chart Panel', action: () => createPanel('Chart', React.createElement('div', {}, 'Chart')) },
    { name: 'New Data Panel', action: () => createPanel('Data', React.createElement('div', {}, 'Data')) },
    { name: 'Toggle Sidebar', action: toggleSidebarVisibility },
    { name: 'Show Shortcuts', action: () => setShowShortcuts(true) },
    { name: 'Close All Panels', action: () => setPanels([]) }
  ], [createPanel, toggleSidebarVisibility]);

  // Progress percentage
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  // CSS classes
  const layoutClasses = [
    'desktop-layout',
    className,
    isDesktop ? 'is-desktop' : '',
    sidebarWidth === 0 ? 'sidebar-hidden' : 'sidebar-visible'
  ].filter(Boolean).join(' ');

  if (!isDesktop) {
    return (
      <div className="desktop-layout-fallback">
        <div className="fallback-message">
          <h2>📖 Desktop Features</h2>
          <p>Desktop features require a screen width of at least 1024px.</p>
          <p>Current width: {window.innerWidth}px</p>
          <p>Please use a larger screen or resize your browser window.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={layoutRef} className={layoutClasses}>
      {/* Desktop Header */}
      <header className="desktop-header">
        <div className="header-content">
          <div className="header-left">
            <div className="app-title">
              <h1>🏢 Student Analyst Desktop</h1>
              <span className="version-indicator">Professional Edition</span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="step-navigation">
              <button
                className="nav-btn prev-btn"
                onClick={() => onStepChange(currentStep - 1)}
                disabled={currentStep <= 1}
                title="Previous Step (Alt+←)"
              >
                ← Previous
              </button>
              
              <div className="step-indicator">
                <span className="current-step">{currentStep}</span>
                <span className="step-separator">/</span>
                <span className="total-steps">{totalSteps}</span>
              </div>
              
              <button
                className="nav-btn next-btn"
                onClick={() => onStepChange(currentStep + 1)}
                disabled={currentStep >= totalSteps}
                title="Next Step (Alt+→)"
              >
                Next →
              </button>
            </div>
          </div>
          
          <div className="header-right">
            <button
              className="header-btn"
              onClick={() => setCommandPalette(true)}
              title="Command Palette (Ctrl+K)"
            >
              ⌘
            </button>
            <button
              className="header-btn"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard Shortcuts (Shift+?)"
            >
              ⌨️
            </button>
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

      {/* Desktop Content */}
      <div className="desktop-content">
        {/* Sidebar */}
        {sidebarWidth > 0 && (
          <aside 
            ref={sidebarRef}
            className="desktop-sidebar"
            style={{ width: sidebarWidth }}
          >
            <div className="sidebar-header">
              <h3>Navigation</h3>
              <button
                className="sidebar-toggle"
                onClick={toggleSidebarVisibility}
                title="Hide Sidebar (Ctrl+H)"
              >
                ×
              </button>
            </div>
            <div className="sidebar-content">
              {sidebarContent}
            </div>
            <div 
              className="sidebar-resizer"
              onMouseDown={handleSidebarResize}
            />
          </aside>
        )}

        {/* Main Content Area */}
        <main className="desktop-main" style={{ marginLeft: sidebarWidth }}>
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Panels */}
      {panels.map(panel => (
        <div
          key={panel.id}
          className={`floating-panel ${panel.isMinimized ? 'minimized' : ''} ${panel.isMaximized ? 'maximized' : ''}`}
          style={{
            left: panel.isMaximized ? 0 : panel.position.x,
            top: panel.isMaximized ? 70 : panel.position.y,
            width: panel.isMaximized ? '100%' : panel.size.width,
            height: panel.isMaximized ? 'calc(100vh - 70px)' : panel.size.height,
            zIndex: panel.zIndex
          }}
          onClick={() => bringToFront(panel.id)}
        >
          <div className="panel-header">
            <span className="panel-title">{panel.title}</span>
            <div className="panel-controls">
              <button onClick={() => toggleMinimize(panel.id)} title="Minimize">−</button>
              <button onClick={() => toggleMaximize(panel.id)} title="Maximize">□</button>
              <button onClick={() => closePanel(panel.id)} title="Close">×</button>
            </div>
          </div>
          {!panel.isMinimized && (
            <div className="panel-content">
              {panel.content}
            </div>
          )}
        </div>
      ))}

      {/* Command Palette */}
      {commandPalette && (
        <div className="command-palette-overlay" onClick={() => setCommandPalette(false)}>
          <div className="command-palette" onClick={e => e.stopPropagation()}>
            <div className="command-header">
              <input
                ref={commandInputRef}
                type="text"
                placeholder="Type a command..."
                className="command-input"
                autoFocus
              />
            </div>
            <div className="command-list">
              {commandActions.map((action, index) => (
                <button
                  key={index}
                  className="command-item"
                  onClick={() => {
                    action.action();
                    setCommandPalette(false);
                  }}
                >
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h3>Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)}>×</button>
            </div>
            <div className="shortcuts-content">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-keys">
                    {shortcut.ctrlKey && <kbd>Ctrl</kbd>}
                    {shortcut.altKey && <kbd>Alt</kbd>}
                    {shortcut.shiftKey && <kbd>Shift</kbd>}
                    <kbd>{shortcut.key}</kbd>
                  </div>
                  <div className="shortcut-description">{shortcut.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop-specific UI indicators */}
      {isResizingSidebar && (
        <div className="resize-indicator">
          Sidebar width: {sidebarWidth}px
        </div>
      )}
    </div>
  );
};

export default DesktopLayout; 

