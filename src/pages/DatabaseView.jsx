// src/pages/DatabaseView.jsx
import React, { useState, useMemo } from 'react';
import { Download, Plus, Users, LayoutList, Settings, X, Trash2, Filter, ArrowUpDown, ChevronDown, Check, Sparkles } from 'lucide-react'; 
import { Button } from '../components/ui/Button';
import { cn } from '../utils/helpers';

// MODAL PARA GESTIONAR ESTADOS DINÁMICOS
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
       <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-[400px] shadow-2xl">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Gestionar Estados</h3>
              <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"/></button>
           </div>
           <p className="text-xs text-zinc-500 mb-4">Añade, edita colores o renombra las fases de tu embudo de ventas.</p>
           
           <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
              {localStatuses.map(status => (
                  <div key={status.id} className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <input type="color" value={status.color} onChange={e => updateStatus(status.id, 'color', e.target.value)} className="w-8 h-8 rounded cursor-pointer shrink-0 border-0 p-0 bg-transparent" />
                      <input type="text" value={status.label} onChange={e => updateStatus(status.id, 'label', e.target.value)} className="flex-1 bg-transparent border-b border-transparent focus:border-emerald-500 px-2 py-1 text-sm font-bold text-zinc-800 dark:text-white outline-none" placeholder="Nombre del estado" />
                      <button onClick={() => removeStatus(status.id)} className="text-red-500 hover:text-red-600 p-2 rounded hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4"/></button>
                  </div>
              ))}
           </div>
           <Button variant="outline" onClick={handleAdd} className="w-full mb-4">+ Añadir Nuevo Estado</Button>
           <Button variant="neon" onClick={() => onSave(localStatuses)} className="w-full">Guardar Cambios</Button>
       </div>
    </div>
  );
}


