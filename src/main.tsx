import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { monitoring } from './utils/monitoring'

// Initialize monitoring system
monitoring.init()

// Professional error handling for the entry point
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has a div with id="root"')
}

// Initialize React application
createRoot(rootElement).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
) 