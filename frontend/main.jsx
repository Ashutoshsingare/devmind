/**
 * DevMind — React Entry Point
 *
 * Mounts the App component into the #root div.
 * Imports App.css (the single source of truth for all design tokens).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