export default function DatabaseView({ clubs, onSelect, onNewClub, statuses, onUpdateStatuses }) {
  const [visibleCols, setVisibleCols] = useState(['club', 'category', 'players', 'teams', 'status', 'lastContact', 'recommendedDate']);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // ESTADOS DE FILTRO Y ORDEN
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // ESTADOS PARA ABRIR/CERRAR LOS MENÚS DESPLEGABLES
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Columnas Separadas
  const columns = [
    { id: 'club', label: 'Nombre del Club', flex: 3 },
    { id: 'category', label: 'Categoría', flex: 2 },
    { id: 'players', label: 'Jugadores', flex: 1 },
    { id: 'teams', label: 'Equipos (Tot/Base)', flex: 2 },
    { id: 'status', label: 'Estado', flex: 2 },
    { id: 'lastContact', label: 'Último Contacto', flex: 2 },
    { id: 'recommendedDate', label: 'Recomendado (IA)', flex: 2 },
  ];

  // Opciones de Ordenación
  const sortOptions = [
    { value: 'name-asc', label: 'Nombre (A-Z)' },
    { value: 'name-desc', label: 'Nombre (Z-A)' },
    { value: 'players-desc', label: 'Jugadores (Mayor a Menor)' },
    { value: 'players-asc', label: 'Jugadores (Menor a Mayor)' },
    { value: 'status-asc', label: 'Estado (A-Z)' },
    { value: 'status-desc', label: 'Estado (Z-A)' },
    { value: 'category-asc', label: 'Categoría (A-Z)' },
    { value: 'category-desc', label: 'Categoría (Z-A)' }
  ];

  // Extraer las categorías únicas
  const uniqueCategories = useMemo(() => {
      const cats = new Set(clubs.map(c => c.category).filter(Boolean));
      return Array.from(cats).sort();
  }, [clubs]);

  // Lógica de Filtrado y Ordenación combinada
  const processedClubs = useMemo(() => {
      // 1. Filtrar
      let filtered = clubs.filter(club => {
          const matchStatus = statusFilter === 'all' || club.status === statusFilter;
          const matchCategory = categoryFilter === 'all' || club.category === categoryFilter;
          return matchStatus && matchCategory;
      });

      // 2. Ordenar
      filtered.sort((a, b) => {
          if (sortConfig.key === 'players') {
              const numA = a.estimatedPlayers || 0;
              const numB = b.estimatedPlayers || 0;
              return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
          }

          let aValue = '', bValue = '';
          if (sortConfig.key === 'name') {
              aValue = a.name?.toLowerCase() || '';
              bValue = b.name?.toLowerCase() || '';
          } else if (sortConfig.key === 'category') {
              aValue = a.category?.toLowerCase() || '';
              bValue = b.category?.toLowerCase() || '';
          } else if (sortConfig.key === 'status') {
              aValue = statuses?.find(s => s.id === a.status)?.label?.toLowerCase() || a.status || '';
              bValue = statuses?.find(s => s.id === b.status)?.label?.toLowerCase() || b.status || '';
          }

          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });

      return filtered;
  }, [clubs, statusFilter, categoryFilter, sortConfig, statuses]);


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
    if (visibleCols.includes(colId)) setVisibleCols(visibleCols.filter(id => id !== colId));
    else setVisibleCols([...visibleCols, colId]);
  };

  const handleSaveStatuses = (newStatuses) => {
      onUpdateStatuses(newStatuses);
      setShowStatusModal(false);
  };

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-6 overflow-hidden flex flex-col relative">
      
      {/* CABECERA TOP */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Cartera de Clubes</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gestiona la base de datos de equipos.</p>
        </div>
        
        <div className="flex gap-3 items-center">
           <Button variant="outline" onClick={() => setShowStatusModal(true)} title="Configurar Estados">
               <Settings className="w-4 h-4 text-zinc-500" />
           </Button>

           <div className="relative group">
              <Button variant="outline" className="flex items-center gap-2">
                 <LayoutList className="w-4 h-4" /> Columnas
              </Button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 flex flex-col gap-1">
                 {columns.map(col => (
                    <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                        <input type="checkbox" checked={visibleCols.includes(col.id)} onChange={() => toggleColumn(col.id)} className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 bg-transparent" />
                        {col.label}
                    </label>
                 ))}
              </div>
           </div>

           <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Exportar CSV</Button>
           <Button variant="neon" onClick={onNewClub}><Plus className="w-4 h-4 mr-2"/> Nuevo Club</Button>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS DE FILTRO Y ORDEN VISUAL */}
      <div className="flex flex-wrap gap-4 mb-4 items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative z-40">
         
         <div className="flex items-center gap-2 pl-2">
             <Filter className="w-4 h-4 text-zinc-400" />
             <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Filtros:</span>
         </div>
         
         {/* 1. SELECTOR VISUAL DE ESTADO */}
         <div className="relative">
             <button
                 onClick={() => { setIsStatusFilterOpen(!isStatusFilterOpen); setIsCategoryFilterOpen(false); setIsSortOpen(false); }}
                 className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-xs rounded-lg px-3 py-1.5 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-w-[160px]"
             >
                 <div className="flex items-center gap-2">
                     {statusFilter === 'all' ? (
                         <span>Todos los estados</span>
                     ) : (
                         <>
                             <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: statuses?.find(s => s.id === statusFilter)?.color }}></span>
                             <span className="truncate max-w-[100px]">{statuses?.find(s => s.id === statusFilter)?.label}</span>
                         </>
                     )}
                 </div>
                 <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform", isStatusFilterOpen && "rotate-180")} />
             </button>

             {isStatusFilterOpen && (
                 <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                     <button
                         onClick={() => { setStatusFilter('all'); setIsStatusFilterOpen(false); }}
                         className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                     >
                         <span className={cn("flex-1 text-left font-medium", statusFilter === 'all' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300")}>Todos los estados</span>
                         {statusFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                     </button>
                     <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2 my-1"></div>
                     {statuses?.map(s => (
                         <button
                             key={s.id}
                             onClick={() => { setStatusFilter(s.id); setIsStatusFilterOpen(false); }}
                             className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                         >
                             <span className="w-2 h-2 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: s.color }}></span>
                             <span className={cn("flex-1 text-left font-medium truncate", statusFilter === s.id ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400")}>{s.label}</span>
                             {statusFilter === s.id && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />}
                         </button>
                     ))}
                 </div>
             )}
         </div>

         {/* 2. SELECTOR VISUAL DE CATEGORÍA */}
         <div className="relative">
             <button
                 onClick={() => { setIsCategoryFilterOpen(!isCategoryFilterOpen); setIsStatusFilterOpen(false); setIsSortOpen(false); }}
                 className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-xs rounded-lg px-3 py-1.5 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-w-[160px]"
             >
                 <div className="flex items-center gap-2">
                     <Users className="w-3.5 h-3.5 text-zinc-400" />
                     <span className="truncate max-w-[100px]">{categoryFilter === 'all' ? 'Todas las categorías' : categoryFilter}</span>
                 </div>
                 <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform", isCategoryFilterOpen && "rotate-180")} />
             </button>

             {isCategoryFilterOpen && (
                 <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                     <button
                         onClick={() => { setCategoryFilter('all'); setIsCategoryFilterOpen(false); }}
                         className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                     >
                         <span className={cn("flex-1 text-left font-medium", categoryFilter === 'all' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300")}>Todas las categorías</span>
                         {categoryFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                     </button>
                     {uniqueCategories.length > 0 && <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2 my-1"></div>}
                     {uniqueCategories.map(cat => (
                         <button
                             key={cat}
                             onClick={() => { setCategoryFilter(cat); setIsCategoryFilterOpen(false); }}
                             className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                         >
                             <span className={cn("flex-1 text-left font-medium truncate", categoryFilter === cat ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400")}>{cat}</span>
                             {categoryFilter === cat && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />}
                         </button>
                     ))}
                 </div>
             )}
         </div>

         <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>

         <div className="flex items-center gap-2">
             <ArrowUpDown className="w-4 h-4 text-zinc-400" />
             <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Ordenar:</span>
         </div>

         {/* 3. SELECTOR VISUAL DE ORDENACIÓN */}
         <div className="relative">
             <button
                 onClick={() => { setIsSortOpen(!isSortOpen); setIsStatusFilterOpen(false); setIsCategoryFilterOpen(false); }}
                 className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-xs rounded-lg px-3 py-1.5 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-w-[160px]"
             >
                 <span className="truncate">{sortOptions.find(o => o.value === `${sortConfig.key}-${sortConfig.direction}`)?.label || 'Ordenar por...'}</span>
                 <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform", isSortOpen && "rotate-180")} />
             </button>

             {isSortOpen && (
                 <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                     {sortOptions.map(option => {
                         const isActive = `${sortConfig.key}-${sortConfig.direction}` === option.value;
                         return (
                             <button
                                 key={option.value}
                                 onClick={() => {
                                     const [key, direction] = option.value.split('-');
                                     setSortConfig({ key, direction });
                                     setIsSortOpen(false);
                                 }}
                                 className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                             >
                                 <span className={cn("flex-1 text-left font-medium", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400")}>{option.label}</span>
                                 {isActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                             </button>
                         );
                     })}
                 </div>
             )}
         </div>
      </div>
      
      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col relative z-10">
        <div className="flex bg-zinc-100 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 p-3 text-xs font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
           {columns.map(col => visibleCols.includes(col.id) && (
               <div key={`header-${col.id}`} style={{ flex: col.flex }} className={col.id === 'next' ? 'text-right pr-4' : ''}>
                   {col.label}
               </div>
           ))}
        </div>

        <div className="overflow-y-auto flex-1 pb-10" onClick={() => { setIsStatusFilterOpen(false); setIsCategoryFilterOpen(false); setIsSortOpen(false); }}>
           {processedClubs.map(club => {
             const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || { name: 'Sin Contacto' };
             const phoneToShow = mainContact.phone || club.genericPhone || '-';
             const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
             
            return (
               <div key={club.id} onClick={() => onSelect(club)} className="flex items-center p-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  
                  {/* 1. Nombre del Club (Añadido) */}
                  {visibleCols.includes('club') && (
                      <div style={{ flex: columns.find(c=>c.id==='club').flex }} className="pr-2 truncate">
                          <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              {club.name}
                              {needsAttention && <span className="ml-2 w-2 h-2 rounded-full bg-red-500 inline-block" title="Requiere atención"></span>}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">{club.address || 'Sin ubicación registrada'}</div>
                      </div>
                  )}

                  {/* 2. Categoría */}
                  {visibleCols.includes('category') && (
                      <div style={{ flex: columns.find(c=>c.id==='category').flex }} className="pr-2 truncate">
                         <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                             <Users className="w-4 h-4 text-zinc-400 flex-shrink-0"/> 
                             {club.category || '-'}
                         </div>
                      </div>
                  )}

                  {/* 3. Jugadores (Ahora en el orden correcto) */}
                  {visibleCols.includes('players') && (
                      <div style={{ flex: columns.find(c=>c.id==='players').flex }} className="pr-2">
                         <div className="text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 inline-block px-2 py-0.5 rounded">
                             {club.estimatedPlayers || '-'}
                         </div>
                      </div>
                  )}

                  {/* 4. Equipos */}
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

                  {/* 4. Estado */}
                  {visibleCols.includes('status') && (
                      <div style={{ flex: columns.find(c=>c.id==='status').flex }} className="pr-2">
                          {getStatusBadge(club.status)}
                      </div>
                  )}

                  {/* 5. Contacto Principal */}
                  {visibleCols.includes('contact') && (
                      <div style={{ flex: columns.find(c=>c.id==='contact').flex }} className="pr-2 truncate">
                         <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{mainContact.name}</div>
                         <div className="text-xs text-zinc-500 truncate">{phoneToShow}</div>
                      </div>
                  )}

                    {/* 6. Último Contacto (NUEVO) */}
                  {visibleCols.includes('lastContact') && (
                      <div style={{ flex: columns.find(c=>c.id==='lastContact').flex }} className="pr-2">
                         <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                             {club.lastContactDate || '-'}
                         </div>
                      </div>
                  )}

                    {/* 7. Fecha Recomendada IA */}
                    {visibleCols.includes('recommendedDate') && (
                        <div style={{ flex: columns.find(c=>c.id==='recommendedDate').flex }} className="pr-4 text-right">
                            {club.recommendedContactDate ? (
                                <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                                    <Sparkles className="w-3 h-3"/> {/* Este es el componente que causaba el error */}
                                    {club.recommendedContactDate}
                                </div>
                            ) : (
                                <span className="text-xs text-zinc-400">-</span>
                            )}
                        </div>
                    )}
               </div>
             );
           })}

           {/* Mensaje si el filtro no devuelve resultados */}
           {processedClubs.length === 0 && (
               <div className="flex flex-col items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
                   <Filter className="w-8 h-8 mb-3 opacity-20" />
                   <p className="text-sm">No se encontraron clubes con los filtros seleccionados.</p>
               </div>
           )}
        </div>
      </div>

      {showStatusModal && <StatusManagerModal statuses={statuses} onSave={handleSaveStatuses} onClose={() => setShowStatusModal(false)} />}
    </div>
  );
}