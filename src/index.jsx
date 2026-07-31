import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  }
} catch (err) {
  const errBox = document.getElementById('debug-error');
  if (errBox) {
    errBox.style.display = 'block';
    errBox.innerText += '\n[MOUNT ERROR]: ' + err.message;
  }
}
