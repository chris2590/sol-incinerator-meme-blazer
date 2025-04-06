// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css'; // Ensure the CSS file is in the same folder

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No root element found in public/index.html");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
