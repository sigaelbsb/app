import React, { useState } from 'react';

export interface ChamiloAnnouncementProps {
  id: string;
  title: string;
  message: string;
  date?: string;
  author?: string;
  priority?: 'info' | 'important' | 'urgent' | 'success';
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
}

export const ChamiloAnnouncementCard: React.FC<ChamiloAnnouncementProps> = ({
  id,
  title,
  message,
  date,
  author = 'Dirección Institucional',
  priority = 'info',
  actionLabel,
  onAction,
  dismissible = true
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem(`sigae_announcement_${id}`) === 'dismissed';
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`sigae_announcement_${id}`, 'dismissed');
  };

  const getPriorityBadge = () => {
    switch (priority) {
      case 'urgent':
        return <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 fw-bold">🚨 Urgente</span>;
      case 'important':
        return <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 fw-bold">⚠️ Importante</span>;
      case 'success':
        return <span className="badge bg-success text-white rounded-pill px-2.5 py-1 fw-bold">✅ Noticia Oficial</span>;
      default:
        return <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-bold">📢 Comunicado</span>;
    }
  };

  return (
    <div className={`chamilo-announcement-card priority-${priority} animate__animated animate__fadeIn`}>
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {getPriorityBadge()}
          <span className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{title}</span>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {date && <small className="text-muted extra-small"><i className="bi bi-clock-history me-1"></i>{date}</small>}
          {dismissible && (
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 ms-1 text-decoration-none"
              onClick={handleDismiss}
              title="Descartar anuncio"
            >
              <i className="bi bi-x-circle fs-6"></i>
            </button>
          )}
        </div>
      </div>

      <p className="mb-2 text-dark text-opacity-90" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
        {message}
      </p>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1 border-top border-light">
        <small className="text-muted extra-small">
          <i className="bi bi-bank me-1 text-primary"></i> Emitido por: <strong>{author}</strong>
        </small>

        {actionLabel && onAction && (
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-bold shadow-xs d-inline-flex align-items-center gap-1 ms-auto"
            style={{ fontSize: '0.78rem' }}
            onClick={onAction}
          >
            <span>{actionLabel}</span>
            <i className="bi bi-arrow-right-short fs-6"></i>
          </button>
        )}
      </div>
    </div>
  );
};
