import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import './styles/globals.css'

// A custom header turns every cross-origin request into a CORS preflight.
// Keep the ngrok workaround opt-in so normal local and production traffic
// remains a simple request and cannot be blocked by an unnecessary header.
if (import.meta.env.VITE_NGROK_BYPASS === 'true') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (resource, config = {}) => originalFetch(resource, {
    ...config,
    headers: {
      ...config.headers,
      'ngrok-skip-browser-warning': '69420',
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
