import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface MoodleBreadcrumbProps {
  category?: string;
  currentModule?: string;
  sectionCode?: string;
}

export const MoodleBreadcrumb: React.FC<MoodleBreadcrumbProps> = ({
  category = 'Organización Escolar',
  currentModule,
  sectionCode = 'ORG-101'
}) => {
  const navigate = useNavigate();

  return (
    <div className="moodle-breadcrumb-wrapper d-flex justify-content-between align-items-center flex-wrap mb-3 p-2 bg-white rounded-3 border shadow-xs">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-0 align-items-center" style={{ fontSize: '0.85rem' }}>
          <li className="breadcrumb-item">
            <span 
              onClick={() => navigate('/')} 
              className="text-muted fw-semibold text-decoration-none hover-efecto"
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-house-door-fill text-warning me-1"></i>Área personal
            </span>
          </li>
          <li className="breadcrumb-item">
            <span 
              onClick={() => navigate(`/categoria/${encodeURIComponent(category)}`)}
              className="text-muted fw-semibold text-decoration-none hover-efecto"
              style={{ cursor: 'pointer' }}
            >
              {category}
            </span>
          </li>
          {currentModule && (
            <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
              {currentModule}
            </li>
          )}
        </ol>
      </nav>

      <div className="d-flex align-items-center gap-2">
        <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-30 rounded-pill px-2.5 py-1 extra-small fw-bold">
          <i className="bi bi-mortarboard-fill text-warning me-1"></i>Moodle LMS 4.x
        </span>
        <span className="badge bg-light text-muted border rounded-pill px-2 py-1 extra-small">
          Cód: {sectionCode}
        </span>
      </div>
    </div>
  );
};
