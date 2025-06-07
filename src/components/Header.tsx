/**
 * Header Component
 * 
 * Professional header for STUDENT ANALYST application featuring:
 * - Logo and branding
 * - Navigation breadcrumbs
 * - User info display (when authenticated)
 * - Settings access button
 * - Responsive design
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  LogoIcon, 
  SettingsIcon, 
  UserIcon, 
  HomeIcon, 
  ChevronRightIcon,
  BellIcon,
  MenuIcon,
  SearchIcon
} from './ui/icons';

interface HeaderProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
  onSettingsClick?: () => void;
  onUserMenuClick?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  } | null;
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  currentView = 'home',
  onNavigate,
  onSettingsClick,
  onUserMenuClick,
  user = null,
  className = ""
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Navigation mapping for breadcrumbs
  const getNavigationPath = (view: string): BreadcrumbItem[] => {
    const baseRoutes: Record<string, BreadcrumbItem[]> = {
      'home': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> }
      ],
      'pyscript': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'PyScript Calculator', path: 'pyscript' }
      ],
      'portfolio-optimization-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Analysis Tools', path: 'analysis' },
        { label: 'Portfolio Optimization', path: 'portfolio-optimization-tester' }
      ],
      'risk-metrics-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Analysis Tools', path: 'analysis' },
        { label: 'Risk Metrics', path: 'risk-metrics-tester' }
      ],
      'buy-hold-benchmark-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Strategies', path: 'strategies' },
        { label: 'Buy & Hold Benchmark', path: 'buy-hold-benchmark-tester' }
      ],
      'equal-weight-strategy-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Strategies', path: 'strategies' },
        { label: 'Equal Weight Strategy', path: 'equal-weight-strategy-tester' }
      ],
      'risk-parity-strategy-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Strategies', path: 'strategies' },
        { label: 'Risk Parity Strategy', path: 'risk-parity-strategy-tester' }
      ],
      'momentum-strategy-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Strategies', path: 'strategies' },
        { label: 'Momentum Strategy', path: 'momentum-strategy-tester' }
      ],
      'returns-calculation-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Analysis Tools', path: 'analysis' },
        { label: 'Returns Calculation', path: 'returns-calculation-tester' }
      ],
      'performance-ratios-tester': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Analysis Tools', path: 'analysis' },
        { label: 'Performance Ratios', path: 'performance-ratios-tester' }
      ],
      'unified-quality-dashboard': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'Data Quality', path: 'data-quality' },
        { label: 'Quality Dashboard', path: 'unified-quality-dashboard' }
      ],
      'cache-monitor-dashboard': [
        { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
        { label: 'System Monitor', path: 'system' },
        { label: 'Cache Monitor', path: 'cache-monitor-dashboard' }
      ]
    };

    return baseRoutes[view] || [
      { label: 'Home', path: 'home', icon: <HomeIcon size={16} /> },
      { label: formatViewName(view), path: view }
    ];
  };

  // Format view name for display
  const formatViewName = (view: string): string => {
    return view
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = getNavigationPath(currentView);

  const handleBreadcrumbClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (onUserMenuClick) {
      onUserMenuClick();
    }
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  return (
    <header className={`bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section: Logo and Branding */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <LogoIcon size={32} className="mr-3" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">
                  STUDENT ANALYST
                </h1>
                <p className="text-xs text-gray-500 -mt-1">
                  Professional Financial Analysis
                </p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button 
              aria-label="Open mobile menu"
              title="Open mobile menu"
              className="ml-4 sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <MenuIcon size={20} />
            </button>
          </div>

          {/* Center Section: Navigation Breadcrumbs */}
          <div className="hidden md:flex flex-1 items-center justify-center max-w-2xl mx-8">
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && (
                    <ChevronRightIcon 
                      size={14} 
                      className="text-gray-400 flex-shrink-0" 
                    />
                  )}
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.path)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                      index === breadcrumbs.length - 1
                        ? 'text-blue-600 bg-blue-50 font-medium cursor-default'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    disabled={index === breadcrumbs.length - 1}
                  >
                    {crumb.icon && (
                      <span className="flex-shrink-0">{crumb.icon}</span>
                    )}
                    <span className="whitespace-nowrap">{crumb.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right Section: Actions and User Info */}
          <div className="flex items-center space-x-2">
            
            {/* Search Button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex items-center space-x-2 text-gray-500 border-gray-300"
            >
              <SearchIcon size={16} />
              <span className="text-sm">Search...</span>
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 rounded border">
                ⌘K
              </kbd>
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNotificationsToggle}
                className="p-2 border-gray-300"
                title="Notifications"
              >
                <BellIcon size={18} />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">3</span>
                </span>
              </Button>
              
              {/* Notifications dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">Portfolio calculation completed</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">New data available for AAPL</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">Risk analysis warning</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSettingsClick}
              className="p-2 border-gray-300"
              title="Settings"
            >
              <SettingsIcon size={18} />
            </Button>

            {/* User Menu */}
            <div className="relative">
              {user ? (
                // Authenticated User Display
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role || 'Analyst'}</p>
                  </div>
                </button>
              ) : (
                // Guest User Display
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 border-gray-300"
                >
                  <UserIcon size={16} />
                  <span className="hidden sm:inline text-sm">Guest User</span>
                </Button>
              )}

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Profile Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Account Preferences
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Help & Support
                      </button>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Welcome!</p>
                        <p className="text-sm text-gray-500">Sign in to save your work</p>
                      </div>
                      <button className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50">
                        Sign In
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Create Account
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Help & Support
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Breadcrumbs */}
        <div className="md:hidden border-t border-gray-100 py-2">
          <nav className="flex items-center space-x-2 text-sm overflow-x-auto">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && (
                  <ChevronRightIcon 
                    size={12} 
                    className="text-gray-400 flex-shrink-0" 
                  />
                )}
                <button
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs whitespace-nowrap ${
                    index === breadcrumbs.length - 1
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  disabled={index === breadcrumbs.length - 1}
                >
                  {crumb.icon && (
                    <span className="flex-shrink-0">{crumb.icon}</span>
                  )}
                  <span>{crumb.label}</span>
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      {/* Click outside handler */}
      {(isUserMenuOpen || isNotificationsOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsNotificationsOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;

