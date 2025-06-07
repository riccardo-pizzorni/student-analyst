/**
 * STUDENT ANALYST - Issues & Limitations Page
 * Transparent communication about platform limitations and known issues
 */

import React, { useState, useEffect } from 'react';
import './IssuesPage.css';

interface Issue {
  id: string;
  category: 'limitation' | 'api' | 'data' | 'performance' | 'feature';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  status: 'known' | 'investigating' | 'planned' | 'wontfix';
  workaround?: string;
  lastUpdated: Date;
}

const IssuesPage: React.FC = () => {
  // State for filtering and display
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  // Known issues and limitations
  const issues: Issue[] = [
    // API Rate Limits
    {
      id: 'api-rate-limits',
      category: 'api',
      title: 'API Rate Limiting (5 requests/minute)',
      description: 'Free APIs have strict rate limits. Alpha Vantage allows 5 requests per minute, Yahoo Finance has similar restrictions.',
      impact: 'high',
      status: 'known',
      workaround: 'Portfolio analysis is batched and cached. Large portfolios (50+ assets) may take 10-15 minutes to fully refresh.',
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'data-delays',
      category: 'data',
      title: 'Market Data Delays (15-20 minutes)',
      description: 'Free market data feeds have built-in delays. Real-time data requires expensive premium subscriptions.',
      impact: 'medium',
      status: 'known',
      workaround: 'Prices shown are delayed but sufficient for portfolio analysis and trend identification.',
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'api-daily-limits',
      category: 'api',
      title: 'Daily API Quotas (500 requests/day)',
      description: 'Free tier APIs have daily quotas. Heavy usage may hit limits, especially for large portfolios.',
      impact: 'medium',
      status: 'known',
      workaround: 'Local caching reduces API calls. Refresh only when needed. Consider spreading analysis across multiple days.',
      lastUpdated: new Date('2024-01-15')
    },
    // Performance Limitations
    {
      id: 'large-portfolio-performance',
      category: 'performance',
      title: 'Large Portfolio Performance (100+ assets)',
      description: 'Portfolios over 100 assets may experience slower calculations and longer refresh times.',
      impact: 'medium',
      status: 'known',
      workaround: 'Split large portfolios into smaller groups. Focus analysis on most significant holdings first.',
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'browser-memory',
      category: 'performance',
      title: 'Browser Memory Usage',
      description: 'Extended sessions with large datasets may consume significant browser memory.',
      impact: 'low',
      status: 'known',
      workaround: 'Refresh the page periodically during long analysis sessions. Close unused browser tabs.',
      lastUpdated: new Date('2024-01-15')
    },
    // Data Quality Issues
    {
      id: 'missing-financial-data',
      category: 'data',
      title: 'Missing Financial Data for Some Assets',
      description: 'Free APIs may not have complete financial data for all stocks, especially smaller companies or international markets.',
      impact: 'medium',
      status: 'known',
      workaround: 'Focus on major market assets (S&P 500, NASDAQ). Verify data completeness before making decisions.',
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'currency-conversion',
      category: 'limitation',
      title: 'Limited Currency Support',
      description: 'Multi-currency portfolios have limited conversion support. Focus is on USD-based analysis.',
      impact: 'medium',
      status: 'known',
      workaround: 'Convert values manually or focus analysis on single-currency portfolios.',
      lastUpdated: new Date('2024-01-15')
    },
    // Feature Limitations
    {
      id: 'real-time-alerts',
      category: 'feature',
      title: 'No Real-time Alerts',
      description: 'Platform does not support real-time price alerts or notifications due to data delay limitations.',
      impact: 'medium',
      status: 'wontfix',
      workaround: 'Use traditional broker platforms for real-time alerts. Focus on trend analysis and periodic reviews.',
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'historical-data-limits',
      category: 'limitation',
      title: 'Limited Historical Data (5 years max)',
      description: 'Free APIs provide limited historical data. Long-term backtesting may not be available for all assets.',
      impact: 'low',
      status: 'known',
      workaround: '5 years is sufficient for most portfolio analysis. Focus on recent market conditions and trends.',
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'options-futures-support',
      category: 'limitation',
      title: 'No Options or Futures Support',
      description: 'Platform focuses on stocks and ETFs. Options, futures, and complex derivatives are not supported.',
      impact: 'high',
      status: 'planned',
      workaround: 'Use specialized platforms for derivatives analysis. Focus on underlying equity positions.',
      lastUpdated: new Date('2024-01-15')
    }
  ];

  // Category configuration
  const categories = [
    { id: 'all', name: 'All Issues', icon: '📋' },
    { id: 'api', name: 'API Limits', icon: '🔌' },
    { id: 'data', name: 'Data Issues', icon: '📊' },
    { id: 'performance', name: 'Performance', icon: '⚡' },
    { id: 'limitation', name: 'Limitations', icon: '⚠️' },
    { id: 'feature', name: 'Missing Features', icon: '🔧' }
  ];

  const impactLevels = [
    { id: 'all', name: 'All Levels', color: '#64748b' },
    { id: 'low', name: 'Low Impact', color: '#059669' },
    { id: 'medium', name: 'Medium Impact', color: '#d97706' },
    { id: 'high', name: 'High Impact', color: '#dc2626' }
  ];

  const statusTypes = [
    { id: 'known', name: 'Known Issue', color: '#2563eb', description: 'We are aware and monitoring' },
    { id: 'investigating', name: 'Investigating', color: '#7c3aed', description: 'Currently being analyzed' },
    { id: 'planned', name: 'Planned Fix', color: '#059669', description: 'Planned for future release' },
    { id: 'wontfix', name: 'Won\'t Fix', color: '#64748b', description: 'Limitation by design or external factors' }
  ];

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const categoryMatch = selectedCategory === 'all' || issue.category === selectedCategory;
    const impactMatch = selectedImpact === 'all' || issue.impact === selectedImpact;
    return categoryMatch && impactMatch;
  });

  // Toggle issue expansion
  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    return statusTypes.find(s => s.id === status) || statusTypes[0];
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    const level = impactLevels.find(l => l.id === impact);
    return level?.color || '#64748b';
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="issues-page">
      {/* Header */}
      <div className="issues-header">
        <div className="header-content">
          <h1>🛠️ Known Issues & Limitations</h1>
          <p className="header-subtitle">
            Transparent communication about current platform limitations and known issues
          </p>
          <div className="transparency-note">
            <div className="note-icon">ℹ️</div>
            <div className="note-content">
              <strong>Our Commitment to Transparency:</strong> We believe in honest communication about our platform's 
              limitations. This page lists current issues, their impact, and available workarounds. Student Analyst 
              is designed as a free educational tool with inherent limitations due to our zero-cost approach.
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="issues-filters">
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
          <h3>🎯 Filter by Impact</h3>
          <div className="filter-buttons">
            {impactLevels.map(level => (
              <button
                key={level.id}
                className={`filter-btn impact-btn ${selectedImpact === level.id ? 'active' : ''}`}
                onClick={() => setSelectedImpact(level.id)}
                style={{ '--impact-color': level.color } as React.CSSProperties}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="issues-list">
        <div className="list-header">
          <h2>📋 Issues List</h2>
          <div className="issues-count">
            Showing {filteredIssues.length} of {issues.length} issues
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="no-issues">
            <div className="no-issues-icon">✨</div>
            <h3>No issues found</h3>
            <p>Try adjusting your filters to see more issues.</p>
          </div>
        ) : (
          <div className="issues-grid">
            {filteredIssues.map(issue => {
              const isExpanded = expandedIssues.has(issue.id);
              const statusInfo = getStatusInfo(issue.status);
              
              return (
                <div
                  key={issue.id}
                  className={`issue-card ${isExpanded ? 'expanded' : ''}`}
                >
                  <div className="issue-header" onClick={() => toggleIssue(issue.id)}>
                    <div className="issue-title-section">
                      <h3 className="issue-title">{issue.title}</h3>
                      <div className="issue-meta">
                        <span 
                          className="impact-badge"
                          style={{ backgroundColor: getImpactColor(issue.impact) }}
                        >
                          {issue.impact.toUpperCase()} IMPACT
                        </span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: statusInfo.color }}
                        >
                          {statusInfo.name}
                        </span>
                      </div>
                    </div>
                    <div className="expand-icon">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="issue-content">
                      <div className="issue-description">
                        <h4>📝 Description</h4>
                        <p>{issue.description}</p>
                      </div>

                      {issue.workaround && (
                        <div className="issue-workaround">
                          <h4>💡 Workaround</h4>
                          <p>{issue.workaround}</p>
                        </div>
                      )}

                      <div className="issue-details">
                        <div className="detail-item">
                          <strong>Status:</strong> {statusInfo.description}
                        </div>
                        <div className="detail-item">
                          <strong>Last Updated:</strong> {formatDate(issue.lastUpdated)}
                        </div>
                        <div className="detail-item">
                          <strong>Category:</strong> {categories.find(c => c.id === issue.category)?.name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Understanding Our Approach */}
      <div className="approach-section">
        <h2>🎯 Understanding Our Approach</h2>
        
        <div className="approach-grid">
          <div className="approach-card">
            <div className="approach-icon">💰</div>
            <h3>Zero Cost Philosophy</h3>
            <p>
              Student Analyst is completely free because we believe financial education should be accessible 
              to everyone. This means we rely on free APIs and services, which come with inherent limitations.
            </p>
          </div>

          <div className="approach-card">
            <div className="approach-icon">🎓</div>
            <h3>Educational Focus</h3>
            <p>
              Our platform is designed for learning and educational analysis, not professional trading. 
              The limitations help users understand real-world constraints of free financial data.
            </p>
          </div>

          <div className="approach-card">
            <div className="approach-icon">🔬</div>
            <h3>Continuous Improvement</h3>
            <p>
              We continuously work to improve the platform within our zero-cost constraints. Many limitations 
              drive us to create creative solutions and better user experiences.
            </p>
          </div>

          <div className="approach-card">
            <div className="approach-icon">🤝</div>
            <h3>Community Driven</h3>
            <p>
              User feedback helps us prioritize improvements and find better workarounds. We're transparent 
              about what we can and cannot fix within our free model.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>❓ Frequently Asked Questions</h2>
        
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Why are there so many limitations?</h3>
            <p>
              Free financial data comes with restrictions imposed by data providers. Rate limits, delays, 
              and quotas are industry standard for free tiers. These limitations allow us to keep the 
              platform completely free for users.
            </p>
          </div>

          <div className="faq-item">
            <h3>Will these issues be fixed?</h3>
            <p>
              Some issues are external limitations we cannot fix (API rate limits, data delays). Others 
              are features we're actively working on. We're transparent about what's fixable and what isn't.
            </p>
          </div>

          <div className="faq-item">
            <h3>Is the platform reliable for analysis?</h3>
            <p>
              Yes, within its limitations. The platform is excellent for learning, trend analysis, and 
              educational purposes. For real-time trading or professional use, consider paid alternatives.
            </p>
          </div>

          <div className="faq-item">
            <h3>How can I work around these limitations?</h3>
            <p>
              Each issue includes suggested workarounds. Generally: use smaller portfolios, analyze periodically 
              rather than continuously, focus on major market assets, and understand the educational nature.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="issues-footer">
        <div className="footer-content">
          <h3>📬 Report New Issues</h3>
          <p>
            Found a bug or limitation not listed here? We appreciate feedback to improve the platform.
          </p>
          <div className="report-options">
            <button className="report-btn">
              📧 Report Issue
            </button>
            <button className="report-btn secondary">
              💬 Suggest Improvement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuesPage; 

