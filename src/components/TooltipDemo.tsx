import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipText, WithTooltip } from '@/components/ui/Tooltip';
import { 
  InfoIcon, 
  SettingsIcon, 
  ChartBarIcon, 
  SaveIcon,
  CheckIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
  TrendingUpIcon,
  PieChartIcon,
  CalculatorIcon,
  DownloadIcon,
  StarIcon
} from '@/components/ui/icons';

interface DemoSettings {
  delay: number;
  maxLines: number;
  showPositioning: boolean;
}

export function TooltipDemo() {
  const [settings, setSettings] = useState<DemoSettings>({
    delay: 500,
    maxLines: 3,
    showPositioning: false
  });

  const tooltipExamples = [
    {
      id: 'portfolio-input',
      title: 'Portfolio Data Input',
      content: 'Insert your portfolio holdings here.\nSupported formats: CSV, JSON, manual entry.\nAll data stays on your device.',
      component: (
        <WithTooltip 
          tooltip="Insert your portfolio holdings here.\nSupported formats: CSV, JSON, manual entry.\nAll data stays on your device."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <Button variant="default" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Portfolio Input
          </Button>
        </WithTooltip>
      )
    },
    {
      id: 'risk-analysis',
      title: 'Risk Metrics',
      content: 'Calculate portfolio risk measures including VaR, volatility, and correlation matrices.',
      component: (
        <TooltipText 
          text="Calculate portfolio risk measures including VaR, volatility, and correlation matrices."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <Button variant="outline" className="gap-2">
            <AlertTriangleIcon className="h-4 w-4" />
            Risk Analysis
          </Button>
        </TooltipText>
      )
    },
    {
      id: 'optimization',
      title: 'Portfolio Optimization',
      content: 'Find optimal asset allocation using Modern Portfolio Theory and advanced algorithms.',
      component: (
        <Tooltip 
          content="Find optimal asset allocation using Modern Portfolio Theory and advanced algorithms."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <Button variant="secondary" className="gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Optimize
          </Button>
        </Tooltip>
      )
    },
    {
      id: 'performance',
      title: 'Performance Analysis',
      content: 'Analyze historical performance with Sharpe ratio, alpha, beta, and drawdown metrics.',
      component: (
        <WithTooltip 
          tooltip="Analyze historical performance with Sharpe ratio, alpha, beta, and drawdown metrics."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <Button variant="ghost" className="gap-2">
            <ChartBarIcon className="h-4 w-4" />
            Performance
          </Button>
        </WithTooltip>
      )
    },
    {
      id: 'help-icon',
      title: 'Help Icon',
      content: 'Get help with financial analysis.\nAccess tutorials and documentation.',
      component: (
        <Tooltip 
          content="Get help with financial analysis.\nAccess tutorials and documentation."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <button 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Help and documentation"
          >
            <HelpCircleIcon className="h-5 w-5 text-gray-600" />
          </button>
        </Tooltip>
      )
    },
    {
      id: 'settings-icon',
      title: 'Settings',
      content: 'Configure analysis parameters, data sources, and export options.',
      component: (
        <TooltipText 
          text="Configure analysis parameters, data sources, and export options."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <button 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Settings and configuration"
          >
            <SettingsIcon className="h-5 w-5 text-gray-600" />
          </button>
        </TooltipText>
      )
    },
    {
      id: 'auto-save',
      title: 'Auto-save Status',
      content: 'Your work is automatically saved every 30 seconds to prevent data loss.',
      component: (
        <WithTooltip 
          tooltip="Your work is automatically saved every 30 seconds to prevent data loss."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-md">
            <SaveIcon className="h-4 w-4" />
            <span className="text-sm">Saved</span>
          </div>
        </WithTooltip>
      )
    },
    {
      id: 'calculation-status',
      title: 'Calculation Engine',
      content: 'Advanced mathematical engine for portfolio calculations.\nProcesses up to 1000 assets in under 10 seconds.',
      component: (
        <Tooltip 
          content="Advanced mathematical engine for portfolio calculations.\nProcesses up to 1000 assets in under 10 seconds."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md">
            <CalculatorIcon className="h-4 w-4" />
            <span className="text-sm">Computing</span>
          </div>
        </Tooltip>
      )
    },
    {
      id: 'success-indicator',
      title: 'Success State',
      content: 'Analysis completed successfully. Ready to view results and generate reports.',
      component: (
        <TooltipText 
          text="Analysis completed successfully. Ready to view results and generate reports."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-md">
            <CheckIcon className="h-4 w-4" />
            <span className="text-sm">Complete</span>
          </div>
        </TooltipText>
      )
    },
    {
      id: 'export-options',
      title: 'Export Results',
      content: 'Download analysis results in multiple formats: PDF report, Excel spreadsheet, or CSV data.',
      component: (
        <WithTooltip 
          tooltip="Download analysis results in multiple formats: PDF report, Excel spreadsheet, or CSV data."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <Button size="sm" className="gap-2">
            <DownloadIcon className="h-4 w-4" />
            Export
          </Button>
        </WithTooltip>
      )
    },
    {
      id: 'long-content',
      title: 'Long Content Example',
      content: 'This is a very long tooltip content that exceeds the normal length limit. It demonstrates how the tooltip system handles content truncation when the text is too long for the specified maximum number of lines. The system will automatically add ellipsis to indicate truncated content.',
      component: (
        <Tooltip 
          content="This is a very long tooltip content that exceeds the normal length limit. It demonstrates how the tooltip system handles content truncation when the text is too long for the specified maximum number of lines. The system will automatically add ellipsis to indicate truncated content."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <Button variant="outline" size="sm">
            <InfoIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      )
    },
    {
      id: 'rating-system',
      title: 'Portfolio Rating',
      content: 'AI-powered portfolio rating.\nScore: 8.5/10 (Excellent)\nLow risk, high diversification.',
      component: (
        <TooltipText 
          text="AI-powered portfolio rating.\nScore: 8.5/10 (Excellent)\nLow risk, high diversification."
          delay={settings.delay}
          maxLines={settings.maxLines}
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon 
                key={star} 
                className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
            <span className="text-sm text-gray-600 ml-1">4.2</span>
          </div>
        </TooltipText>
      )
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tooltip System Demo
        </h1>
        <p className="text-gray-600">
          Interactive demonstration of the intelligent tooltip system with 500ms delay, 
          smart positioning, and touch device compatibility.
        </p>
      </div>

      {/* Settings Panel */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Demo Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="hover-delay-select" className="block text-sm font-medium text-gray-700 mb-2">
              Hover Delay (ms)
            </label>
            <select 
              id="hover-delay-select"
              value={settings.delay}
              onChange={(e) => setSettings(prev => ({ ...prev, delay: Number(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value={0}>0ms (Instant)</option>
              <option value={250}>250ms (Fast)</option>
              <option value={500}>500ms (Default)</option>
              <option value={1000}>1000ms (Slow)</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="max-lines-select" className="block text-sm font-medium text-gray-700 mb-2">
              Max Lines
            </label>
            <select 
              id="max-lines-select"
              value={settings.maxLines}
              onChange={(e) => setSettings(prev => ({ ...prev, maxLines: Number(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value={1}>1 line</option>
              <option value={2}>2 lines</option>
              <option value={3}>3 lines (Default)</option>
              <option value={5}>5 lines</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visual Helpers
            </label>
            <label className="flex items-center">
              <input 
                type="checkbox"
                checked={settings.showPositioning}
                onChange={(e) => setSettings(prev => ({ ...prev, showPositioning: e.target.checked }))}
                className="mr-2"
              />
              Show positioning guides
            </label>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How to Test</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <strong>Desktop:</strong> Hover over elements to see tooltips after the delay</li>
          <li>• <strong>Touch devices:</strong> Tap elements to show/hide tooltips</li>
          <li>• <strong>Positioning:</strong> Move elements near screen edges to see smart repositioning</li>
          <li>• <strong>Content:</strong> Try different max line settings to see truncation</li>
        </ul>
      </div>

      {/* Demo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tooltipExamples.map((example) => (
          <div 
            key={example.id}
            className={`p-4 border rounded-lg bg-white ${settings.showPositioning ? 'relative' : ''}`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">{example.title}</h3>
            <div className="text-sm text-gray-600 mb-3 leading-relaxed">
              {example.content.length > 100 
                ? `${example.content.substring(0, 100)}...`
                : example.content
              }
            </div>
            <div className="flex justify-center">
              {example.component}
            </div>
            {settings.showPositioning && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-300 pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>

      {/* Edge Cases Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edge Case Testing</h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Top edge */}
          <div className="col-span-4 flex justify-center">
            <WithTooltip tooltip="This tooltip should appear below when near the top edge">
              <Button size="sm">Top Edge</Button>
            </WithTooltip>
          </div>
          
          {/* Left and right edges */}
          <div className="flex justify-start">
            <WithTooltip tooltip="This should reposition to avoid the left edge">
              <Button size="sm">Left Edge</Button>
            </WithTooltip>
          </div>
          
          <div className="col-span-2"></div>
          
          <div className="flex justify-end">
            <WithTooltip tooltip="This should reposition to avoid the right edge">
              <Button size="sm">Right Edge</Button>
            </WithTooltip>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
        <div className="space-y-4 text-sm">
          <div>
            <strong>Basic Usage:</strong>
            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
{`<WithTooltip tooltip="Your tooltip text">
  <Button>Hover me</Button>
</WithTooltip>`}
            </pre>
          </div>
          
          <div>
            <strong>Custom Delay:</strong>
            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
{`<Tooltip content="Fast tooltip" delay={250}>
  <div>Quick help</div>
</Tooltip>`}
            </pre>
          </div>
          
          <div>
            <strong>Limited Lines:</strong>
            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
{`<TooltipText 
  text="Long content that will be truncated"
  maxLines={2}
>
  <Icon />
</TooltipText>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 

