// src/pages/DatabaseView.jsx
import React, { useState } from 'react';
import { Download, Plus, Users, LayoutList, Settings, X, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
  // Acción eliminada de las columnas visibles por defecto
  const [visibleCols, setVisibleCols] = useState(['club', 'status', 'contact', 'next']);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const columns = [
    { id: 'club', label: 'Club / Categoría', flex: 4 },
    { id: 'status', label: 'Estado', flex: 2 },
    { id: 'contact', label: 'Contacto Principal', flex: 3 },
    { id: 'next', label: 'Prox. Contacto', flex: 2 },
  ];

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
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col">
        <div className="flex bg-zinc-100 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 p-3 text-xs font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
           {columns.map(col => visibleCols.includes(col.id) && (
               <div key={`header-${col.id}`} style={{ flex: col.flex }} className={col.id === 'next' ? 'text-right pr-4' : ''}>
                   {col.label}
               </div>
           ))}
        </div>

        <div className="overflow-y-auto flex-1 pb-10">
           {clubs.map(club => {
             const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || { name: 'Sin Contacto' };
             const phoneToShow = mainContact.phone || club.genericPhone || '-';
             const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
             
             return (
               <div key={club.id} onClick={() => onSelect(club)} className="flex items-center p-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  
                  {visibleCols.includes('club') && (
                      <div style={{ flex: columns.find(c=>c.id==='club').flex }} className="flex items-center gap-2 pr-2">
                         {needsAttention && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" title="Requiere Atención"></div>}
                         <div className="truncate">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors truncate">{club.name}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate"><Users className="w-3 h-3 flex-shrink-0"/> {club.category}</div>
                         </div>
                      </div>
                  )}

                  {visibleCols.includes('status') && (
                      <div style={{ flex: columns.find(c=>c.id==='status').flex }} className="pr-2">
                          {getStatusBadge(club.status)}
                      </div>
                  )}

                  {visibleCols.includes('contact') && (
                      <div style={{ flex: columns.find(c=>c.id==='contact').flex }} className="pr-2 truncate">
                         <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{mainContact.name}</div>
                         <div className="text-xs text-zinc-500 truncate">{phoneToShow}</div>
                      </div>
                  )}

                  {visibleCols.includes('next') && (
                      <div style={{ flex: columns.find(c=>c.id==='next').flex }} className="text-right text-xs font-mono text-zinc-400 pr-4">
                          {club.nextContact || '-'}
                      </div>
                  )}
               </div>
             );
           })}
        </div>
      </div>

      {showStatusModal && <StatusManagerModal statuses={statuses} onSave={handleSaveStatuses} onClose={() => setShowStatusModal(false)} />}
    </div>
  );
}