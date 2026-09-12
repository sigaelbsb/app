import React from 'react';

export interface WizardStep {
  id: string | number;
  label?: string;
  title?: string;
  icon?: string;
  description?: string;
}

export interface ChamiloStepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowStepClick?: boolean;
}

export const ChamiloStepWizard: React.FC<ChamiloStepWizardProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowStepClick = false
}) => {
  const currentStepTitle = steps[currentStep]?.title || steps[currentStep]?.label || '';

  return (
    <div className="chamilo-wizard-container animate__animated animate__fadeIn">
      {/* Resumen móvil para pantallas pequeñas */}
      <div className="d-flex d-md-none justify-content-between align-items-center mb-2 pb-2 border-bottom">
        <span className="badge bg-primary text-white px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>
          Paso {currentStep + 1} de {steps.length}
        </span>
        <span className="fw-bold text-dark text-truncate ms-2" style={{ fontSize: '0.85rem' }}>
          {currentStepTitle}
        </span>
      </div>

      {/* Stepper horizontal completo */}
      <div className="chamilo-wizard-steps">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isClickable = allowStepClick && (isCompleted || isActive);
          const stepText = step.title || step.label || `Paso ${idx + 1}`;

          return (
            <div
              key={step.id}
              className={`chamilo-wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => isClickable && onStepClick && onStepClick(idx)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              <div className="chamilo-step-circle">
                {isCompleted ? (
                  <i className="bi bi-check-lg text-white fs-5"></i>
                ) : step.icon ? (
                  <i className={`bi ${step.icon}`}></i>
                ) : (
                  idx + 1
                )}
              </div>
              <div className="chamilo-step-label text-truncate" title={stepText}>
                {stepText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
