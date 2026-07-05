// Replace your current main.jsx with this:
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { initErrorLogger } from './lib/errorLogger'

initErrorLogger();

// Suppress console in production for security
if (import.meta.env.PROD) {
  const noop = () => {};
  ['log', 'debug', 'info', 'warn', 'table', 'trace', 'dir', 'group', 'groupEnd', 'time', 'timeEnd'].forEach(m => {
    console[m] = noop;
  });
  // Keep error so crash reporting still works
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)