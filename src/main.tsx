import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AppProviders } from './context/AppProviders'
import './index.css'

// Register the service worker only in production builds (PWA / offline).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true, onOfflineReady() {} })
    })
    .catch(() => {
      /* PWA is optional; never block the app on SW registration. */
    })
}

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found.')

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
