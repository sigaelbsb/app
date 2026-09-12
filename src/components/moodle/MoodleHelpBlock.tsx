import React, { useState } from 'react';

export interface MoodleHelpBlockProps {
  id?: string;
  title: string;
  content: string;
  icon?: string;
}

export const MoodleHelpBlock: React.FC<MoodleHelpBlockProps> = ({
  id = 'moodle_help',
  title,
  content,
  icon = 'bi-info-circle-fill'
}) => {
  const [open, setOpen] = useState(true);

  return (
    <div id={id} className="card border-0 shadow-sm rounded-4 mb-4 bg-white border-start border-4" style={{ borderColor: '#F98012' }}>
      <div className="p-3.5 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2.5">
          <div className="rounded-circle p-2 bg-warning bg-opacity-15 text-dark d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            <i className={`bi ${icon} text-warning fs-5`}></i>
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-0">{title}</h6>
            <span className="extra-small text-muted">Bloque de Orientación Pedagógica Moodle LMS</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="btn btn-sm btn-light rounded-circle text-muted"
          style={{ width: '32px', height: '32px', padding: 0 }}
          title={open ? 'Plegar bloque' : 'Desplegar bloque'}
        >
          <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
        </button>
      </div>

      {open && (
        <div className="px-4 pb-3.5 pt-0">
          <hr className="my-1.5 opacity-25" />
          <p className="mb-0 text-muted small mt-2" style={{ lineHeight: '1.5' }}>
            {content}
          </p>
        </div>
      )}
    </div>
  );
};
