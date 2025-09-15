import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 找到 public/index.html 裡的 <div id="root">
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);