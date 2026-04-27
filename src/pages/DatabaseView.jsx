// src/pages/DatabaseView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Download, Plus, Users, LayoutList, Settings, X, Trash2, Filter, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn, formatDateToDDMMYYYY } from '../utils/helpers';

// MODAL PARA GESTIONAR ESTADOS DINÁMICOS (ADAPTADO A MÓVIL)
function StatusManagerModal({ statuses, onSave, onClose }) {
  const [localStatuses, setLocalStatuses] = useState(statuses);

  const handleAdd = () => {
      setLocalStatuses([...localStatuses, { id: 'status_' + Date.now(), label: 'NUEVO ESTADO', color: '#94a3b8' }]);
  };
  const updateStatus = (id, field, value) => {
      setLocalStatuses(localStatuses.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const removeStatus = (id) => {
      setLocalStatuses(localStatuses.filter(s => s.id !== id));
  };

  // FUNCIONES PARA ORDENAR
  const moveUp = (index) => {
      if (index === 0) return;
      const newStatuses = [...localStatuses];
      [newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]];
      setLocalStatuses(newStatuses);
  };

  const moveDown = (index) => {
      if (index === localStatuses.length - 1) return;
      const newStatuses = [...localStatuses];
      [newStatuses[index + 1], newStatuses[index]] = [newStatuses[index], newStatuses[index + 1]];
      setLocalStatuses(newStatuses);
  };

  return (
    // Se añade p-4 al contenedor principal para que haya margen en los bordes del móvil
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
       {/* w-full max-w-[450px] asegura que sea responsive, max-h-[90vh] flex flex-col asegura un scroll interno si hay muchos elementos */}
       <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 md:p-6 w-full max-w-[450px] shadow-2xl flex flex-col max-h-[90vh]">
           
           <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Gestionar Estados</h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X className="w-5 h-5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"/>
              </button>
           </div>
           
           <p className="text-xs text-zinc-500 mb-4 shrink-0">Añade, edita colores, renombra u ordena las fases de tu embudo de ventas.</p>
           
           {/* Contenedor con Scroll para los estados */}
           <div className="space-y-3 mb-6 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {localStatuses.map((status, index) => (
                  <div key={status.id} className="flex gap-2 md:gap-3 items-center bg-zinc-50 dark:bg-zinc-950 p-2 md:p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors focus-within:border-emerald-500">
                      
                      {/* Controles de Ordenación (Más fáciles de tocar en móvil) */}
                      <div className="flex flex-col border-r border-zinc-200 dark:border-zinc-700 pr-2 mr-1">
                          <button 
                              disabled={index === 0} 
                              onClick={() => moveUp(index)} 
                              className="p-1 md:p-0.5 text-zinc-400 hover:text-emerald-500 disabled:opacity-20 disabled:hover:text-zinc-400 transition-colors"
                              title="Subir"
                          >
                              <ChevronUp className="w-5 h-5 md:w-4 md:h-4" />
                          </button>
                          <button 
                              disabled={index === localStatuses.length - 1} 
                              onClick={() => moveDown(index)} 
                              className="p-1 md:p-0.5 text-zinc-400 hover:text-emerald-500 disabled:opacity-20 disabled:hover:text-zinc-400 transition-colors"
                              title="Bajar"
                          >
                              <ChevronDown className="w-5 h-5 md:w-4 md:h-4" />
                          </button>
                      </div>

                      <input type="color" value={status.color} onChange={e => updateStatus(status.id, 'color', e.target.value)} className="w-8 h-8 rounded cursor-pointer shrink-0 border-0 p-0 bg-transparent" title="Color del estado" />
                      
                      <input 
                          type="text" 
                          value={status.label} 
                          onChange={e => updateStatus(status.id, 'label', e.target.value)} 
                          className="flex-1 min-w-0 bg-transparent border-b border-transparent focus:border-emerald-500 px-1 md:px-2 py-1 text-sm md:text-base font-bold text-zinc-800 dark:text-white outline-none" 
                          placeholder="Nombre del estado" 
                      />

                        {/* NUEVO: Botón para incluir/excluir de la barra de progreso */}
                        <button 
                            onClick={() => updateStatus(status.id, 'showInPipeline', status.showInPipeline === false ? true : false)}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                status.showInPipeline !== false 
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" 
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                            )}
                            title={status.showInPipeline !== false ? "Incluido en progreso" : "Excluido de progreso"}
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                      
                      <button onClick={() => removeStatus(status.id)} className="text-red-500 hover:text-red-600 p-2 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0" title="Eliminar estado">
                          <Trash2 className="w-5 h-5 md:w-4 md:h-4"/>
                      </button>
                  </div>
              ))}
           </div>

           {/* Botones Fijos Abajo */}
           <div className="shrink-0 space-y-3 mt-auto">
               <Button variant="outline" onClick={handleAdd} className="w-full justify-center border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                   + Añadir Nuevo Estado
               </Button>
               <Button variant="neon" onClick={() => onSave(localStatuses)} className="w-full justify-center py-3">
                   Guardar Cambios
               </Button>
           </div>

       </div>
    </div>
  );
}

