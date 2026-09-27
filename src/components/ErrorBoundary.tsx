import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SIGAE ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({ errorInfo });

    // Limpieza de estado residual (por ejemplo, modales que dejaron overflow oculto en body)
    try {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((b) => b.remove());
    } catch (e) {
      // Ignorar fallos de limpieza
    }
  }

  public handleReset = () => {
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public handleGoHome = () => {
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Navegación segura sin romper Capacitor o rutas relativas
    if (window.location.hash) {
      window.location.hash = '#/';
    } else {
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  public handleReload = () => {
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              {this.props.fallbackTitle || 'Se produjo un problema al cargar esta pantalla'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              La aplicación ha protegido tu sesión para evitar cierres inesperados. Puedes reintentar la acción o volver al inicio.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Reintentar
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Ir al Inicio
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  padding: '0.625rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Recargar app
              </button>
            </div>

            {this.state.error && (
              <details style={{ textAlign: 'left', marginTop: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                <summary style={{ cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>Detalle técnico (para soporte)</summary>
                <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', color: '#ef4444', fontFamily: 'monospace' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
