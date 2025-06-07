/**
 * STUDENT ANALYST - Troubleshooting Guide Demo
 * Demonstration of the comprehensive troubleshooting functionality
 */

import React, { useState } from 'react';
import TroubleshootingGuide from './TroubleshootingGuide';
import './TroubleshootingDemo.css';

const TroubleshootingDemo: React.FC = () => {
  // Demo state
  const [currentView, setCurrentView] = useState<'overview' | 'guide'>('overview');
  const [demoScenario, setDemoScenario] = useState<string>('none');

  // Demo scenarios
  const scenarios = [
    {
      id: 'slow-loading',
      name: 'Slow Portfolio Loading',
      description: 'Portfolio takes forever to load data',
      icon: '⏳',
      category: 'Performance'
    },
    {
      id: 'api-limits',
      name: 'API Rate Limits',
      description: 'Getting "too many requests" errors',
      icon: '🚫',
      category: 'API Issues'
    },
    {
      id: 'browser-issues',
      name: 'Browser Compatibility',
      description: 'Features not working in Safari',
      icon: '🌐',
      category: 'Browser'
    },
    {
      id: 'memory-usage',
      name: 'High Memory Usage',
      description: 'Computer slowing down during analysis',
      icon: '💾',
      category: 'Performance'
    }
  ];

  // Feature highlights
  const features = [
    {
      title: 'Smart Problem Detection',
      description: 'Automatically categorizes and prioritizes issues by severity and frequency',
      icon: '🔍',
      benefits: [
        'Quick problem identification',
        'Severity-based prioritization',
        'Frequency tracking',
        'Category-based filtering'
      ]
    },
    {
      title: 'Step-by-Step Solutions',
      description: 'Detailed solutions with symptoms, fixes, and prevention tips',
      icon: '✅',
      benefits: [
        'Clear symptom identification',
        'Numbered solution steps',
        'Prevention strategies',
        'Workaround alternatives'
      ]
    },
    {
      title: 'Browser Compatibility Matrix',
      description: 'Comprehensive compatibility information for all major browsers',
      icon: '🌐',
      benefits: [
        'Version requirements',
        'Feature support matrix',
        'Performance comparisons',
        'Recommendation grades'
      ]
    },
    {
      title: 'Performance Optimization',
      description: 'Practical tips to maximize platform performance',
      icon: '⚡',
      benefits: [
        'Portfolio size optimization',
        'Browser tuning tips',
        'System resource management',
        'Analysis strategies'
      ]
    }
  ];

  // Statistics
  const stats = [
    { number: '15+', label: 'Common Problems', icon: '🛠️' },
    { number: '6', label: 'Browser Support', icon: '🌐' },
    { number: '20+', label: 'Performance Tips', icon: '⚡' },
    { number: '3', label: 'Contact Methods', icon: '📞' }
  ];

  return (
    <div className="troubleshooting-demo">
      {currentView === 'overview' ? (
        /* Demo Overview */
        <div className="demo-overview">
          {/* Header */}
          <div className="demo-header">
            <h1>🔧 Troubleshooting Guide Demo</h1>
            <p>Comprehensive problem-solving and optimization guide for Student Analyst</p>
          </div>

          {/* Statistics */}
          <div className="demo-stats">
            <h2>📊 Guide Coverage</h2>
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="demo-features">
            <h2>🌟 Key Features</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-header">
                    <div className="feature-icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                  </div>
                  <p className="feature-description">{feature.description}</p>
                  <div className="feature-benefits">
                    <h4>Benefits:</h4>
                    <ul>
                      {feature.benefits.map((benefit, bIndex) => (
                        <li key={bIndex}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Scenarios */}
          <div className="demo-scenarios">
            <h2>🎭 Try Demo Scenarios</h2>
            <p>Select a common problem scenario to see how the troubleshooting guide helps:</p>
            
            <div className="scenarios-grid">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`scenario-card ${demoScenario === scenario.id ? 'selected' : ''}`}
                  onClick={() => setDemoScenario(scenario.id)}
                >
                  <div className="scenario-icon">{scenario.icon}</div>
                  <h3>{scenario.name}</h3>
                  <p>{scenario.description}</p>
                  <div className="scenario-category">{scenario.category}</div>
                </div>
              ))}
            </div>

            {demoScenario !== 'none' && (
              <div className="scenario-result">
                <div className="result-header">
                  <h3>🎯 Selected Scenario</h3>
                  <p>You've selected: <strong>{scenarios.find(s => s.id === demoScenario)?.name}</strong></p>
                </div>
                <div className="result-actions">
                  <button 
                    className="action-btn primary"
                    onClick={() => setCurrentView('guide')}
                  >
                    🔧 Open Troubleshooting Guide
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => setDemoScenario('none')}
                  >
                    🔄 Reset Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Usage Instructions */}
          <div className="demo-instructions">
            <h2>📖 How to Use the Guide</h2>
            <div className="instructions-grid">
              <div className="instruction-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Identify the Problem</h3>
                  <p>Use search or category filters to find your specific issue quickly.</p>
                </div>
              </div>

              <div className="instruction-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Check Symptoms</h3>
                  <p>Compare your experience with the listed symptoms to confirm the problem.</p>
                </div>
              </div>

              <div className="instruction-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Follow Solutions</h3>
                  <p>Work through the numbered solutions step-by-step until resolved.</p>
                </div>
              </div>

              <div className="instruction-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Apply Prevention</h3>
                  <p>Use prevention tips to avoid the same problem in the future.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="demo-cta">
            <h2>🚀 Ready to Explore?</h2>
            <p>Experience the full troubleshooting guide with interactive search, filtering, and detailed solutions.</p>
            <div className="cta-actions">
              <button 
                className="cta-btn primary"
                onClick={() => setCurrentView('guide')}
              >
                🔧 Open Full Guide
              </button>
              <button className="cta-btn secondary">
                📚 View Documentation
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Troubleshooting Guide View */
        <div className="guide-view">
          <div className="guide-navigation">
            <button
              className="back-btn"
              onClick={() => setCurrentView('overview')}
            >
              ← Back to Demo Overview
            </button>
            <div className="nav-info">
              <span>You're viewing the full Troubleshooting Guide</span>
            </div>
          </div>
          <TroubleshootingGuide />
        </div>
      )}
    </div>
  );
};

export default TroubleshootingDemo; 

