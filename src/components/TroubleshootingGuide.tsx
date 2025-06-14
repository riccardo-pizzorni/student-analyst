/**
 * STUDENT ANALYST - Troubleshooting Guide
 * Comprehensive guide for resolving common issues and optimizing performance
 */

import React, { useState } from 'react';
import './TroubleshootingGuide.css';

interface TroubleshootingItem {
  id: string;
  category: 'common' | 'performance' | 'browser' | 'api' | 'data' | 'connectivity';
  title: string;
  problem: string;
  symptoms: string[];
  solutions: string[];
  preventions?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: 'rare' | 'occasional' | 'common' | 'frequent';
}

const TroubleshootingGuide: React.FC = () => {
  // State for filtering and search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Troubleshooting database
  const troubleshootingItems: TroubleshootingItem[] = [
    // Common Problems
    {
      id: 'portfolio-not-loading',
      category: 'common',
      title: 'Portfolio Data Not Loading',
      problem: 'Portfolio analysis shows loading spinner indefinitely or displays error messages.',
      symptoms: [
        'Loading spinner never stops',
        'Error message "Failed to fetch data"',
        'Empty charts or tables',
        'Old data being displayed'
      ],
      solutions: [
        'Check your internet connection - open another website to verify',
        'Wait 2-3 minutes as free APIs have delays and rate limits',
        'Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)',
        'Clear browser cache and cookies for this site',
        'Reduce portfolio size to under 20 assets and try again',
        'Switch to a different browser to test compatibility'
      ],
      preventions: [
        'Keep portfolios under 50 assets for best performance',
        'Allow 10-15 minutes between major portfolio changes',
        'Use stable internet connection when possible'
      ],
      severity: 'high',
      frequency: 'common'
    },
    {
      id: 'slow-calculations',
      category: 'performance',
      title: 'Slow Calculation Performance',
      problem: 'Risk calculations, optimization, or analysis taking longer than 10 seconds.',
      symptoms: [
        'Calculations take over 30 seconds',
        'Browser becomes unresponsive',
        'Progress indicators stuck',
        'Memory usage warnings'
      ],
      solutions: [
        'Close other browser tabs to free up memory',
        'Restart your browser completely',
        'Split large portfolios into smaller groups (20-30 assets)',
        'Disable browser extensions temporarily',
        'Use latest version of Chrome or Firefox for best performance',
        'Ensure computer has at least 4GB available RAM'
      ],
      preventions: [
        'Close unnecessary programs before analysis',
        'Use portfolios with 20-50 assets for optimal speed',
        'Perform analysis during off-peak hours (early morning/late evening)'
      ],
      severity: 'medium',
      frequency: 'common'
    },
    {
      id: 'api-rate-limit-hit',
      category: 'api',
      title: 'API Rate Limit Exceeded',
      problem: 'Receiving "Rate limit exceeded" or "Too many requests" error messages.',
      symptoms: [
        'Error: "API rate limit exceeded"',
        'No new data loading',
        'Message about waiting before next request',
        'Partial data loading only'
      ],
      solutions: [
        'Wait 60 seconds before trying again (rate limits reset every minute)',
        'Reduce portfolio size to minimize API calls needed',
        'Use the "Batch Update" feature instead of individual stock updates',
        'Analyze one section at a time rather than the entire portfolio',
        'Come back in a few hours if daily limit is reached'
      ],
      preventions: [
        'Plan analysis sessions in advance',
        'Focus on most important assets first',
        'Use cached data when available'
      ],
      severity: 'medium',
      frequency: 'frequent'
    },
    {
      id: 'browser-compatibility',
      category: 'browser',
      title: 'Browser Compatibility Issues',
      problem: 'Features not working correctly or display problems in certain browsers.',
      symptoms: [
        'Charts not displaying correctly',
        'Buttons not responding',
        'Layout appearing broken',
        'JavaScript errors in console'
      ],
      solutions: [
        'Update browser to latest version',
        'Try Chrome (recommended) or Firefox as alternatives',
        'Disable ad blockers and privacy extensions temporarily',
        'Enable JavaScript if disabled',
        'Clear browser cache and cookies',
        'Reset browser settings to default if needed'
      ],
      preventions: [
        'Use recommended browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+',
        'Keep browser updated automatically',
        'Test with extensions disabled first'
      ],
      severity: 'high',
      frequency: 'occasional'
    },
    {
      id: 'memory-usage-high',
      category: 'performance',
      title: 'High Memory Usage',
      problem: 'Browser using excessive memory, computer slowing down during analysis.',
      symptoms: [
        'Computer fan running loudly',
        'Browser tab shows "Memory usage high" warning',
        'System becoming sluggish',
        'Other applications closing unexpectedly'
      ],
      solutions: [
        'Close unnecessary browser tabs and applications',
        'Restart browser every 2-3 hours during heavy use',
        'Use smaller portfolio sizes (under 30 assets)',
        'Avoid running multiple analyses simultaneously',
        'Close and reopen the application tab periodically'
      ],
      preventions: [
        'Monitor system memory usage',
        'Use portfolios efficiently',
        'Take breaks between analysis sessions'
      ],
      severity: 'medium',
      frequency: 'occasional'
    },
    {
      id: 'data-accuracy-concerns',
      category: 'data',
      title: 'Data Accuracy Concerns',
      problem: 'Stock prices or financial data appearing incorrect or outdated.',
      symptoms: [
        'Prices significantly different from other sources',
        'Data timestamp showing delay of hours',
        'Missing financial metrics',
        'Inconsistent data between refreshes'
      ],
      solutions: [
        'Remember that free data is delayed 15-20 minutes',
        'Compare with multiple sources to verify accuracy',
        'Check data timestamp to understand delay',
        'Report specific data issues through contact form',
        'Use data for trend analysis rather than real-time trading'
      ],
      preventions: [
        'Understand limitations of free data sources',
        'Verify important decisions with real-time sources',
        'Focus on relative trends rather than absolute values'
      ],
      severity: 'low',
      frequency: 'occasional'
    },
    {
      id: 'connection-timeout',
      category: 'connectivity',
      title: 'Connection Timeouts',
      problem: 'Requests timing out or connection errors during data fetching.',
      symptoms: [
        'Error: "Request timeout"',
        'Error: "Network error"',
        'Partial data loading',
        'Intermittent connection issues'
      ],
      solutions: [
        'Check internet connection stability',
        'Try switching to mobile hotspot temporarily',
        'Disable VPN if using one',
        'Contact internet service provider if persistent',
        'Try again during off-peak hours',
        'Use smaller batch sizes for requests'
      ],
      preventions: [
        'Use stable internet connection',
        'Avoid peak usage hours (9 AM - 5 PM)',
        'Test connection speed before important analysis'
      ],
      severity: 'high',
      frequency: 'rare'
    },
    {
      id: 'mobile-display-issues',
      category: 'browser',
      title: 'Mobile Display Issues',
      problem: 'Application not displaying correctly on mobile devices or tablets.',
      symptoms: [
        'Text too small to read',
        'Buttons not touchable',
        'Charts overlapping',
        'Horizontal scrolling required'
      ],
      solutions: [
        'Rotate device to landscape mode for better view',
        'Use browser zoom to increase text size',
        'Try desktop mode in browser settings',
        'Use simplified view when available',
        'Consider using desktop/laptop for complex analysis'
      ],
      preventions: [
        'Use tablets (10" minimum) for mobile analysis',
        'Plan analysis for desktop when possible',
        'Keep portfolios small for mobile use'
      ],
      severity: 'low',
      frequency: 'common'
    }
  ];

  // Browser compatibility data
  const browserCompatibility = [
    {
      browser: 'Chrome',
      version: '90+',
      status: 'excellent',
      features: 'All features supported, best performance',
      recommendation: 'Recommended'
    },
    {
      browser: 'Firefox',
      version: '88+',
      status: 'excellent',
      features: 'All features supported, good performance',
      recommendation: 'Recommended'
    },
    {
      browser: 'Safari',
      version: '14+',
      status: 'good',
      features: 'Most features supported, some chart limitations',
      recommendation: 'Supported'
    },
    {
      browser: 'Edge',
      version: '90+',
      status: 'excellent',
      features: 'All features supported, good performance',
      recommendation: 'Recommended'
    },
    {
      browser: 'Opera',
      version: '76+',
      status: 'good',
      features: 'Most features supported',
      recommendation: 'Supported'
    },
    {
      browser: 'Internet Explorer',
      version: 'Any',
      status: 'unsupported',
      features: 'Not compatible',
      recommendation: 'Not Supported'
    }
  ];

  // Performance tips
  const performanceTips = [
    {
      category: 'Portfolio Management',
      tips: [
        'Keep portfolios under 50 assets for optimal performance',
        'Group similar assets together for batch analysis',
        'Remove inactive or zero-value positions',
        'Focus analysis on your largest holdings first'
      ]
    },
    {
      category: 'Browser Optimization',
      tips: [
        'Close unnecessary tabs before analysis',
        'Use latest browser version',
        'Clear cache weekly',
        'Disable unnecessary extensions',
        'Restart browser every few hours during heavy use'
      ]
    },
    {
      category: 'System Resources',
      tips: [
        'Ensure 4GB+ RAM available',
        'Close other applications during analysis',
        'Use wired internet connection when possible',
        'Perform analysis during off-peak hours'
      ]
    },
    {
      category: 'Analysis Strategy',
      tips: [
        'Start with portfolio overview before detailed analysis',
        'Analyze sections incrementally rather than all at once',
        'Save analysis results before making changes',
        'Plan analysis sessions in advance'
      ]
    }
  ];

  // Categories
  const categories = [
    { id: 'all', name: 'All Problems', icon: '🔍' },
    { id: 'common', name: 'Common Issues', icon: '⚠️' },
    { id: 'performance', name: 'Performance', icon: '⚡' },
    { id: 'browser', name: 'Browser Issues', icon: '🌐' },
    { id: 'api', name: 'API Problems', icon: '🔌' },
    { id: 'data', name: 'Data Issues', icon: '📊' },
    { id: 'connectivity', name: 'Connection', icon: '📡' }
  ];

  const severityLevels = [
    { id: 'all', name: 'All Severities', color: '#64748b' },
    { id: 'low', name: 'Low', color: '#10b981' },
    { id: 'medium', name: 'Medium', color: '#f59e0b' },
    { id: 'high', name: 'High', color: '#ef4444' },
    { id: 'critical', name: 'Critical', color: '#dc2626' }
  ];

  // Filter items
  const filteredItems = troubleshootingItems.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    const severityMatch = selectedSeverity === 'all' || item.severity === selectedSeverity;
    const searchMatch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symptoms.some(symptom => symptom.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && severityMatch && searchMatch;
  });

  // Toggle expansion
  const toggleExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Get severity info
  const getSeverityInfo = (severity: string) => {
    return severityLevels.find(s => s.id === severity) || severityLevels[0];
  };

  // Get status color for browser compatibility
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#f59e0b';
      case 'poor': return '#ef4444';
      case 'unsupported': return '#64748b';
      default: return '#64748b';
    }
  };

  return (
    <div className="troubleshooting-guide">
      {/* Header */}
      <div className="guide-header">
        <div className="header-content">
          <h1>🔧 Troubleshooting Guide</h1>
          <p className="header-subtitle">
            Comprehensive solutions for common problems and optimization tips
          </p>
          <div className="quick-help">
            <div className="help-icon">💡</div>
            <div className="help-content">
              <strong>Quick Help:</strong> Use the search and filters below to find solutions to specific problems. 
              For immediate assistance, try the most common solutions: refresh the page, check your internet 
              connection, and wait for API rate limits to reset.
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="guide-filters">
        <div className="search-section">
          <h3>🔍 Search Problems</h3>
          <input
            type="text"
            placeholder="Search by problem, symptom, or solution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <h3>📂 Filter by Category</h3>
          <div className="filter-buttons">
            {categories.map(category => (
              <button
                key={category.id}
                className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="filter-icon">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>🎯 Filter by Severity</h3>
          <div className="filter-buttons">
            {severityLevels.map(level => (
              <button
                key={level.id}
                className={`filter-btn severity-btn ${selectedSeverity === level.id ? 'active' : ''}`}
                onClick={() => setSelectedSeverity(level.id)}
                style={{ '--severity-color': level.color } as React.CSSProperties}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Troubleshooting Items */}
      <div className="troubleshooting-items">
        <div className="items-header">
          <h2>🛠️ Problem Solutions</h2>
          <div className="items-count">
            Showing {filteredItems.length} of {troubleshootingItems.length} problems
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="no-items">
            <div className="no-items-icon">🔍</div>
            <h3>No problems found</h3>
            <p>Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map(item => {
              const isExpanded = expandedItems.has(item.id);
              const severityInfo = getSeverityInfo(item.severity);
              
              return (
                <div
                  key={item.id}
                  className={`item-card ${isExpanded ? 'expanded' : ''}`}
                >
                  <div className="item-header" onClick={() => toggleExpansion(item.id)}>
                    <div className="item-title-section">
                      <h3 className="item-title">{item.title}</h3>
                      <div className="item-meta">
                        <span 
                          className="severity-badge"
                          style={{ backgroundColor: severityInfo.color }}
                        >
                          {item.severity.toUpperCase()}
                        </span>
                        <span className="frequency-badge">
                          {item.frequency.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="expand-icon">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  <div className="item-preview">
                    <p>{item.problem}</p>
                  </div>

                  {isExpanded && (
                    <div className="item-content">
                      <div className="symptoms-section">
                        <h4>🔍 Symptoms</h4>
                        <ul>
                          {item.symptoms.map((symptom, index) => (
                            <li key={index}>{symptom}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="solutions-section">
                        <h4>✅ Solutions</h4>
                        <ol>
                          {item.solutions.map((solution, index) => (
                            <li key={index}>{solution}</li>
                          ))}
                        </ol>
                      </div>

                      {item.preventions && (
                        <div className="preventions-section">
                          <h4>🛡️ Prevention Tips</h4>
                          <ul>
                            {item.preventions.map((prevention, index) => (
                              <li key={index}>{prevention}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Browser Compatibility */}
      <div className="browser-compatibility">
        <h2>🌐 Browser Compatibility</h2>
        <p>Student Analyst works best with modern browsers. Here's our compatibility guide:</p>
        
        <div className="compatibility-table">
          <div className="table-header">
            <div>Browser</div>
            <div>Version</div>
            <div>Status</div>
            <div>Features</div>
            <div>Recommendation</div>
          </div>
          {browserCompatibility.map((browser, index) => (
            <div key={index} className="table-row">
              <div className="browser-name">{browser.browser}</div>
              <div className="browser-version">{browser.version}</div>
              <div className="browser-status">
                <span 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(browser.status) }}
                ></span>
                {browser.status}
              </div>
              <div className="browser-features">{browser.features}</div>
              <div className="browser-recommendation">{browser.recommendation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Tips */}
      <div className="performance-tips">
        <h2>⚡ Performance Optimization Tips</h2>
        <p>Follow these tips to get the best performance from Student Analyst:</p>
        
        <div className="tips-grid">
          {performanceTips.map((category, index) => (
            <div key={index} className="tips-category">
              <h3>{category.category}</h3>
              <ul>
                {category.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="contact-section">
        <h2>📞 Still Need Help?</h2>
        <p>If you're still experiencing issues after trying our troubleshooting guide, here's how to get help:</p>
        
        <div className="contact-options">
          <div className="contact-card">
            <div className="contact-icon">📧</div>
            <h3>Email Support</h3>
            <p>Send detailed problem description including:</p>
            <ul>
              <li>Browser and version</li>
              <li>Portfolio size</li>
              <li>Error messages</li>
              <li>Steps to reproduce</li>
            </ul>
            <button className="contact-btn">Send Email</button>
          </div>

          <div className="contact-card">
            <div className="contact-icon">💬</div>
            <h3>Community Forum</h3>
            <p>Join our community to:</p>
            <ul>
              <li>Ask questions</li>
              <li>Share solutions</li>
              <li>Get help from other users</li>
              <li>Request new features</li>
            </ul>
            <button className="contact-btn">Visit Forum</button>
          </div>

          <div className="contact-card">
            <div className="contact-icon">📚</div>
            <h3>Documentation</h3>
            <p>Comprehensive guides covering:</p>
            <ul>
              <li>Getting started tutorials</li>
              <li>Feature explanations</li>
              <li>Best practices</li>
              <li>FAQ section</li>
            </ul>
            <button className="contact-btn">View Docs</button>
          </div>
        </div>

        <div className="emergency-contact">
          <div className="emergency-icon">🚨</div>
          <div className="emergency-content">
            <h3>Critical Issues</h3>
            <p>
              For critical issues affecting multiple users or data integrity concerns, 
              please report immediately through our priority support channel. We aim to 
              respond to critical issues within 2-4 hours.
            </p>
            <button className="emergency-btn">Report Critical Issue</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingGuide; 

