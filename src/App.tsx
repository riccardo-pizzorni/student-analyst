import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'
import './App.css'
import reactLogo from './assets/react.svg'
import { ApiTester } from './components/ApiTester'
import AutomaticCleanupDashboard from './components/AutomaticCleanupDashboard'
import AutomaticFallbackDemo from './components/AutomaticFallbackDemo'
import CacheMonitorDashboard from './components/CacheMonitorDashboard'
import { CircuitBreakerTester } from './components/CircuitBreakerTester'
import DataConsistencyDemo from './components/DataConsistencyDemo'
import DataTransformationDemo from './components/DataTransformationDemo'
import { EnvironmentTester } from './components/EnvironmentTester'
import { ErrorBoundary } from './components/ErrorBoundary'
import ErrorHandlingDemo from './components/ErrorHandlingDemo'
import { ErrorTester } from './components/ErrorTester'
import MultiProviderDemo from './components/MultiProviderDemo'
import { NotificationContainer, NotificationProvider } from './components/NotificationProvider'
import PerformanceRatiosTester from './components/PerformanceRatiosTester'
import { PyScriptCalculator } from './components/PyScriptCalculator'
import { PyScriptTester } from './components/PyScriptTester'
import QueueManagerDemo from './components/QueueManagerDemo'
import ReturnsCalculationTester from './components/ReturnsCalculationTester'
import RiskMetricsTester from './components/RiskMetricsTester'
import { SimpleAlphaVantageTest } from './components/SimpleAlphaVantageTest'
import StorageHealthDashboardSimple from './components/StorageHealthDashboardSimple'
import StorageManagementSettings from './components/StorageManagementSettings'
import { ToastTester } from './components/ToastTester'
import UnifiedQualityDashboard from './components/UnifiedQualityDashboard'
import viteLogo from '/vite.svg'
// Note: These components are imported but not yet implemented
// import RiskMeasuresAdvancedTester from './components/RiskMeasuresAdvancedTester'
// import PortfolioOptimizationTester from './components/PortfolioOptimizationTester'
// import AlternativeAllocationsTester from './components/AlternativeAllocationsTester'
import AlgorithmOptimizationTester from './components/AlgorithmOptimizationTester'
import AutoSaveDemo from './components/AutoSaveDemo'
import BuyHoldBenchmarkTester from './components/BuyHoldBenchmarkTester'
import { ContextualHelpDemo } from './components/ContextualHelpDemo'
import DataChunkingTester from './components/DataChunkingTester'
import { EqualWeightStrategyTester } from './components/EqualWeightStrategyTester'
import Header from './components/Header'
import HeaderDemo from './components/HeaderDemo'
import LayoutManager from './components/LayoutManager'
import MainContentAreaDemo from './components/MainContentAreaDemo'
import MissingDataDemo from './components/MissingDataDemo'
import MomentumStrategyTester from './components/MomentumStrategyTester'
import OptimizationConstraintsTester from './components/OptimizationConstraintsTester'
import OutlierDetectionDemo from './components/OutlierDetectionDemo'
import PopupDemo from './components/PopupDemo'
import { PriceChartDemo } from './components/PriceChartDemo'
import ProgressIndicatorTester from './components/ProgressIndicatorTester'
import ProxyDemo from './components/ProxyDemo'
import RiskParityStrategyTester from './components/RiskParityStrategyTester'
import SidebarStepNavigationDemo from './components/SidebarStepNavigationDemo'
import { TheoryDemo } from './components/TheoryDemo'
import { TooltipDemo } from './components/TooltipDemo'
import { WebWorkerTester } from './components/WebWorkerTester'
import { automaticCleanup } from './services/AutomaticCleanupService'
import { getEnvironmentStatus, validateEnvironmentVariables } from './utils/envValidation'

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'header-demo' | 'sidebar-step-navigation-demo' | 'main-content-area-demo' | 'auto-save-demo' | 'tooltip-demo' | 'popup-demo' | 'theory-demo' | 'contextual-help-demo' | 'price-chart-demo' | 'pyscript' | 'pyscript-test' | 'toast-test' | 'error-test' | 'api-test' | 'circuit-breaker-test' | 'env-test' | 'alpha-vantage-test' | 'queue-manager' | 'data-transformation' | 'error-handling' | 'multi-provider' | 'automatic-fallback' | 'data-consistency' | 'data-consistency-demo' | 'proxy-demo' | 'missing-data-demo' | 'outlier-detection-demo' | 'unified-quality-dashboard' | 'cache-monitor-dashboard' | 'storage-health-dashboard' | 'automatic-cleanup-dashboard' | 'storage-management-settings' | 'returns-calculation-tester' | 'risk-metrics-tester' | 'performance-ratios-tester' | 'risk-measures-advanced-tester' | 'portfolio-optimization-tester' | 'alternative-allocations-tester' | 'optimization-constraints-tester' | 'web-worker-tester' | 'data-chunking-tester' | 'algorithm-optimization-tester' | 'progress-indicator-tester' | 'buy-hold-benchmark-tester' | 'equal-weight-strategy-tester' | 'risk-parity-strategy-tester' | 'momentum-strategy-tester'>('home')
  const [envStatus, setEnvStatus] = useState<{configured: boolean, missingKeys: string[]}>({configured: true, missingKeys: []})

  useEffect(() => {
    // Valida le variabili d'ambiente all'avvio
    try {
      const validation = validateEnvironmentVariables()
      const status = getEnvironmentStatus()
      setEnvStatus({
        configured: status.configured,
        missingKeys: status.missingKeys
      })
      
      // Log dei risultati della validazione
      if (!validation.isValid) {
        console.error('🚨 CONFIGURAZIONE AMBIENTE NON VALIDA:')
        validation.errors.forEach(error => console.error(error))
      }
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️  AVVISI CONFIGURAZIONE:')
        validation.warnings.forEach(warning => console.warn(warning))
      }
      
      if (validation.isValid) {
        console.log('✅ Configurazione ambiente validata correttamente')
        if (status.debugMode) console.log('🐛 Modalità debug attiva')
        if (status.offlineMode) console.log('📴 Modalità offline attiva')
      }
    } catch (_error) {
      console.error('Errore durante la validazione delle variabili d\'ambiente:', _error)
      setEnvStatus({configured: false, missingKeys: ['VITE_API_KEY_ALPHA_VANTAGE']})
    }

    // Inizializza sistema cleanup automatico
    automaticCleanup.initialize().catch(error => {
      console.error('❌ Errore inizializzazione cleanup automatico:', error)
    })

    // Cleanup all'unmount dell'app
    return () => {
      automaticCleanup.shutdown()
    }
  }, [])

  const renderCurrentView = () => {
    switch (currentView) {
      case 'pyscript':
        return <PyScriptCalculator />
      case 'pyscript-test':
        return <PyScriptTester />
      case 'toast-test':
        return <ToastTester />
      case 'error-test':
        return <ErrorTester />
      case 'api-test':
        return <ApiTester />
      case 'circuit-breaker-test':
        return <CircuitBreakerTester />
      case 'env-test':
        return <EnvironmentTester />
      case 'alpha-vantage-test':
        return <SimpleAlphaVantageTest />
      case 'queue-manager':
        return <QueueManagerDemo />
      case 'data-transformation':
        return <DataTransformationDemo />
      case 'error-handling':
        return <ErrorHandlingDemo />
      case 'multi-provider':
        return <MultiProviderDemo />
      case 'automatic-fallback':
        return <AutomaticFallbackDemo />
      case 'data-consistency':
        return <DataConsistencyDemo />
      case 'data-consistency-demo':
        return <DataConsistencyDemo />
      case 'proxy-demo':
        return <ProxyDemo />
      case 'missing-data-demo':
        return <MissingDataDemo />
      case 'outlier-detection-demo':
        return <OutlierDetectionDemo />
      case 'unified-quality-dashboard':
        return <UnifiedQualityDashboard />
      case 'cache-monitor-dashboard':
        return <CacheMonitorDashboard />
      case 'storage-health-dashboard':
        return <StorageHealthDashboardSimple />
      case 'automatic-cleanup-dashboard':
        return <AutomaticCleanupDashboard />
      case 'storage-management-settings':
        return <StorageManagementSettings />
      case 'returns-calculation-tester':
        return <ReturnsCalculationTester />
      case 'risk-metrics-tester':
        return <RiskMetricsTester />
      case 'performance-ratios-tester':
        return <PerformanceRatiosTester />
      case 'optimization-constraints-tester':
        return <OptimizationConstraintsTester />
      case 'web-worker-tester':
        return <WebWorkerTester />
      case 'data-chunking-tester':
        return <DataChunkingTester />
      case 'algorithm-optimization-tester':
        return <AlgorithmOptimizationTester />
      case 'progress-indicator-tester':
        return <ProgressIndicatorTester />
      case 'buy-hold-benchmark-tester':
        return <BuyHoldBenchmarkTester />
      case 'equal-weight-strategy-tester':
        return <EqualWeightStrategyTester />
      case 'risk-parity-strategy-tester':
        return <RiskParityStrategyTester />
      case 'momentum-strategy-tester':
        return <MomentumStrategyTester />
      case 'header-demo':
        return <HeaderDemo />
      case 'sidebar-step-navigation-demo':
        return <SidebarStepNavigationDemo />
      case 'main-content-area-demo':
        return <MainContentAreaDemo />
      case 'auto-save-demo':
        return <AutoSaveDemo />
      case 'tooltip-demo':
        return <TooltipDemo />
      case 'popup-demo':
        return <PopupDemo />
      case 'theory-demo':
        return <TheoryDemo />
              case 'contextual-help-demo':
          return <ContextualHelpDemo />
        case 'price-chart-demo':
          return <PriceChartDemo />
      default:
        return (
          <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
            <div className="flex gap-8 mb-8">
              <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
                <img src={viteLogo} className="logo hover:scale-110 transition-transform" alt="Vite logo" />
              </a>
              <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
                <img src={reactLogo} className="logo react hover:scale-110 transition-transform" alt="React logo" />
              </a>
            </div>
            
            <h1 className="text-4xl font-bold text-primary mb-4">Student Analyst</h1>
            <p className="text-xl text-muted-foreground mb-8 text-center max-w-2xl">
              Professional Financial Analysis Platform
            </p>
            
            <div className="bg-card p-8 rounded-lg shadow-lg border max-w-4xl w-full mx-auto px-4 md:px-8 lg:px-16">
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">🚀 Platform Features</h2>
                  <p className="text-muted-foreground">
                    Advanced portfolio optimization and risk analysis
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => setCurrentView('header-demo')}
                    className="w-full text-lg py-3 bg-blue-600 hover:bg-blue-700"
                  >
                    🎯 Header Component Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('sidebar-step-navigation-demo')}
                    className="w-full text-lg py-3 bg-green-600 hover:bg-green-700"
                  >
                    🗺️ Sidebar Step Navigation Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('main-content-area-demo')}
                    className="w-full text-lg py-3 bg-purple-600 hover:bg-purple-700"
                  >
                    📱 Main Content Area Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('auto-save-demo')}
                    className="w-full text-lg py-3 bg-orange-600 hover:bg-orange-700"
                  >
                    💾 Auto-save System Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('tooltip-demo')}
                    className="w-full text-lg py-3 bg-indigo-600 hover:bg-indigo-700"
                  >
                    💬 Tooltip System Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('popup-demo')}
                    className="w-full text-lg py-3 bg-cyan-600 hover:bg-cyan-700"
                  >
                    🎯 Popup System Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('theory-demo')}
                    className="w-full text-lg py-3 bg-emerald-600 hover:bg-emerald-700"
                  >
                    🎓 Theory Buttons Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('contextual-help-demo')}
                    className="w-full text-lg py-3 bg-violet-600 hover:bg-violet-700"
                  >
                    🔮 Contextual Help Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('pyscript')}
                    className="w-full text-lg py-3"
                  >
                    🐍 Launch PyScript Calculator
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('pyscript-test')}
                    variant="outline" 
                    className="w-full"
                  >
                    🧪 PyScript Error Handling Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('toast-test')}
                    variant="outline" 
                    className="w-full"
                  >
                    🍞 Toast Notification Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('api-test')}
                    variant="outline" 
                    className="w-full"
                  >
                    🌐 API Call Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('circuit-breaker-test')}
                    variant="outline" 
                    className="w-full"
                  >
                    ⚡ Circuit Breaker Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('error-test')}
                    variant="outline" 
                    className="w-full"
                  >
                    🧪 Error Boundary Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('env-test')}
                    variant="outline" 
                    className="w-full"
                  >
                    🔧 Environment Variables Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('alpha-vantage-test')}
                    variant="outline" 
                    className="w-full"
                  >
                    📊 Alpha Vantage Service Test
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('queue-manager')}
                    variant="outline" 
                    className="w-full"
                  >
                    🚀 Queue Management System
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('data-transformation')}
                    variant="outline" 
                    className="w-full"
                  >
                    🔄 Data Transformation System
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('error-handling')}
                    variant="outline" 
                    className="w-full"
                  >
                    🛡️ Error Handling System
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('multi-provider')}
                    variant="outline" 
                    className="w-full"
                  >
                    🔄 Multi-Provider Finance Service
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('automatic-fallback')}
                    variant="outline" 
                    className="w-full"
                  >
                    🔄 Automatic Fallback Logic Demo
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('data-consistency')}
                    variant="outline" 
                    className="w-full"
                  >
                    📊 Data Consistency & Quality Inspector
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('data-consistency-demo')}
                    variant="outline" 
                    className="w-full"
                  >
                    🔍 Data Consistency Validation System
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('proxy-demo')}
                    variant="outline" 
                    className="w-full"
                  >
                    🌐 CORS Proxy Server Monitor
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('missing-data-demo')}
                    variant="outline" 
                    className="w-full"
                  >
                    🔍 Missing Data Detection System
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('outlier-detection-demo')}
                    variant="outline" 
                    className="w-full"
                  >
                    🕵️ Outlier Detection System
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('unified-quality-dashboard')}
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Unified Quality Score Dashboard
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('cache-monitor-dashboard')}
                    variant="outline" 
                    className="w-full"
                  >
                    🚀 Memory Cache L1 Monitor
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('storage-health-dashboard')}
                    variant="outline" 
                    className="w-full"
                  >
                    🏥 Storage Health Monitor (L1+L2+L3)
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('automatic-cleanup-dashboard')}
                    variant="outline" 
                    className="w-full"
                  >
                    🧹 Automatic Cleanup System
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('storage-management-settings')}
                    variant="outline" 
                    className="w-full"
                  >
                    ⚙️ Storage Management Settings
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('returns-calculation-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    🧮 Returns Calculation Engine
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('risk-metrics-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    📊 Risk Metrics Engine
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('optimization-constraints-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    🎯 Optimization Constraints Engine
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('web-worker-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    ⚡ Web Workers Performance Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('data-chunking-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    🔄 Large Dataset Chunking Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('algorithm-optimization-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    🚀 Algorithm Optimization Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('progress-indicator-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    📊 Progress Indicators System Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('buy-hold-benchmark-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    📈 Buy & Hold Benchmark Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('equal-weight-strategy-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    ⚖️ Equal Weight Strategy Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('risk-parity-strategy-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    ⚖️ Risk Parity Strategy Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('momentum-strategy-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    🚀 Momentum Strategy Tester
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView('momentum-strategy-tester')}
                    variant="outline" 
                    className="w-full"
                  >
                    🚀 Momentum Strategy Tester
                  </Button>
                  
                  <Button variant="outline" className="w-full" disabled>
                    📊 Portfolio Optimizer (Coming Soon)
                  </Button>
                  
                  <Button variant="outline" className="w-full" disabled>
                    📈 Risk Analysis Dashboard (Coming Soon)
                  </Button>
                  
                  <Button variant="outline" className="w-full" disabled>
                    📄 Report Generator (Coming Soon)
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    ✅ Frontend: React + TypeScript + Tailwind<br/>
                    ✅ Backend: Node.js + Express (localhost:3001)<br/>
                    ✅ PyScript: Python + NumPy Integration<br/>
                    ✅ Error Boundary: Production-ready error handling<br/>
                    ✅ API Handler: Robust retry logic & notifications<br/>
                    ✅ Circuit Breaker: Advanced protection pattern<br/>
                    {envStatus.configured ? '✅' : '⚠️'} Environment: {envStatus.configured ? 'Configured' : 'Missing API Keys'}<br/>
                    🔄 Status: Environment Variables System
                  </p>
                  {!envStatus.configured && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">⚠️ Configuration Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Missing: {envStatus.missingKeys.join(', ')}<br/>
                        Create .env file from .env.example template
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground mt-8 text-center max-w-md text-sm">
              Professional-grade financial analysis tools built with modern web technologies
            </p>
          </div>
        )
    }
  }

  if (currentView !== 'home') {
    return (
      <LayoutManager>
        <NotificationProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-gray-50">
              <Header 
                currentView={currentView}
                onNavigate={(view) => setCurrentView(view as any)}
                onSettingsClick={() => console.log('Settings clicked')}
                user={null} // For now, no user authentication
              />
              <div className="container mx-auto py-8">
                {renderCurrentView()}
              </div>
            </div>
            <NotificationContainer />
          </ErrorBoundary>
        </NotificationProvider>
      </LayoutManager>
    )
  }

  return (
    <LayoutManager>
      <NotificationProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-background">
            <Header 
              currentView={currentView}
              onNavigate={(view) => setCurrentView(view as any)}
              onSettingsClick={() => console.log('Settings clicked')}
              user={null} // For now, no user authentication
            />
            {renderCurrentView()}
          </div>
          <NotificationContainer />
        </ErrorBoundary>
      </NotificationProvider>
    </LayoutManager>
  )
}

export default App 