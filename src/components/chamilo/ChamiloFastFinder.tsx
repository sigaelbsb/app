import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModulosSistema } from '../../pages/CategoryDashboard';
import { usePermisos } from '../../hooks/usePermisos';

interface ChamiloFastFinderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToolIndexItem {
  categoria: string;
  submodulo: string;
  icono: string;
  categoriaIcono: string;
  color: string;
  desc?: string;
  url: string;
}

export const ChamiloFastFinder: React.FC<ChamiloFastFinderProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela } = usePermisos();
  const [busqueda, setBusqueda] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generar el índice de todas las herramientas disponibles y con permisos
  const toolsIndex: ToolIndexItem[] = React.useMemo(() => {
    const list: ToolIndexItem[] = [];
    Object.entries(ModulosSistema).forEach(([catNombre, catData]: [string, any]) => {
      (catData.items || []).forEach((item: any) => {
        let tieneAcceso = false;
        if (item.vista === 'Gestión de Colectivos') {
          tieneAcceso = tienePermisoEnEscuela('sb', item.vista, 'ver') || tienePermisoEnEscuela('lb', item.vista, 'ver');
        } else {
          tieneAcceso = tienePermiso(item.vista, 'ver');
        }

        if (tieneAcceso) {
          list.push({
            categoria: catNombre,
            submodulo: item.vista,
            icono: item.icono || catData.icono || 'bi-app',
            categoriaIcono: catData.icono || 'bi-folder',
            color: catData.color || '#0066FF',
            desc: item.desc || catData.desc,
            url: `/categoria/${encodeURIComponent(catNombre)}/${encodeURIComponent(item.vista)}`
          });
        }
      });
    });
    return list;
  }, [tienePermiso, tienePermisoEnEscuela]);

  const resultados = React.useMemo(() => {
    if (!busqueda.trim()) return toolsIndex.slice(0, 10);
    const q = busqueda.toLowerCase().trim();
    return toolsIndex.filter(t => 
      t.submodulo.toLowerCase().includes(q) ||
      t.categoria.toLowerCase().includes(q) ||
      (t.desc || '').toLowerCase().includes(q)
    );
  }, [busqueda, toolsIndex]);

  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [busqueda]);

  // Manejo de teclas de flechas, enter y escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < resultados.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : resultados.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultados[selectedIndex]) {
        ejecutarNavegacion(resultados[selectedIndex].url);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const ejecutarNavegacion = (url: string) => {
    navigate(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="chamilo-fast-finder-overlay" onClick={onClose}>
      <div 
        className="chamilo-fast-finder-modal animate__animated animate__zoomIn animate__faster"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Encabezado con Input de Búsqueda */}
        <div className="chamilo-fast-finder-header">
          <i className="bi bi-search text-primary fs-5"></i>
          <input
            ref={inputRef}
            type="text"
            className="chamilo-fast-finder-input"
            placeholder="Buscar herramienta, trámite o submódulo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button 
              type="button" 
              className="btn btn-sm btn-light rounded-circle p-1"
              onClick={() => setBusqueda('')}
            >
              <i className="bi bi-x fs-5"></i>
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 d-none d-md-inline" 
            onClick={onClose}
            style={{ fontSize: '0.75rem' }}
          >
            ESC
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="chamilo-fast-finder-body">
          {resultados.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-search-heart fs-2 d-block mb-2 text-secondary opacity-50"></i>
              <p className="mb-0 fw-bold">No se encontraron herramientas</p>
              <small>Prueba buscando con otra palabra clave como "estudiante", "baremo" o "constancias".</small>
            </div>
          ) : (
            <div>
              <div className="text-muted extra-small fw-bold px-2 py-1 mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                {busqueda ? `Resultados (${resultados.length})` : 'Herramientas Recomendadas'}
              </div>
              {resultados.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={`${item.categoria}-${item.submodulo}`}
                    className={`chamilo-fast-finder-item ${isSelected ? 'active' : ''}`}
                    onClick={() => ejecutarNavegacion(item.url)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="d-flex align-items-center gap-3 overflow-hidden">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '38px',
                          height: '38px',
                          backgroundColor: `${item.color}15`,
                          color: item.color
                        }}
                      >
                        <i className={`bi ${item.icono} fs-5`}></i>
                      </div>
                      <div className="overflow-hidden">
                        <div className="fw-bold chamilo-ff-title text-truncate" style={{ fontSize: '0.92rem' }}>
                          {item.submodulo}
                        </div>
                        <small className="text-muted text-truncate d-block" style={{ fontSize: '0.75rem' }}>
                          <span className="fw-semibold text-primary">{item.categoria}</span>
                          {item.desc ? ` • ${item.desc}` : ''}
                        </small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1 ms-2 flex-shrink-0">
                      <i className="bi bi-arrow-right-short text-muted fs-4"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con Tips para Móvil y Desktop */}
        <div className="p-2.5 px-3 bg-light border-top d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
          <span className="d-none d-md-inline">
            <kbd className="bg-white text-dark border shadow-xs px-1.5 py-0.5 rounded">↑</kbd> <kbd className="bg-white text-dark border shadow-xs px-1.5 py-0.5 rounded">↓</kbd> para navegar • <kbd className="bg-white text-dark border shadow-xs px-1.5 py-0.5 rounded">Enter</kbd> para abrir
          </span>
          <span className="d-inline d-md-none">
            <i className="bi bi-phone me-1"></i> Toca para abrir cualquier herramienta
          </span>
          <span className="badge bg-white text-dark border shadow-xs">SIGAE Fast Tool Finder</span>
        </div>
      </div>
    </div>
  );
};
