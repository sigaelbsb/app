import React, { useState } from 'react';

export interface ChamiloHelpCalloutProps {
  title: string;
  children?: React.ReactNode;
  content?: string | React.ReactNode;
  id?: string;
  icon?: string;
  initialOpen?: boolean;
  storageKey?: string;
}

export const ChamiloHelpCallout: React.FC<ChamiloHelpCalloutProps> = ({
  title,
  children,
  content,
  id,
  icon = 'bi-info-circle-fill',
  initialOpen = false,
  storageKey
}) => {
  const effectiveKey = storageKey || id;

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (effectiveKey) {
      const saved = localStorage.getItem(`sigae_help_${effectiveKey}`);
      if (saved !== null) return saved === 'true';
    }
    return initialOpen;
  });

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (effectiveKey) {
      localStorage.setItem(`sigae_help_${effectiveKey}`, String(next));
    }
  };

  const bodyContent = children || (
    typeof content === 'string' ? (
      <p className="mb-0 text-muted" style={{ lineHeight: '1.5' }}>{content}</p>
    ) : content
  );

  return (
    <div className="chamilo-callout-help animate__animated animate__fadeIn mb-3">
      <div className="chamilo-callout-header" onClick={toggle} style={{ cursor: 'pointer' }}>
        <h6 className="chamilo-callout-title mb-0 d-flex align-items-center gap-2">
          <i className={`bi ${icon} text-primary fs-5`}></i>
          <span className="fw-bold">{title}</span>
        </h6>
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 text-muted"
          style={{ fontSize: '0.85rem' }}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <span><i className="bi bi-chevron-up me-1"></i>Ocultar guía</span>
          ) : (
            <span><i className="bi bi-chevron-down me-1"></i>Ver guía de ayuda</span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="chamilo-callout-body animate__animated animate__fadeIn pt-2">
          {bodyContent}
        </div>
      )}
    </div>
  );
};
