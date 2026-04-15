import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Service worker registration commented for initial stability
/*
try {
  const { registerSW } = await import('virtual:pwa-register');
  registerSW({ immediate: true });
} catch (e) {
  console.log('PWA not supported or plugin missing');
}
*/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
