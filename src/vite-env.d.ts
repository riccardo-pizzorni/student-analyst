/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY_ALPHA_VANTAGE: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_OFFLINE_MODE: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_YAHOO_FINANCE_ENABLED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 