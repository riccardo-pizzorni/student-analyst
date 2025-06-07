/**
 * Icons Component Library
 * 
 * Collection of SVG icons for STUDENT ANALYST application
 * All icons are optimized for professional financial interface
 */

import React from 'react';

export interface IconProps {
  size?: number | string;
  className?: string;
  color?: string;
}

// Logo Icon - Professional SA monogram
export const LogoIcon: React.FC<IconProps> = ({ 
  size = 32, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 40 40" 
    className={className}
    fill="none"
  >
    <rect width="40" height="40" rx="8" fill="url(#logoGradient)" />
    <text 
      x="20" 
      y="26" 
      textAnchor="middle" 
      fontSize="16" 
      fontWeight="bold" 
      fill="white"
      fontFamily="system-ui"
    >
      SA
    </text>
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
  </svg>
);

// Settings Icon
export const SettingsIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

// User Icon
export const UserIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// Home Icon
export const HomeIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9,22 9,12 15,12 15,22"></polyline>
  </svg>
);

// ChevronRight Icon (for breadcrumbs)
export const ChevronRightIcon: React.FC<IconProps> = ({ 
  size = 16, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
);

// Menu Icon
export const MenuIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

// Bell Icon (for notifications)
export const BellIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

// Search Icon
export const SearchIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="M21 21l-4.35-4.35"></path>
  </svg>
);

// Analytics Icon
export const AnalyticsIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
  </svg>
);

// Portfolio Icon
export const PortfolioIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

// TrendingUp Icon
export const TrendingUpIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"></polyline>
    <polyline points="17,6 23,6 23,12"></polyline>
  </svg>
);

// DollarSign Icon
export const DollarSignIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

// Help Icon
export const HelpIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

// Check Icon - per step completati
export const CheckIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

// Clock Icon - per step in progress
export const ClockIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

// Database Icon - per inserimento dati
export const DatabaseIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

// Shield Icon - per risk analysis
export const ShieldIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

// Target Icon - per optimization
export const TargetIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

// BarChart Icon - per performance analysis
export const BarChartIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

// FileText Icon - per report generation
export const FileTextIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

// Download Icon - per export
export const DownloadIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

// Save Icon - per auto-save indicator
export const SaveIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17,21 17,13 7,13 7,21"></polyline>
    <polyline points="7,3 7,8 15,8"></polyline>
  </svg>
);

// Info Icon
export const InfoIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

// ChartBar Icon
export const ChartBarIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

// AlertTriangle Icon
export const AlertTriangleIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

// HelpCircle Icon
export const HelpCircleIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

// PieChart Icon
export const PieChartIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
  </svg>
);

// Calculator Icon
export const CalculatorIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="2"></rect>
    <line x1="8" y1="6" x2="16" y2="6"></line>
    <line x1="16" y1="14" x2="16" y2="18"></line>
    <path d="M16 10h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M8 14h.01"></path>
    <path d="M8 18h.01"></path>
    <path d="M12 18h.01"></path>
  </svg>
);

// Star Icon
export const StarIcon: React.FC<IconProps> = ({ 
  size = 20, 
  className = "", 
  color = "currentColor" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={color}
    className={className}
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
  </svg>
);

export default {
  LogoIcon,
  SettingsIcon,
  UserIcon,
  HomeIcon,
  ChevronRightIcon,
  MenuIcon,
  BellIcon,
  SearchIcon,
  AnalyticsIcon,
  PortfolioIcon,
  TrendingUpIcon,
  DollarSignIcon,
  HelpIcon,
  CheckIcon,
  ClockIcon,
  DatabaseIcon,
  ShieldIcon,
  TargetIcon,
  BarChartIcon,
  FileTextIcon,
  DownloadIcon,
  SaveIcon
};