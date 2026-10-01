import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';
import { ChamiloBreadcrumb, ChamiloActionBar, ChamiloHelpCallout, IconoCalendarioEscolar3D } from '../../components/chamilo';

interface EventoCalendario {
  id: string;
  dia: number;
  mes: number; // 0-11
  anio: number;
  titulo: string;
  tipo: 'mppe' | 'asueto' | 'administrativo' | 'pedagogico';
  descripcion?: string;
}

// Efemérides y eventos oficiales MPPE / Escolares de referencia
const EVENTOS_PREDETERMINADOS: EventoCalendario[] = [
  // Enero
  { id: '1', dia: 1, mes: 0, anio: 2026, titulo: 'Año Nuevo', tipo: 'asueto', descripcion: 'Feriado Nacional' },
  { id: '2', dia: 6, mes: 0, anio: 2026, titulo: 'Día de Reyes / Retorno a Clases', tipo: 'mppe', descripcion: 'Reinicio de actividades académicas del 2do Momento' },
  { id: '3', dia: 15, mes: 0, anio: 2026, titulo: 'Día del Maestro', tipo: 'pedagogico', descripcion: 'Homenaje al cuerpo docente venezolano' },
  // Febrero
  { id: '4', dia: 12, mes: 1, anio: 2026, titulo: 'Día de la Juventud', tipo: 'mppe', descripcion: 'Batalla de La Victoria' },
  { id: '5', dia: 16, mes: 1, anio: 2026, titulo: 'Lunes de Carnaval', tipo: 'asueto', descripcion: 'Asueto de Carnaval' },
  { id: '6', dia: 17, mes: 1, anio: 2026, titulo: 'Martes de Carnaval', tipo: 'asueto', descripcion: 'Asueto de Carnaval' },
  // Marzo
  { id: '7', dia: 8, mes: 2, anio: 2026, titulo: 'Día Internacional de la Mujer', tipo: 'pedagogico', descripcion: 'Actividades de formación y reconocimiento' },
  { id: '8', dia: 27, mes: 2, anio: 2026, titulo: 'Cierre 2do Momento Pedagógico', tipo: 'administrativo', descripcion: 'Carga de notas y evaluaciones de lapso' },
  // Abril
  { id: '9', dia: 2, mes: 3, anio: 2026, titulo: 'Jueves Santo', tipo: 'asueto', descripcion: 'Semana Santa' },
  { id: '10', dia: 3, mes: 3, anio: 2026, titulo: 'Viernes Santo', tipo: 'asueto', descripcion: 'Semana Santa' },
  { id: '11', dia: 19, mes: 3, anio: 2026, titulo: 'Proclamación de la Independencia', tipo: 'mppe', descripcion: '19 de Abril de 1810' },
  // Mayo
  { id: '12', dia: 1, mes: 4, anio: 2026, titulo: 'Día del Trabajador', tipo: 'asueto', descripcion: 'Feriado Nacional' },
  { id: '13', dia: 15, mes: 4, anio: 2026, titulo: 'Día de la Familia', tipo: 'pedagogico', descripcion: 'Encuentro pedagógico y comunitario' },
  // Junio
  { id: '14', dia: 24, mes: 5, anio: 2026, titulo: 'Batalla de Carabobo', tipo: 'mppe', descripcion: 'Día del Ejército Nacional' },
  // Julio
  { id: '15', dia: 5, mes: 6, anio: 2026, titulo: 'Firma del Acta de Independencia', tipo: 'mppe', descripcion: '5 de Julio de 1811' },
  { id: '16', dia: 15, mes: 6, anio: 2026, titulo: 'Cierre del Año Escolar', tipo: 'administrativo', descripcion: 'Actos de grado y entrega de boletines' },
  { id: '17', dia: 24, mes: 6, anio: 2026, titulo: 'Natalicio del Libertador Simón Bolívar', tipo: 'mppe', descripcion: 'Conmemoración del Padre de la Patria' },
  // Septiembre
  { id: '18', dia: 15, mes: 8, anio: 2026, titulo: 'Inicio de Actividades Administrativas', tipo: 'administrativo', descripcion: 'Reincorporación de directivos y docentes' },
  { id: '19', dia: 28, mes: 8, anio: 2026, titulo: 'Inicio de Clases Período 2026-2027', tipo: 'mppe', descripcion: 'Recepción de estudiantes a nivel nacional' },
  // Octubre
  { id: '20', dia: 12, mes: 9, anio: 2026, titulo: 'Día de la Resistencia Indígena', tipo: 'mppe', descripcion: 'Efeméride Nacional MPPE' },
  // Noviembre
  { id: '21', dia: 20, mes: 10, anio: 2026, titulo: 'Semana de la Educación Especial', tipo: 'pedagogico', descripcion: 'Muestras pedagógicas y de inclusión' },
  // Diciembre
  { id: '22', dia: 12, mes: 11, anio: 2026, titulo: 'Cierre 1er Momento Pedagógico', tipo: 'administrativo', descripcion: 'Evaluaciones y muestras navideñas' },
  { id: '23', dia: 25, mes: 11, anio: 2026, titulo: 'Navidad', tipo: 'asueto', descripcion: 'Asueto Navideño' }
];

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarioEscolar: React.FC = () => {
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();

  const fechaActual = new Date();
  const [mesActual, setMesActual] = useState(fechaActual.getMonth());
  const [anioActual, setAnioActual] = useState(fechaActual.getFullYear());
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'mppe' | 'asueto' | 'administrativo' | 'pedagogico'>('todos');
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);

  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const escuelaNombre = escuelaCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';

  // Cálculos de días del mes
  const primerDiaMes = new Date(anioActual, mesActual, 1).getDay();
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const diasEnMesAnterior = new Date(anioActual, mesActual, 0).getDate();

  // Filtrado de eventos del mes
  const eventosDelMes = EVENTOS_PREDETERMINADOS.filter(ev => {
    if (ev.mes !== mesActual) return false;
    if (filtroTipo !== 'todos' && ev.tipo !== filtroTipo) return false;
    return true;
  });

  const cambiarMes = (delta: number) => {
    let nuevoMes = mesActual + delta;
    let nuevoAnio = anioActual;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
    setEventoSeleccionado(null);
  };

  const irAHoy = () => {
    const hoy = new Date();
    setMesActual(hoy.getMonth());
    setAnioActual(hoy.getFullYear());
    setEventoSeleccionado(null);
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'mppe': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'MPPE Oficial' };
      case 'asueto': return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Asueto / Feriado' };
      case 'administrativo': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Administrativo' };
      case 'pedagogico': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Pedagógico' };
      default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: 'General' };
    }
  };

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* 1. Miga de pan Chamilo */}
      <ChamiloBreadcrumb
        items={[
          { label: 'Dirección y Sistema', url: '/categoria/Dirección%20y%20Sistema', icon: 'bi-building-gear' },
          { label: 'Calendario Escolar', icon: 'bi-calendar-range-fill' }
        ]}
      />

      {/* 2. Cabecera Institucional 3D */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden rounded-4 animate__animated animate__fadeInDown" 
        style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #9d174d 100%)' }}
      >
        <div className="burbuja-3d burbuja-1"></div>
        <div className="burbuja-3d burbuja-2"></div>
        <div className="burbuja-3d burbuja-3"></div>
        <div className="row align-items-center position-relative z-1 g-4">
          <div className="col-12 col-md-auto text-center text-md-start">
            <div 
              className="bg-white shadow-lg d-inline-flex align-items-center justify-content-center p-2 rounded-4"
              style={{ width: '100px', height: '100px', border: '3px solid rgba(255,255,255,0.85)' }}
            >
              <IconoCalendarioEscolar3D size={65} color="#ec4899" />
            </div>
          </div>

          <div className="col-12 col-md text-center text-md-start">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
              <span className="badge bg-white text-primary px-3 py-1.5 shadow-sm fw-bold rounded-pill badge-3d">
                <i className="bi bi-calendar-check-fill me-1"></i> CRONOGRAMA OFICIAL MPPE
              </span>
              <span className="badge bg-white bg-opacity-25 text-white px-2.5 py-1.5 rounded-pill small fw-bold">
                <i className="bi bi-building me-1"></i>{escuelaNombre}
              </span>
            </div>

            <h1 className="fw-bolder mb-1 text-white" style={{ fontSize: 'calc(1.6rem + 0.8vw)', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Calendario Escolar Oficial
            </h1>

            <p className="mb-0 text-white text-opacity-90 fs-5 fw-semibold" style={{ maxWidth: '820px' }}>
              Planificación académica, efemérides patrias, semanas pedagógicas, cierres de lapsos y asuetos oficiales del MPPE.
            </p>
          </div>

          <div className="col-12 col-lg-auto text-end d-flex align-items-center justify-content-center justify-content-lg-end gap-2 flex-wrap">
            <button 
              type="button" 
              onClick={irAHoy}
              className="btn btn-white bg-white text-dark rounded-pill px-3.5 py-2 fw-bold shadow-sm"
            >
              <i className="bi bi-calendar-event me-1"></i> Ir a Hoy
            </button>
            <button 
              type="button" 
              onClick={() => window.print()}
              className="btn btn-light rounded-pill px-3.5 py-2 fw-bold shadow-sm text-dark"
            >
              <i className="bi bi-printer-fill me-1"></i> Imprimir Mes
            </button>
            <img 
              src={`/assets/img/logo_${localStorage.getItem('sigae_escuela_codigo') || 'sb'}.png`} 
              alt="Logo Escuela" 
              className="logo-escuela-banner d-none d-xl-block ms-2"
              style={{ maxHeight: '100px' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
            />
          </div>
        </div>
      </div>

      {/* 3. Guía Zoe & Max */}
      <ChamiloHelpCallout
        title="Orientación sobre el Calendario Escolar"
        storageKey="cat_Calendario_Escolar"
        initialOpen={false}
      >
        <p className="mb-1 text-dark small">
          En este módulo puedes visualizar y consultar el cronograma del año escolar activo, identificando semanas formativas, efemérides y fechas de evaluación pedagógica.
        </p>
        <small className="text-muted d-block">
          <i className="bi bi-info-circle me-1"></i> Selecciona cualquier evento del calendario para conocer los detalles pedagógicos y normativos.
        </small>
      </ChamiloHelpCallout>

      {/* 4. Barra de Acciones y Filtros */}
      <ChamiloActionBar
        title={`${NOMBRES_MESES[mesActual]} ${anioActual}`}
        subtitle={`${eventosDelMes.length} eventos planificados este mes`}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Selector de Mes */}
          <div className="btn-group shadow-xs rounded-pill" role="group">
            <button 
              type="button" 
              onClick={() => cambiarMes(-1)} 
              className="btn btn-sm btn-light border px-3"
              title="Mes Anterior"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <span className="btn btn-sm btn-white border-top border-bottom px-3 fw-bold text-dark">
              {NOMBRES_MESES[mesActual]} {anioActual}
            </span>
            <button 
              type="button" 
              onClick={() => cambiarMes(1)} 
              className="btn btn-sm btn-light border px-3"
              title="Mes Siguiente"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          {/* Filtro por Categoría */}
          <div className="btn-group btn-group-sm shadow-xs rounded-pill p-1 bg-light border" role="group">
            <button 
              type="button" 
              onClick={() => setFiltroTipo('todos')}
              className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold ${filtroTipo === 'todos' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
            >
              Todos
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroTipo('mppe')}
              className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold ${filtroTipo === 'mppe' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
            >
              MPPE
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroTipo('asueto')}
              className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold ${filtroTipo === 'asueto' ? 'btn-danger text-white' : 'btn-light text-muted'}`}
            >
              Asuetos
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroTipo('administrativo')}
              className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold ${filtroTipo === 'administrativo' ? 'btn-warning text-dark' : 'btn-light text-muted'}`}
            >
              Administrativos
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroTipo('pedagogico')}
              className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold ${filtroTipo === 'pedagogico' ? 'btn-success text-white' : 'btn-light text-muted'}`}
            >
              Pedagógicos
            </button>
          </div>
        </div>
      </ChamiloActionBar>

      {/* 5. Vista del Calendario Interactivo */}
      <div className="row g-4 mt-1">
        {/* Grilla Calendario */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            {/* Cabecera Días de Semana */}
            <div className="cal-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {DIAS_SEMANA.map((dia, idx) => (
                <div key={idx} className="cal-header-cell py-2.5 text-center fw-bold small text-muted bg-light">
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del Mes */}
            <div className="cal-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {/* Días del mes anterior para rellenar */}
              {Array.from({ length: primerDiaMes }).map((_, idx) => {
                const diaNum = diasEnMesAnterior - primerDiaMes + idx + 1;
                return (
                  <div key={`ant-${idx}`} className="cal-cell dia-distinto p-2 text-muted" style={{ minHeight: '90px', background: '#f8fafc', opacity: 0.5 }}>
                    <span className="cal-dia-numero small text-muted">{diaNum}</span>
                  </div>
                );
              })}

              {/* Días del mes actual */}
              {Array.from({ length: diasEnMes }).map((_, idx) => {
                const diaNum = idx + 1;
                const esHoy = fechaActual.getDate() === diaNum && fechaActual.getMonth() === mesActual && fechaActual.getFullYear() === anioActual;
                const eventosDelDia = eventosDelMes.filter(e => e.dia === diaNum);

                return (
                  <div 
                    key={`dia-${diaNum}`} 
                    className={`cal-cell p-2 position-relative border-bottom border-end transition-all ${esHoy ? 'bg-primary bg-opacity-10' : 'bg-white'}`}
                    style={{ minHeight: '90px', cursor: eventosDelDia.length > 0 ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (eventosDelDia.length > 0) {
                        setEventoSeleccionado(eventosDelDia[0]);
                      }
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className={`cal-dia-numero fw-bold small ${esHoy ? 'badge bg-primary text-white rounded-circle p-1' : 'text-dark'}`} style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {diaNum}
                      </span>
                      {eventosDelDia.length > 0 && (
                        <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary extra-small px-1.5 py-0.5">
                          {eventosDelDia.length}
                        </span>
                      )}
                    </div>

                    {/* Chips de Eventos */}
                    <div className="d-flex flex-column gap-1">
                      {eventosDelDia.map(ev => {
                        const styleInfo = getBadgeColor(ev.tipo);
                        return (
                          <div
                            key={ev.id}
                            className="cal-evento-chip p-1 rounded-2 text-truncate extra-small fw-semibold transition-all hover-efecto"
                            style={{
                              backgroundColor: styleInfo.bg,
                              color: styleInfo.text,
                              border: `1px solid ${styleInfo.border}`,
                              fontSize: '0.68rem',
                              lineHeight: 1.2
                            }}
                            title={`${ev.titulo} (${styleInfo.label})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventoSeleccionado(ev);
                            }}
                          >
                            <span className="me-1">●</span>
                            <span>{ev.titulo}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel Lateral: Lista y Detalle de Eventos */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-card-checklist text-primary"></i>
              <span>Eventos de {NOMBRES_MESES[mesActual]}</span>
            </h5>

            {eventoSeleccionado ? (
              <div className="card border p-3 rounded-4 mb-4 bg-light shadow-xs animate__animated animate__fadeIn">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span 
                    className="badge rounded-pill px-2.5 py-1 extra-small fw-bold"
                    style={{
                      backgroundColor: getBadgeColor(eventoSeleccionado.tipo).bg,
                      color: getBadgeColor(eventoSeleccionado.tipo).text,
                      border: `1px solid ${getBadgeColor(eventoSeleccionado.tipo).border}`
                    }}
                  >
                    {getBadgeColor(eventoSeleccionado.tipo).label}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setEventoSeleccionado(null)} 
                    className="btn btn-sm btn-link text-muted p-0"
                    title="Cerrar detalle"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <h6 className="fw-bold text-dark mb-1">
                  {eventoSeleccionado.titulo}
                </h6>
                <div className="extra-small text-muted mb-2">
                  <i className="bi bi-calendar3 me-1"></i>
                  {eventoSeleccionado.dia} de {NOMBRES_MESES[eventoSeleccionado.mes]} de {eventoSeleccionado.anio}
                </div>
                <p className="text-secondary small mb-0">
                  {eventoSeleccionado.descripcion || 'Sin observaciones adicionales para esta fecha.'}
                </p>
              </div>
            ) : (
              <div className="alert alert-info border-0 rounded-3 small py-2 mb-3">
                <i className="bi bi-info-circle-fill me-1"></i> Pulsa en cualquier día o evento para ver los detalles.
              </div>
            )}

            {/* Listado Cronológico de Eventos del Mes */}
            <div className="overflow-auto pe-1" style={{ maxHeight: '420px' }}>
              {eventosDelMes.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-calendar-x fs-2 d-block mb-1 text-muted"></i>
                  No hay eventos registrados para este mes con el filtro actual.
                </div>
              ) : (
                eventosDelMes.map(ev => {
                  const styleInfo = getBadgeColor(ev.tipo);
                  const isSelected = eventoSeleccionado?.id === ev.id;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setEventoSeleccionado(ev)}
                      className={`p-2.5 rounded-3 border mb-2 cursor-pointer transition-all hover-efecto ${isSelected ? 'border-primary bg-primary bg-opacity-10 shadow-xs' : 'bg-white'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge rounded-pill bg-light text-dark border small fw-bold px-2 py-0.5">
                          Día {ev.dia}
                        </span>
                        <span 
                          className="badge rounded-pill extra-small px-2 py-0.5"
                          style={{ backgroundColor: styleInfo.bg, color: styleInfo.text, border: `1px solid ${styleInfo.border}` }}
                        >
                          {styleInfo.label}
                        </span>
                      </div>
                      <div className="fw-bold text-dark small text-truncate">
                        {ev.titulo}
                      </div>
                      {ev.descripcion && (
                        <div className="text-muted extra-small text-truncate">
                          {ev.descripcion}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-auto pt-3 border-top text-center">
              <button 
                type="button" 
                onClick={() => navigate('/categoria/Dirección%20y%20Sistema/Configuración%20Escolar')}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold small w-100"
              >
                <i className="bi bi-sliders me-1"></i> Ver Períodos y Lapsos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
