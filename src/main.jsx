import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// --- SILENCIADOR DE AVISOS DE GOOGLE MAPS ---
const originalWarn = console.warn;
const originalError = console.error;

const silenceGoogleMaps = (...args) => {
  const text = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (text.includes('google.maps.places.Autocomplete is not available to new customers')) return true;
  return false;
};

console.warn = (...args) => {
  if (silenceGoogleMaps(...args)) return;
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  if (silenceGoogleMaps(...args)) return;
  originalError.apply(console, args);
};
// --------------------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>,
)