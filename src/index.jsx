import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Runtime error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#ff4444', backgroundColor: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, color: '#ff6666' }}>⚠️ Sovereign Tools Launch Exception</h2>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>An error occurred while mounting the React engine:</p>
          <div style={{ background: '#000', padding: 12, borderRadius: 8, border: '1px solid #333', fontSize: 11, wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginBottom: 20 }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ width: '100%', padding: '14px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 13 }}
          >
            Clear Storage & Restart App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
