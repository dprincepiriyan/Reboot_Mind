import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initStorage } from './lib/storage'
import './index.css'

// Hydrate persisted values (token, server URL) before first render so
// synchronous reads work on native, where Preferences is async.
initStorage().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
})
