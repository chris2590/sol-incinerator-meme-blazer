// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css'; // Make sure styles.css exists in /src

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No root element found in public/index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
