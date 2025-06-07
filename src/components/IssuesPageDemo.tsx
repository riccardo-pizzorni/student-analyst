/**
 * STUDENT ANALYST - Issues Page Demo
 * Demonstration of the Issues page with footer integration
 */

import React, { useState } from 'react';
import IssuesPage from './IssuesPage';
import FooterIssuesLink from './FooterIssuesLink';
import './IssuesPageDemo.css';

const IssuesPageDemo: React.FC = () => {
  // State for demo
  const [currentView, setCurrentView] = useState<'main' | 'issues'>('main');
  const [showFooter, setShowFooter] = useState(true);

  // Navigation handlers
  const showIssuesPage = () => {
    setCurrentView('issues');
  };

  const showMainPage = () => {
    setCurrentView('main');
  };

  return (
    <div className="issues-page-demo">
      {currentView === 'main' ? (
        /* Main Demo Content */
        <div className="main-demo-content">
          {/* Demo Header */}
          <div className="demo-header">
            <h1>🛠️ Issues Page Demo</h1>
            <p>Demonstration of transparent communication about platform limitations</p>
          </div>

          {/* Demo Features */}
          <div className="demo-features">
            <div className="feature-section">
              <h2>📋 Features Overview</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">⚠️</div>
                  <h3>Known Issues List</h3>
                  <p>Comprehensive list of current platform limitations and known issues</p>
                  <ul>
                    <li>API rate limits explanation</li>
                    <li>Data delay notices</li>
                    <li>Performance limitations</li>
                    <li>Feature restrictions</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🔍</div>
                  <h3>Filtering & Search</h3>
                  <p>Easy filtering by category and impact level</p>
                  <ul>
                    <li>Filter by API, data, performance</li>
                    <li>Sort by impact level</li>
                    <li>Expandable issue details</li>
                    <li>Status tracking</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">💡</div>
                  <h3>Workarounds</h3>
                  <p>Practical solutions and workarounds for each limitation</p>
                  <ul>
                    <li>Step-by-step workarounds</li>
                    <li>Best practices</li>
                    <li>Alternative approaches</li>
                    <li>Optimization tips</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🤝</div>
                  <h3>Transparency</h3>
                  <p>Honest communication about free platform constraints</p>
                  <ul>
                    <li>Clear impact assessment</li>
                    <li>Status explanations</li>
                    <li>Timeline information</li>
                    <li>Educational context</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Demo Controls */}
            <div className="demo-controls">
              <h2>🎮 Demo Controls</h2>
              <div className="controls-grid">
                <div className="control-section">
                  <h3>Navigation</h3>
                  <div className="control-buttons">
                    <button
                      className="demo-btn primary"
                      onClick={showIssuesPage}
                    >
                      📄 View Issues Page
                    </button>
                    <button
                      className="demo-btn secondary"
                      onClick={() => setShowFooter(!showFooter)}
                    >
                      👁️ {showFooter ? 'Hide' : 'Show'} Footer
                    </button>
                  </div>
                </div>

                <div className="control-section">
                  <h3>Key Benefits</h3>
                  <div className="benefits-list">
                    <div className="benefit-item">
                      <span className="benefit-icon">🎯</span>
                      <span>Builds user trust through transparency</span>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">📚</span>
                      <span>Educates users about free platform constraints</span>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">🔧</span>
                      <span>Provides practical workarounds</span>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">📞</span>
                      <span>Reduces support requests</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Issues Preview */}
            <div className="sample-issues">
              <h2>📝 Sample Issues Preview</h2>
              <div className="issues-preview-grid">
                <div className="preview-issue">
                  <div className="issue-header-preview">
                    <h4>API Rate Limiting (5 requests/minute)</h4>
                    <div className="issue-badges">
                      <span className="impact-badge high">HIGH IMPACT</span>
                      <span className="status-badge known">KNOWN</span>
                    </div>
                  </div>
                  <p>Free APIs have strict rate limits that affect large portfolio analysis.</p>
                  <div className="workaround-preview">
                    <strong>Workaround:</strong> Analysis is batched and cached for efficiency.
                  </div>
                </div>

                <div className="preview-issue">
                  <div className="issue-header-preview">
                    <h4>Market Data Delays (15-20 minutes)</h4>
                    <div className="issue-badges">
                      <span className="impact-badge medium">MEDIUM IMPACT</span>
                      <span className="status-badge known">KNOWN</span>
                    </div>
                  </div>
                  <p>Free market data feeds have built-in delays for non-professional use.</p>
                  <div className="workaround-preview">
                    <strong>Workaround:</strong> Sufficient for analysis and trend identification.
                  </div>
                </div>

                <div className="preview-issue">
                  <div className="issue-header-preview">
                    <h4>Large Portfolio Performance (100+ assets)</h4>
                    <div className="issue-badges">
                      <span className="impact-badge medium">MEDIUM IMPACT</span>
                      <span className="status-badge known">KNOWN</span>
                    </div>
                  </div>
                  <p>Portfolios over 100 assets may experience slower calculations.</p>
                  <div className="workaround-preview">
                    <strong>Workaround:</strong> Split large portfolios into smaller groups.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Demo */}
          {showFooter && (
            <div className="footer-demo">
              <h2>🔗 Footer Integration</h2>
              <p>The Issues page is accessible through discrete links in the footer:</p>
              <FooterIssuesLink
                onClick={showIssuesPage}
                className="demo-footer"
              />
            </div>
          )}
        </div>
      ) : (
        /* Issues Page View */
        <div className="issues-view">
          <div className="issues-navigation">
            <button
              className="back-btn"
              onClick={showMainPage}
            >
              ← Back to Demo
            </button>
            <div className="nav-info">
              <span>You're viewing the Issues page</span>
            </div>
          </div>
          <IssuesPage />
        </div>
      )}
    </div>
  );
};

export default IssuesPageDemo; 