// AÑADE ESTO JUSTO AQUÍ, ANTES DEL EXPORT DEFAULT
const STORAGE_KEY_COLS = 'fotoesport_visible_columns';
const STORAGE_KEY_VIEW = 'fotoesport_active_view';


export default function DatabaseView({ clubs, onSelect, onNewClub, statuses, onUpdateStatuses, userProfile }) {

    
    // 2. Creamos claves ÚNICAS para cada usuario usando su ID.
    const userId = userProfile?.id || userProfile?.uid || 'default';
    const STORAGE_KEY_VIEW = `fotoesport_view_${userId}`;
    const STORAGE_KEY_COLS = `fotoesport_cols_${userId}`;

    // 3. Cargamos la vista de la memoria (si no hay, por defecto 'detailed')
    const [activeView, setActiveView] = useState(() => {
        return localStorage.getItem(STORAGE_KEY_VIEW) || 'detailed';
    });
    
    // 4. Cargamos las columnas de la memoria (si no hay, por defecto el pack completo)
    const [visibleCols, setVisibleCols] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_COLS);
        return saved ? JSON.parse(saved) : ['club', 'category', 'players', 'leadScore', 'teams', 'status', 'lastContact', 'recommendedDate'];
    });

    const [showStatusModal, setShowStatusModal] = useState(false);

    // 5. AUTOGUARDADO MÁGICO: Cada vez que 'activeView' cambie, se guarda en el disco duro.
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_VIEW, activeView);
    }, [activeView, STORAGE_KEY_VIEW]);

    // 6. AUTOGUARDADO MÁGICO: Cada vez que 'visibleCols' cambie, se guarda en el disco duro.
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(visibleCols));
    }, [visibleCols, STORAGE_KEY_COLS]);

    const applyView = (viewKey) => {
      setActiveView(viewKey);
      localStorage.setItem(STORAGE_KEY_VIEW, viewKey); // <-- GUARDAR VISTA

      let newCols = [];
      if (viewKey === 'detailed') {
          newCols = ['club', 'category', 'players', 'leadScore', 'teams', 'status', 'lastContact', 'recommendedDate'];
      } else if (viewKey === 'progress') {
          newCols = ['club', 'pipeline', 'lastContact', 'recommendedDate', 'lastNote'];
      }
      
      setVisibleCols(newCols);
      localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(newCols)); // <-- GUARDAR COLUMNAS
  };
  
  // ESTADOS DE FILTRO Y ORDEN
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // ESTADOS PARA FILTROS DE COLUMNAS TIPO EXCEL
  const [columnFilters, setColumnFilters] = useState({}); // Guarda: { category: ['Alevín', 'Cadete'], status: ['status_1'] }
  const [openFilterCol, setOpenFilterCol] = useState(null); // Guarda el ID de la columna cuyo menú está abierto

  // Función auxiliar para obtener el valor correcto de cualquier columna
  const getCellValue = (club, colId) => {
      if (colId === 'club') return club.name || '';
      if (colId === 'category') return club.category || 'Sin categoría';
      if (colId === 'players') return club.estimatedPlayers || 0;
      if (colId === 'leadScore') return club.leadScore || 0;
      if (colId === 'teams') return club.totalTeams || 0;
      if (colId === 'status') return club.status || '';
      if (colId === 'lastNote') return club.lastNote || 'Sin registros';
      if (colId === 'pipeline') return club.status || ''; // <-- AÑADIR ESTA LÍNEA
      if (colId === 'lastContact') return club.lastContactDate || '';
      if (colId === 'recommendedDate') return club.recommendedContactDate || '';
      return '';
  };

  // Columnas Separadas
  const columns = [
    { id: 'club', label: 'Nombre del Club', flex: 3 },
    { id: 'category', label: 'Categoría', flex: 2 },
    { id: 'players', label: 'Jugadores', flex: 1 },
    { id: 'leadScore', label: 'Scoring', flex: 1 },
    { id: 'teams', label: 'Equipos (Tot/Base)', flex: 2 },
    { id: 'status', label: 'Estado (Badge)', flex: 2 },
    { id: 'pipeline', label: 'Progreso Comercial', flex: 3 },
    { id: 'lastNote', label: 'Última Conversación', flex: 4 },
    { id: 'lastContact', label: 'Último Contacto', flex: 2 },
    { id: 'recommendedDate', label: 'Próx. Contacto', flex: 2 },
  ];

  const toggleColFilterValue = (colId, value) => {
      setColumnFilters(prev => {
          const current = prev[colId] || [];
          if (current.includes(value)) {
              return { ...prev, [colId]: current.filter(v => v !== value) };
          } else {
              return { ...prev, [colId]: [...current, value] };
          }
      });
  };

  // Lógica de Filtrado y Ordenación combinada
  const processedClubs = useMemo(() => {
      // 1. Filtrar usando el menú de columnas
      let filtered = clubs.filter(club => {
          let matchColumnFilters = true;
          Object.entries(columnFilters).forEach(([colId, activeValues]) => {
              if (activeValues.length === 0) return;
              const stringValue = String(getCellValue(club, colId)); 
              if (!activeValues.includes(stringValue)) {
                  matchColumnFilters = false;
              }
          });
          return matchColumnFilters;
      });

      // 2. Ordenar
      filtered.sort((a, b) => {
          const sortKey = sortConfig.key === 'club' ? 'name' : sortConfig.key; 
          let valA = sortKey === 'name' ? (a.name || '') : getCellValue(a, sortKey);
          let valB = sortKey === 'name' ? (b.name || '') : getCellValue(b, sortKey);

          // Lógica específica para ordenar fechas cronológicamente
          if (sortKey === 'lastContact' || sortKey === 'recommendedDate') {
              
              const parseDateForSorting = (dateVal) => {
                  if (!dateVal) return 0;
                  
                  const strVal = String(dateVal);
                  const separator = strVal.includes('/') ? '/' : (strVal.includes('-') ? '-' : null);
                  
                  // Si tiene formato DD-MM-YYYY o DD/MM/YYYY lo damos la vuelta para JavaScript
                  if (separator) {
                      const parts = strVal.split(separator);
                      if (parts.length === 3 && parts[0].length <= 2) {
                          const isoStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                          const time = new Date(isoStr).getTime();
                          if (!isNaN(time)) return time;
                      }
                  }
                  
                  // Fallback normal por si la fecha ya está en YYYY-MM-DD o ISO
                  return new Date(strVal).getTime();
              };

              const timeA = parseDateForSorting(valA);
              const timeB = parseDateForSorting(valB);
              
              const finalA = isNaN(timeA) ? 0 : timeA;
              const finalB = isNaN(timeB) ? 0 : timeB;

              // Enviar siempre los valores vacíos (0) al final de la tabla, sin importar si es ASC o DESC
              if (finalA === 0 && finalB !== 0) return 1;
              if (finalB === 0 && finalA !== 0) return -1;

              if (finalA < finalB) return sortConfig.direction === 'asc' ? -1 : 1;
              if (finalA > finalB) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          }

          // Lógica por defecto para texto y números
          if (typeof valA === 'string' && typeof valB === 'string') {
              valA = valA.toLowerCase();
              valB = valB.toLowerCase();
          }

          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });

      return filtered;
  }, [clubs, columnFilters, sortConfig]);

  const getStatusBadge = (statusId) => {
    const config = statuses.find(s => s.id === statusId) || statuses[0];
    if (!config) return null;
    return (
        <span style={{ backgroundColor: `${config.color}15`, color: config.color, borderColor: `${config.color}30` }} className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border inline-block">
            {config.label}
        </span>
    );
  };

  const toggleColumn = (colId) => {
      let updatedCols;
      if (visibleCols.includes(colId)) {
          updatedCols = visibleCols.filter(id => id !== colId);
      } else {
          updatedCols = [...visibleCols, colId];
      }
      
      setVisibleCols(updatedCols);
      localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(updatedCols)); // <-- GUARDAR CAMBIO MANUAL
  };

  const handleSaveStatuses = (newStatuses) => {
      onUpdateStatuses(newStatuses);
      setShowStatusModal(false);
  };

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-6 overflow-hidden flex flex-col relative">
      
      {/* CABECERA TOP */}
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        
        {/* PARTE IZQUIERDA: Títulos y Tabs */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Cartera de Clubes</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
              <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-lg w-fit">
                  <button 
                      onClick={() => applyView('detailed')} 
                      className={cn(
                          "px-3 py-1.5 text-xs font-bold rounded-md transition-all", 
                          activeView === 'detailed' 
                              ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" 
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      )}
                  >
                      Vista Detallada
                  </button>
                  <button 
                      onClick={() => applyView('progress')} 
                      className={cn(
                          "px-3 py-1.5 text-xs font-bold rounded-md transition-all", 
                          activeView === 'progress' 
                              ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" 
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      )}
                  >
                      Vista Progreso
                  </button>
              </div>
          </div>
        </div>
        
        {/* PARTE DERECHA: Botonera original intacta */}
        <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
           <Button variant="outline" onClick={() => setShowStatusModal(true)} title="Configurar Estados">
               <Settings className="w-4 h-4 text-zinc-500" />
           </Button>

           <div className="relative group z-[60]">
              <Button variant="outline" className="flex items-center gap-2">
                 <LayoutList className="w-4 h-4" /> <span className="hidden sm:inline">Columnas</span>
              </Button>
              <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] p-2 flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {columns.map(col => (
                    <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                        <input type="checkbox" checked={visibleCols.includes(col.id)} onChange={() => toggleColumn(col.id)} className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 bg-transparent" />
                        {col.label}
                    </label>
                 ))}
              </div>
           </div>

           <Button variant="outline" className="hidden sm:flex"><Download className="w-4 h-4 mr-2"/> Exportar CSV</Button>
           <Button variant="neon" onClick={onNewClub} className="flex-1 sm:flex-none justify-center"><Plus className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Nuevo Club</span><span className="sm:hidden">Nuevo</span></Button>
        </div>
      </div>
      
      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col relative z-10">
        
        <div className="overflow-x-auto flex-1 flex flex-col custom-scrollbar">
          <div className="min-w-[900px] flex-1 flex flex-col">
            
            {/* CABECERAS CON FILTROS Y ORDEN TIPO EXCEL */}
            <div className="flex bg-zinc-100 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 p-3 text-xs font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider relative z-20">
               {columns.map(col => {
                   if (!visibleCols.includes(col.id)) return null;

                   const uniqueValues = Array.from(new Set(clubs.map(c => String(getCellValue(c, col.id))).filter(val => val && val !== '0'))).sort();

                   const isFilterOpen = openFilterCol === col.id;
                   const hasActiveFilters = columnFilters[col.id]?.length > 0;
                   const isSorted = sortConfig.key === col.id || (col.id === 'club' && sortConfig.key === 'name');

                    return (
                       <div key={`header-${col.id}`} style={{ flex: col.flex }} className="relative flex items-center gap-1.5 group">
                           <span>{col.label}</span>
                           
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   setOpenFilterCol(isFilterOpen ? null : col.id);
                               }}
                               className={cn(
                                   "p-1 rounded transition-colors md:opacity-0 group-hover:opacity-100", 
                                   (hasActiveFilters || isSorted || isFilterOpen) && "opacity-100",
                                   hasActiveFilters ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                               )}
                           >
                               <ChevronDown className="w-3.5 h-3.5" />
                           </button>

                           {isFilterOpen && (
                               <>
                                   <div className="fixed inset-0 z-[60]" onClick={() => setOpenFilterCol(null)}></div>
                                   
                                   <div className={cn(
                                       "absolute top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-[70] p-2 max-h-80 flex flex-col font-normal text-zinc-700 dark:text-zinc-300 normal-case tracking-normal",
                                       ['status', 'lastContact', 'recommendedDate'].includes(col.id) ? "right-0" : "left-0"
                                   )}>
                                       
                                       <div className="flex flex-col gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
                                           <button 
                                               onClick={() => { setSortConfig({ key: col.id === 'club' ? 'name' : col.id, direction: 'asc' }); setOpenFilterCol(null); }} 
                                               className="text-left text-xs p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded flex items-center gap-2"
                                           >
                                               <ArrowUp className="w-3.5 h-3.5 text-zinc-400" /> Ordenar Ascendente
                                           </button>
                                           <button 
                                               onClick={() => { setSortConfig({ key: col.id === 'club' ? 'name' : col.id, direction: 'desc' }); setOpenFilterCol(null); }} 
                                               className="text-left text-xs p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded flex items-center gap-2"
                                           >
                                               <ArrowDown className="w-3.5 h-3.5 text-zinc-400" /> Ordenar Descendente
                                           </button>
                                       </div>

                                       <div className="text-xs mb-2 flex justify-between items-center px-1">
                                           <span className="font-bold">Filtros</span>
                                           {hasActiveFilters && (
                                               <button onClick={() => setColumnFilters(prev => ({ ...prev, [col.id]: [] }))} className="text-[10px] text-red-500 hover:text-red-600 font-medium">
                                                   Limpiar
                                               </button>
                                           )}
                                       </div>
                                       
                                       <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
                                           {uniqueValues.length === 0 ? (
                                               <span className="text-xs text-zinc-500 italic px-1">Sin datos</span>
                                           ) : (
                                               uniqueValues.map(val => {
                                                   const isSelected = columnFilters[col.id]?.includes(val);
                                                   const displayLabel = col.id === 'status' 
                                                       ? (statuses?.find(s => s.id === val)?.label || val) 
                                                       : val;

                                                   return (
                                                       <label key={val} className="flex items-center gap-2 p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer text-xs group">
                                                           <input 
                                                               type="checkbox" 
                                                               checked={isSelected || false}
                                                               onChange={() => toggleColFilterValue(col.id, val)}
                                                               className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 bg-transparent"
                                                           />
                                                           <span className="truncate">{displayLabel}</span>
                                                       </label>
                                                   );
                                               })
                                           )}
                                       </div>
                                   </div>
                               </>
                           )}
                       </div>
                   );
               })}
            </div>

            <div className="overflow-y-auto flex-1 pb-10 custom-scrollbar" onClick={() => setOpenFilterCol(null)}>
               {processedClubs.map(club => {
             const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || { name: 'Sin Contacto' };
             const phoneToShow = mainContact.phone || club.genericPhone || '-';
             const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
             
            return (
               <div key={club.id} onClick={() => onSelect(club)} className="flex items-center p-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  
                  {visibleCols.includes('club') && (
                      <div style={{ flex: columns.find(c=>c.id==='club').flex }} className="pr-2 truncate">
                          <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              {club.name}
                              {needsAttention && <span className="ml-2 w-2 h-2 rounded-full bg-red-500 inline-block" title="Requiere atención"></span>}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">{club.address || 'Sin ubicación registrada'}</div>
                      </div>
                  )}

                  {visibleCols.includes('category') && (
                      <div style={{ flex: columns.find(c=>c.id==='category').flex }} className="pr-2 truncate">
                         <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                             <Users className="w-4 h-4 text-zinc-400 flex-shrink-0"/> 
                             {club.category || '-'}
                         </div>
                      </div>
                  )}

                  {visibleCols.includes('players') && (
                      <div style={{ flex: columns.find(c=>c.id==='players').flex }} className="pr-2">
                         <div className="text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 inline-block px-2 py-0.5 rounded">
                             {club.estimatedPlayers || '-'}
                         </div>
                      </div>
                  )}

                  {visibleCols.includes('leadScore') && (
                      <div style={{ flex: columns.find(c=>c.id==='leadScore').flex }} className="pr-2">
                          <div className="flex gap-0.5" title={`${club.leadScore || 0} de 5 estrellas`}>
                              {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={cn("w-4 h-4", i < (club.leadScore || 0) ? "text-amber-400 fill-amber-400" : "text-zinc-300 dark:text-zinc-800 fill-transparent")} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                              ))}
                          </div>
                      </div>
                  )}

                  {visibleCols.includes('teams') && (
                      <div style={{ flex: columns.find(c=>c.id==='teams').flex }} className="pr-2">
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">{club.totalTeams || '0'}</span> Totales
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                  {club.baseTeams ? (
                                      <><span className="font-medium text-zinc-500 dark:text-zinc-400">{club.baseTeams}</span> Base</>
                                  ) : (
                                      'Sin base listada'
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  {visibleCols.includes('status') && (
                      <div style={{ flex: columns.find(c=>c.id==='status').flex }} className="pr-2">
                          {getStatusBadge(club.status)}
                      </div>
                  )}

                  {/* COLUMNA: BARRA DE PROGRESO VISUAL */}
                  {visibleCols.includes('pipeline') && (
                      <div style={{ flex: columns.find(c=>c.id==='pipeline').flex }} className="pr-6">
                          <div className="flex flex-col gap-2 w-full">
                              {(() => {
                                  // Filtramos los estados de la barra y buscamos el estado actual
                                  const activeStatuses = statuses.filter(s => s.showInPipeline !== false);
                                  const currentStatusObj = statuses.find(s => s.id === club.status);
                                  
                                  // ¿Está este estado excluido de la barra de progreso?
                                  const isExcluded = currentStatusObj?.showInPipeline === false;

                                  // CASO 1: EL ESTADO ESTÁ EXCLUIDO (Ej: Perdido, Pausado, No Interesa)
                                  if (isExcluded || !currentStatusObj) {
                                      return (
                                          <>
                                              {/* Barra única de color atenuado indicando que no está en flujo */}
                                              <div className="flex w-full h-2.5">
                                                  <div 
                                                      className="h-full flex-1 rounded-full transition-all duration-500 shadow-sm opacity-40"
                                                      style={{ backgroundColor: currentStatusObj?.color || '#94a3b8' }}
                                                  />
                                              </div>
                                              <div className="flex justify-between items-center px-0.5">
                                                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentStatusObj?.color || '#94a3b8' }}>
                                                      {currentStatusObj?.label || 'Sin estado'}
                                                  </span>
                                                  <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
                                                      Fuera de Embudo
                                                  </span>
                                              </div>
                                          </>
                                      );
                                  }

                                  // CASO 2: EL ESTADO ES ACTIVO (Renderizado normal de la barra)
                                  const currentStatusIdx = activeStatuses.findIndex(st => st.id === club.status);
                                  
                                  return (
                                      <>
                                          <div className="flex gap-1.5 w-full h-2.5">
                                              {activeStatuses.map((s, idx) => {
                                                  const isActive = idx <= currentStatusIdx;
                                                  const isCurrent = idx === currentStatusIdx;
                                                  
                                                  return (
                                                      <div 
                                                          key={s.id} 
                                                          className={cn(
                                                              "h-full flex-1 rounded-full transition-all duration-500 shadow-sm",
                                                              !isActive && "bg-zinc-200 dark:bg-zinc-800"
                                                          )}
                                                          style={{ 
                                                              backgroundColor: isActive ? s.color : undefined,
                                                              opacity: isCurrent ? 1 : (isActive ? 0.4 : 1),
                                                              transform: isCurrent ? 'scaleY(1.2)' : 'scaleY(1)'
                                                          }}
                                                          title={s.label}
                                                      />
                                                  );
                                              })}
                                          </div>
                                          <div className="flex justify-between items-center px-0.5">
                                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                                                  {currentStatusObj.label}
                                              </span>
                                              <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                  PASO {currentStatusIdx + 1} / {activeStatuses.length}
                                              </span>
                                          </div>
                                      </>
                                  );
                              })()}
                          </div>
                      </div>
                  )}

                    {/* COLUMNA: NOTA DE LA ÚLTIMA CONVERSACIÓN */}
                    {visibleCols.includes('lastNote') && (
                        <div style={{ flex: columns.find(c=>c.id==='lastNote').flex }} className="pr-4">
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 flex items-start gap-2 group-hover:border-emerald-500/30 transition-colors">
                                <MessageSquare className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-2 leading-relaxed">
                                    {club.lastNote || "No hay notas registradas..."}
                                </p>
                            </div>
                        </div>
                    )}

                  {visibleCols.includes('lastContact') && (
                      <div style={{ flex: columns.find(c=>c.id==='lastContact').flex }} className="pr-2">
                         <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                             {formatDateToDDMMYYYY(club.lastContactDate) || '-'}
                         </div>
                      </div>
                  )}

                    {visibleCols.includes('recommendedDate') && (
                        <div style={{ flex: columns.find(c=>c.id==='recommendedDate').flex }} className="pr-4 text-right">
                            {club.recommendedContactDate ? (
                                <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                                    <Sparkles className="w-3 h-3"/>
                                    {formatDateToDDMMYYYY(club.recommendedContactDate)}
                                </div>
                            ) : (
                                <span className="text-xs text-zinc-400">-</span>
                            )}
                        </div>
                    )}
               </div>
             );
           })}

            {processedClubs.length === 0 && (
               <div className="flex flex-col items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
                   <Filter className="w-8 h-8 mb-3 opacity-20" />
                   <p className="text-sm">No se encontraron clubes con los filtros seleccionados.</p>
               </div>
           )}
            </div>
          </div>
        </div>
      </div>

      {showStatusModal && <StatusManagerModal statuses={statuses} onSave={handleSaveStatuses} onClose={() => setShowStatusModal(false)} />}
    </div>
  );
}