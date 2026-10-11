import React from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, FolderSync } from 'lucide-react';

/**
 * 🛡️ DropBrief ErrorBoundary
 *
 * Chráni aplikáciu pred "White Screen of Death".
 * V prípade neočakávanej runtime chyby zobrazí prémiovú Obsidian Dark obrazovku
 * s možnosťou obnovenia stránky, návratu na úvod a diagnostickým reportom.
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
          background: 'var(--bg-base, #07090e)',
          color: 'var(--text-primary, #f1f5f9)',
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
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
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
            background: 'rgba(13, 18, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Header Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg, 14px)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
            }}>
              <AlertTriangle size={28} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-primary-light, #818cf8)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
              <FolderSync size={13} /> DropBrief Safe Mode
            </div>

            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              marginBottom: '10px'
            }}>
              Nastala neočakávaná chyba
            </h1>

            <p style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary, #94a3b8)',
              lineHeight: 1.6,
              marginBottom: '26px'
            }}>
              Aplikácia bezpečne zachytila chybu pri zobrazení. Žiadne vaše nahrané súbory ani dáta v databáze neboli stratené.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary btn-pill"
                style={{ padding: '9px 20px', fontSize: '0.85rem', gap: '8px' }}
              >
                <RefreshCw size={15} /> Obnoviť stránku
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-secondary btn-pill"
                style={{ padding: '9px 18px', fontSize: '0.85rem', gap: '7px' }}
              >
                <Home size={15} /> Domov
              </button>
            </div>

            {/* Technical Diagnostics Accordion */}
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary, #64748b)',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  {this.state.showDetails ? 'Skryť technické detaily' : 'Zobraziť technické detaily'}
                </button>

                <button
                  type="button"
                  onClick={this.handleCopyError}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: 'var(--text-secondary, #94a3b8)',
                    fontSize: '0.73rem',
                    cursor: 'pointer',
                    padding: '3px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Skopírovať chybu pre podporu"
                >
                  {this.state.copied ? <Check size={11} color="var(--success, #10b981)" /> : <Copy size={11} />}
                  {this.state.copied ? 'Skopírované!' : 'Kopírovať chybu'}
                </button>
              </div>

              {this.state.showDetails && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.72rem',
                  color: '#f87171',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                  lineHeight: 1.5
                }}>
                  <strong>{this.state.error?.toString()}</strong>
                  {this.state.errorInfo?.componentStack && (
                    <pre style={{ marginTop: '6px', color: '#94a3b8', fontSize: '0.68rem', whiteSpace: 'pre-wrap' }}>
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
