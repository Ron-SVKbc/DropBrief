import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div 
      role="region"
      aria-live="polite"
      aria-label="System notifications"
      style={{
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
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            className="animate-fade-in"
            style={{
              background: 'rgba(15, 23, 42, 0.97)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: `1px solid ${isSuccess ? 'rgba(5, 150, 105, 0.4)' : isWarning ? 'rgba(180, 83, 9, 0.4)' : 'rgba(37, 99, 235, 0.4)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#f8fafc',
              pointerEvents: 'auto',
              transition: 'var(--transition)'
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {isSuccess && <CheckCircle2 size={20} color="var(--success)" aria-hidden="true" />}
              {isWarning && <AlertCircle size={20} color="var(--warning)" aria-hidden="true" />}
              {!isSuccess && !isWarning && <Info size={20} color="var(--accent-primary)" aria-hidden="true" />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '2px', fontWeight: 700, color: '#ffffff' }}>
                  {toast.title}
                </strong>
              )}
              <span style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.45, display: 'block' }}>
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Close notification"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
