import React from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, FolderSync } from 'lucide-react';

/**
 * 🛡️ DropBrief ErrorBoundary
 *
 * Protects the application from "White Screen of Death".
 * In case of an unexpected runtime error, it displays a premium Obsidian Dark screen
 * with options to reload the page, return to home, and copy a diagnostic report.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 [DropBrief ErrorBoundary] Caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = window.location.origin;
  };

  handleCopyError = () => {
    const errorText = `DropBrief Error Report:
Error: ${this.state.error?.toString() || 'Unknown error'}
Stack: ${this.state.error?.stack || ''}
Component Stack: ${this.state.errorInfo?.componentStack || ''}
URL: ${window.location.href}
Time: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-base, #f8fafc)',
          color: 'var(--text-primary, #0f172a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'var(--font-sans, "Plus Jakarta Sans", sans-serif)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(37, 99, 235, 0.04) 50%, transparent 70%)',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            filter: 'blur(60px)'
          }} />

          <div className="glass-card" style={{
            maxWidth: '560px',
            width: '100%',
            padding: '36px 32px',
            borderRadius: 'var(--radius-xl, 18px)',
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Header Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg, 14px)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.12)'
            }} aria-hidden="true">
              <AlertTriangle size={28} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-primary-light, #1d4ed8)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
              <FolderSync size={13} aria-hidden="true" /> DropBrief Safe Mode
            </div>

            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary, #0f172a)',
              marginBottom: '10px'
            }}>
              An unexpected error occurred
            </h1>

            <p style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary, #334155)',
              lineHeight: 1.6,
              marginBottom: '26px'
            }}>
              The application safely intercepted a render error. None of your uploaded files or database data were lost.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary btn-pill"
                style={{ padding: '9px 20px', fontSize: '0.85rem', gap: '8px' }}
                aria-label="Reload page"
              >
                <RefreshCw size={15} aria-hidden="true" /> Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-secondary btn-pill"
                style={{ padding: '9px 18px', fontSize: '0.85rem', gap: '7px' }}
                aria-label="Go to home page"
              >
                <Home size={15} aria-hidden="true" /> Home
              </button>
            </div>

            {/* Technical Diagnostics Accordion */}
            <div style={{
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              paddingTop: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  aria-expanded={this.state.showDetails}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary-light, #1d4ed8)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  {this.state.showDetails ? 'Hide technical details' : 'Show technical details'}
                </button>

                <button
                  type="button"
                  onClick={this.handleCopyError}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: 'var(--text-secondary, #334155)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Copy error for support"
                  aria-label="Copy technical error to clipboard"
                >
                  {this.state.copied ? <Check size={12} color="var(--success-light, #047857)" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                  {this.state.copied ? 'Copied!' : 'Copy error'}
                </button>
              </div>

              {this.state.showDetails && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.74rem',
                  color: '#b91c1c',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                  lineHeight: 1.5
                }}>
                  <strong>{this.state.error?.toString()}</strong>
                  {this.state.errorInfo?.componentStack && (
                    <pre style={{ marginTop: '6px', color: '#334155', fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
