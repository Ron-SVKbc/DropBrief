import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              background: 'rgba(13, 18, 30, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${isSuccess ? 'var(--success-border)' : isWarning ? 'var(--warning-border)' : 'var(--border-active)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), var(--shadow-inner-glow)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: 'var(--text-primary)',
              pointerEvents: 'auto',
              transition: 'var(--transition)'
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {isSuccess && <CheckCircle2 size={20} color="var(--success)" />}
              {isWarning && <AlertCircle size={20} color="var(--warning)" />}
              {!isSuccess && !isWarning && <Info size={20} color="var(--accent-primary)" />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '2px', fontWeight: 700 }}>
                  {toast.title}
                </strong>
              )}
              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45, display: 'block' }}>
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Zavrieť notifikáciu"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
