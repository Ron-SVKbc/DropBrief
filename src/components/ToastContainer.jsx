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
      maxWidth: '380px',
      width: '100%'
    }}>
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              background: '#111728',
              border: `1px solid ${isSuccess ? 'var(--success-border)' : isWarning ? 'var(--warning-border)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {isSuccess && <CheckCircle2 size={18} color="var(--success)" />}
              {isWarning && <AlertCircle size={18} color="var(--warning)" />}
              {!isSuccess && !isWarning && <Info size={18} color="var(--accent-primary)" />}
            </div>

            <div style={{ flex: 1 }}>
              {toast.title && (
                <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}>
                  {toast.title}
                </strong>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
