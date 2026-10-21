import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Application Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '40px auto', background: '#fff', borderRadius: '24px', border: '2px solid #e11d48', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#e11d48', margin: '0 0 12px', fontSize: '22px' }}>Application Render Error Caught</h2>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>An unexpected error occurred while rendering the page:</p>
          <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '12px', overflowX: 'auto', fontSize: '13px', margin: '16px 0' }}>
            {this.state.error?.stack || String(this.state.error)}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '10px 20px', background: '#013323', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear Local Storage & Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

// Fade the brand splash out once the app has painted (kept visible at least ~900ms so it never flashes).
const splash = document.getElementById('arb-splash');
if (splash) {
  const started = performance.now();
  const hide = () => {
    const wait = Math.max(0, 900 - (performance.now() - started));
    setTimeout(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 600);
    }, wait);
  };
  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide, { once: true });
}

