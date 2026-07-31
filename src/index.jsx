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
    console.error("React mount error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#ff4444', backgroundColor: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 16, marginBottom: 10, color: '#ff6666' }}>⚠️ React Render Exception</h2>
          <div style={{ background: '#000', padding: 12, borderRadius: 8, border: '1px solid #333', fontSize: 11, wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginBottom: 20 }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ width: '100%', padding: '12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}
          >
            Clear Storage & Reload
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
