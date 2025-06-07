/**
 * Header Demo Component
 * 
 * Demonstrates the Header component functionality with different states
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import Header from './Header';

export const HeaderDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [userState, setUserState] = useState<'guest' | 'authenticated'>('guest');
  const [showSettings, setShowSettings] = useState(false);

  const mockUser = {
    name: 'John Analyst',
    email: 'john.analyst@example.com',
    role: 'Senior Financial Analyst',
    avatar: undefined // Will show initials
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    console.log(`Navigating to: ${view}`);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
    console.log('Settings clicked');
  };

  const handleUserMenuClick = () => {
    console.log('User menu clicked');
  };

  const toggleUserState = () => {
    setUserState(userState === 'guest' ? 'authenticated' : 'guest');
  };

  const viewOptions = [
    { value: 'home', label: 'Home' },
    { value: 'pyscript', label: 'PyScript Calculator' },
    { value: 'portfolio-optimization-tester', label: 'Portfolio Optimization' },
    { value: 'risk-metrics-tester', label: 'Risk Metrics' },
    { value: 'momentum-strategy-tester', label: 'Momentum Strategy' },
    { value: 'equal-weight-strategy-tester', label: 'Equal Weight Strategy' },
    { value: 'risk-parity-strategy-tester', label: 'Risk Parity Strategy' },
    { value: 'returns-calculation-tester', label: 'Returns Calculation' },
    { value: 'performance-ratios-tester', label: 'Performance Ratios' },
    { value: 'unified-quality-dashboard', label: 'Quality Dashboard' },
    { value: 'cache-monitor-dashboard', label: 'Cache Monitor' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Component */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onSettingsClick={handleSettingsClick}
        onUserMenuClick={handleUserMenuClick}
        user={userState === 'authenticated' ? mockUser : null}
      />

      {/* Demo Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              🎯 Header Component Demo
            </h1>
            
            <div className="space-y-8">
              {/* Current State Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  Current State
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Current View:</span>
                    <span className="ml-2 text-blue-600">{currentView}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">User State:</span>
                    <span className="ml-2 text-blue-600 capitalize">{userState}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Settings Panel:</span>
                    <span className="ml-2 text-blue-600">{showSettings ? 'Open' : 'Closed'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">User Name:</span>
                    <span className="ml-2 text-blue-600">
                      {userState === 'authenticated' ? mockUser.name : 'Guest User'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Navigation Controls */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🧭 Navigation Controls
                  </h3>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Current View:
                    </label>
                    <select
                      id="current-view-select"
                      value={currentView}
                      onChange={(e) => setCurrentView(e.target.value)}
                      aria-label="Current View Selection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {viewOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      Changes the current view to test breadcrumb navigation
                    </p>
                  </div>
                </div>

                {/* User State Controls */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    👤 User State Controls
                  </h3>
                  <div className="space-y-4">
                    <Button
                      onClick={toggleUserState}
                      className="w-full"
                      variant={userState === 'authenticated' ? 'outline' : 'default'}
                    >
                      {userState === 'guest' ? '🔐 Sign In' : '🚪 Sign Out'}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Toggle between guest and authenticated user states
                    </p>
                    {userState === 'authenticated' && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-800">
                          <strong>Authenticated as:</strong><br/>
                          {mockUser.name} ({mockUser.role})<br/>
                          {mockUser.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Feature Showcase */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ✨ Header Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">🏢 Professional Branding</h4>
                    <p className="text-sm text-gray-600">
                      Logo, company name, and tagline for professional appearance
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">🧭 Smart Breadcrumbs</h4>
                    <p className="text-sm text-gray-600">
                      Contextual navigation showing current location and path
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">👤 User Management</h4>
                    <p className="text-sm text-gray-600">
                      Guest and authenticated user states with profile menu
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">🔔 Notifications</h4>
                    <p className="text-sm text-gray-600">
                      Real-time notifications with badge counter
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">⚙️ Settings Access</h4>
                    <p className="text-sm text-gray-600">
                      Quick access to application settings and preferences
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">📱 Responsive Design</h4>
                    <p className="text-sm text-gray-600">
                      Adapts to different screen sizes with mobile menu
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Panel Demo */}
              {showSettings && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                    ⚙️ Settings Panel (Demo)
                  </h3>
                  <p className="text-yellow-800 mb-4">
                    This is where application settings would be displayed when the settings button is clicked.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded p-3">
                      <h4 className="font-medium mb-2">Theme Settings</h4>
                      <p className="text-sm text-gray-600">Light/Dark mode toggle</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <h4 className="font-medium mb-2">API Configuration</h4>
                      <p className="text-sm text-gray-600">Alpha Vantage API key setup</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <h4 className="font-medium mb-2">Data Preferences</h4>
                      <p className="text-sm text-gray-600">Default calculation settings</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <h4 className="font-medium mb-2">Notification Settings</h4>
                      <p className="text-sm text-gray-600">Alert preferences</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="outline"
                    className="mt-4"
                  >
                    Close Settings
                  </Button>
                </div>
              )}

              {/* Technical Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🔧 Technical Implementation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Component Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• TypeScript with full type safety</li>
                      <li>• Responsive Tailwind CSS styling</li>
                      <li>• Accessible ARIA labels and keyboard navigation</li>
                      <li>• Modular icon system</li>
                      <li>• State management for dropdowns</li>
                      <li>• Click-outside handling</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Integration Points:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Navigation callback system</li>
                      <li>• User authentication state</li>
                      <li>• Settings panel integration</li>
                      <li>• Notification system hooks</li>
                      <li>• Breadcrumb path mapping</li>
                      <li>• Mobile-first responsive design</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  📖 How to Use
                </h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <p>
                    <strong>1. Navigation:</strong> Click on breadcrumb items to navigate between sections
                  </p>
                  <p>
                    <strong>2. User Menu:</strong> Click on the user avatar/name to access profile options
                  </p>
                  <p>
                    <strong>3. Notifications:</strong> Click the bell icon to view recent notifications
                  </p>
                  <p>
                    <strong>4. Settings:</strong> Click the gear icon to access application settings
                  </p>
                  <p>
                    <strong>5. Search:</strong> Use the search bar or press ⌘K for quick search
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderDemo;

