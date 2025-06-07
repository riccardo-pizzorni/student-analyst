/**
 * STUDENT ANALYST - Footer Issues Link
 * Discrete link to Issues page in footer
 */

import React from 'react';
import './FooterIssuesLink.css';

interface FooterIssuesLinkProps {
  className?: string;
  onClick?: () => void;
}

const FooterIssuesLink: React.FC<FooterIssuesLinkProps> = ({
  className = '',
  onClick
}) => {
  return (
    <div className={`footer-issues-link ${className}`}>
      <div className="footer-content">
        {/* Main Footer Links */}
        <div className="footer-links">
          <div className="footer-section">
            <h4>Platform</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#help">Help</a></li>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="#tutorials">Tutorials</a></li>
              <li><a href="#documentation">Documentation</a></li>
              <li><a href="#examples">Examples</a></li>
              <li><a href="#community">Community</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#feedback">Feedback</a></li>
              <li>
                <button 
                  className="issues-link-btn"
                  onClick={onClick}
                  title="View current platform limitations and known issues"
                >
                  Known Issues
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-info">
            <p className="footer-text">
              © 2024 Student Analyst. Free educational platform for financial analysis.
            </p>
            <p className="footer-disclaimer">
              <span className="disclaimer-icon">⚠️</span>
              Educational tool only. Not for professional trading. 
              <button 
                className="limitations-link"
                onClick={onClick}
                title="View platform limitations and data delays"
              >
                View limitations
              </button>
            </p>
          </div>

          <div className="footer-badges">
            <div className="badge">
              <span className="badge-icon">🆓</span>
              <span className="badge-text">100% Free</span>
            </div>
            <div className="badge">
              <span className="badge-icon">🎓</span>
              <span className="badge-text">Educational</span>
            </div>
            <div className="badge">
              <span className="badge-icon">📊</span>
              <span className="badge-text">Open Source</span>
            </div>
          </div>
        </div>

        {/* Data Status Indicators */}
        <div className="data-status">
          <div className="status-item">
            <div className="status-indicator" data-status="delayed"></div>
            <span className="status-text">Market data delayed 15-20 min</span>
          </div>
          <div className="status-item">
            <div className="status-indicator" data-status="limited"></div>
            <span className="status-text">API rate limits apply</span>
          </div>
          <div className="status-item">
            <div className="status-indicator" data-status="free"></div>
            <span className="status-text">Free tier limitations</span>
          </div>
          <button 
            className="status-details-btn"
            onClick={onClick}
            title="Click for detailed explanation of all limitations"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default FooterIssuesLink; 

