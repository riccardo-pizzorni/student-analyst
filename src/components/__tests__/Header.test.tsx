/**
 * Header Component Tests
 * 
 * Tests for the professional header component functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';

// Mock the icons module
jest.mock('../ui/icons', () => ({
  LogoIcon: ({ size, className }: any) => <div data-testid="logo-icon" className={className} style={{ width: size, height: size }} />,
  SettingsIcon: ({ size, className }: any) => <div data-testid="settings-icon" className={className} style={{ width: size, height: size }} />,
  UserIcon: ({ size, className }: any) => <div data-testid="user-icon" className={className} style={{ width: size, height: size }} />,
  HomeIcon: ({ size, className }: any) => <div data-testid="home-icon" className={className} style={{ width: size, height: size }} />,
  ChevronRightIcon: ({ size, className }: any) => <div data-testid="chevron-right-icon" className={className} style={{ width: size, height: size }} />,
  BellIcon: ({ size, className }: any) => <div data-testid="bell-icon" className={className} style={{ width: size, height: size }} />,
  MenuIcon: ({ size, className }: any) => <div data-testid="menu-icon" className={className} style={{ width: size, height: size }} />,
  SearchIcon: ({ size, className }: any) => <div data-testid="search-icon" className={className} style={{ width: size, height: size }} />
}));

describe('Header Component', () => {
  const defaultProps = {
    currentView: 'home',
    onNavigate: jest.fn(),
    onSettingsClick: jest.fn(),
    onUserMenuClick: jest.fn(),
    user: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders header with logo and branding', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByTestId('logo-icon')).toBeInTheDocument();
      expect(screen.getByText('STUDENT ANALYST')).toBeInTheDocument();
      expect(screen.getByText('Professional Financial Analysis')).toBeInTheDocument();
    });

    test('renders settings button', () => {
      render(<Header {...defaultProps} />);
      
      const settingsButton = screen.getByTitle('Settings');
      expect(settingsButton).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    test('renders notifications button with badge', () => {
      render(<Header {...defaultProps} />);
      
      const notificationsButton = screen.getByTitle('Notifications');
      expect(notificationsButton).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // notification badge
    });
  });

  describe('Navigation Breadcrumbs', () => {
    test('shows home breadcrumb for home view', () => {
      render(<Header {...defaultProps} currentView="home" />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    });

    test('shows complex breadcrumb path for nested views', () => {
      render(<Header {...defaultProps} currentView="momentum-strategy-tester" />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Strategies')).toBeInTheDocument();
      expect(screen.getByText('Momentum Strategy')).toBeInTheDocument();
    });

    test('calls onNavigate when breadcrumb is clicked', () => {
      const mockNavigate = jest.fn();
      render(<Header {...defaultProps} currentView="momentum-strategy-tester" onNavigate={mockNavigate} />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('home');
    });

    test('does not call onNavigate for current page breadcrumb', () => {
      const mockNavigate = jest.fn();
      render(<Header {...defaultProps} currentView="momentum-strategy-tester" onNavigate={mockNavigate} />);
      
      const currentPageButton = screen.getByText('Momentum Strategy');
      fireEvent.click(currentPageButton);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('User Authentication States', () => {
    test('shows guest user when no user is provided', () => {
      render(<Header {...defaultProps} user={null} />);
      
      expect(screen.getByText('Guest User')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    test('shows authenticated user information', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Senior Analyst'
      };
      
      render(<Header {...defaultProps} user={user} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Senior Analyst')).toBeInTheDocument();
    });

    test('shows user avatar when provided', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg'
      };
      
      render(<Header {...defaultProps} user={user} />);
      
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('shows user initials when no avatar is provided', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      render(<Header {...defaultProps} user={user} />);
      
      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of name
    });
  });

  describe('Interactive Elements', () => {
    test('calls onSettingsClick when settings button is clicked', () => {
      const mockSettingsClick = jest.fn();
      render(<Header {...defaultProps} onSettingsClick={mockSettingsClick} />);
      
      const settingsButton = screen.getByTitle('Settings');
      fireEvent.click(settingsButton);
      
      expect(mockSettingsClick).toHaveBeenCalledTimes(1);
    });

    test('toggles user menu when user button is clicked', () => {
      render(<Header {...defaultProps} />);
      
      const userButton = screen.getByText('Guest User');
      fireEvent.click(userButton);
      
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText('Sign in to save your work')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    test('shows authenticated user menu options', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      render(<Header {...defaultProps} user={user} />);
      
      const userButton = screen.getByText('John Doe');
      fireEvent.click(userButton);
      
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Account Preferences')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    test('toggles notifications dropdown', () => {
      render(<Header {...defaultProps} />);
      
      const notificationsButton = screen.getByTitle('Notifications');
      fireEvent.click(notificationsButton);
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Portfolio calculation completed')).toBeInTheDocument();
      expect(screen.getByText('View all notifications')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('shows mobile menu button on small screens', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    test('shows search button with keyboard shortcut', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('Search...')).toBeInTheDocument();
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and titles', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByTitle('Settings')).toBeInTheDocument();
      expect(screen.getByTitle('Notifications')).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      render(<Header {...defaultProps} />);
      
      const settingsButton = screen.getByTitle('Settings');
      settingsButton.focus();
      expect(settingsButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    test('handles unknown view names gracefully', () => {
      render(<Header {...defaultProps} currentView="unknown-view-name" />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Unknown View Name')).toBeInTheDocument();
    });

    test('handles missing callback functions gracefully', () => {
      render(<Header currentView="home" />);
      
      const settingsButton = screen.getByTitle('Settings');
      expect(() => fireEvent.click(settingsButton)).not.toThrow();
    });

    test('handles long user names properly', () => {
      const user = {
        name: 'Very Long User Name That Might Overflow',
        email: 'verylongusername@example.com'
      };
      
      render(<Header {...defaultProps} user={user} />);
      
      expect(screen.getByText('Very Long User Name That Might Overflow')).toBeInTheDocument();
    });
  });
});

// Integration tests
describe('Header Integration', () => {
  test('works with different view combinations', () => {
    const views = [
      'home',
      'pyscript',
      'portfolio-optimization-tester',
      'risk-metrics-tester',
      'momentum-strategy-tester'
    ];

    views.forEach(view => {
      const { unmount } = render(<Header {...defaultProps} currentView={view} />);
      expect(screen.getByTestId('logo-icon')).toBeInTheDocument();
      unmount();
    });
  });

  test('maintains state consistency across re-renders', () => {
    const { rerender } = render(<Header {...defaultProps} currentView="home" />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    rerender(<Header {...defaultProps} currentView="momentum-strategy-tester" />);
    
    expect(screen.getByText('Momentum Strategy')).toBeInTheDocument();
  });
});