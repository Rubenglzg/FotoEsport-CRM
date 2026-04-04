// src/pages/DatabaseView.jsx
import React, { useState } from 'react';
import { Download, Plus, Users, ChevronRight, LayoutList } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function DatabaseView({ clubs, onSelect, onNewClub }) {
  // Estado para controlar qué columnas están visibles por defecto
  const [visibleCols, setVisibleCols] = useState(['club', 'status', 'contact', 'next', 'action']);

  // Definición de las columnas y su "peso" visual (flex)
  const columns = [
    { id: 'club', label: 'Club / Categoría', flex: 4 },
    { id: 'status', label: 'Estado', flex: 2 },
    { id: 'contact', label: 'Contacto Principal', flex: 3 },
    { id: 'next', label: 'Prox. Contacto', flex: 2 },
    { id: 'action', label: 'Acción', flex: 1 },
  ];

  const getStatusBadge = (status) => {
    const configs = { 
        to_contact: { label: 'POR CONTACTAR', variant: 'default' }, 
        contacted_no_reply: { label: 'SIN RESPUESTA', variant: 'warning' }, 
        prospect: { label: 'POS. CLIENTE', variant: 'neon' }, 
        lead: { label: 'LEAD', variant: 'outline' },
        client: { label: 'CLIENTE', variant: 'success' },
        not_interested: { label: 'NO INTERESA', variant: 'danger' }
    };
    const config = configs[status] || configs.to_contact;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const toggleColumn = (colId) => {
    if (visibleCols.includes(colId)) {
        setVisibleCols(visibleCols.filter(id => id !== colId));
    } else {
        setVisibleCols([...visibleCols, colId]);
    }
  };

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-6 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Cartera de Clubes</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gestiona la base de datos de equipos.</p>
        </div>
        
        <div className="flex gap-3 items-center">
           {/* Selector de columnas desplegable al pasar el ratón */}
           <div className="relative group">
              <Button variant="outline" className="flex items-center gap-2">
                 <LayoutList className="w-4 h-4" /> Columnas
              </Button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 flex flex-col gap-1">
                 {columns.map(col => (
                    <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                        <input 
                            type="checkbox" 
                            checked={visibleCols.includes(col.id)} 
                            onChange={() => toggleColumn(col.id)}
                            className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 bg-transparent"
                        />
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
        {/* CABECERA DINÁMICA */}
        <div className="flex bg-zinc-100 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 p-3 text-xs font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
           {columns.map(col => visibleCols.includes(col.id) && (
               <div key={`header-${col.id}`} style={{ flex: col.flex }} className={col.id === 'action' || col.id === 'next' ? 'text-right' : ''}>
                   {col.label}
               </div>
           ))}
        </div>

        {/* LISTADO DE CLUBES */}
        <div className="overflow-y-auto flex-1 pb-10">
           {clubs.map(club => {
             // Busca el contacto principal o usa el genérico
             const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || { name: 'Contacto del Club' };
             const phoneToShow = mainContact.phone || club.genericPhone || '-';
             
             const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
             
             return (
               <div key={club.id} onClick={() => onSelect(club)} className="flex items-center p-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  
                  {/* Columna: Club */}
                  {visibleCols.includes('club') && (
                      <div style={{ flex: columns.find(c=>c.id==='club').flex }} className="flex items-center gap-2 pr-2">
                         {needsAttention && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" title="Requiere Atención"></div>}
                         <div className="truncate">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors truncate">{club.name}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate"><Users className="w-3 h-3 flex-shrink-0"/> {club.category}</div>
                         </div>
                      </div>
                  )}

                  {/* Columna: Estado */}
                  {visibleCols.includes('status') && (
                      <div style={{ flex: columns.find(c=>c.id==='status').flex }} className="pr-2">
                          {getStatusBadge(club.status)}
                      </div>
                  )}

                  {/* Columna: Contacto */}
                  {visibleCols.includes('contact') && (
                      <div style={{ flex: columns.find(c=>c.id==='contact').flex }} className="pr-2 truncate">
                         <div className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{mainContact.name}</div>
                         <div className="text-xs text-zinc-500 truncate">{phoneToShow}</div>
                      </div>
                  )}

                  {/* Columna: Próximo Contacto */}
                  {visibleCols.includes('next') && (
                      <div style={{ flex: columns.find(c=>c.id==='next').flex }} className="text-right text-xs font-mono text-zinc-400 pr-2">
                          {club.nextContact || '-'}
                      </div>
                  )}

                  {/* Columna: Acción */}
                  {visibleCols.includes('action') && (
                      <div style={{ flex: columns.find(c=>c.id==='action').flex }} className="flex justify-end">
                          <Button variant="ghost" size="icon"><ChevronRight className="w-4 h-4"/></Button>
                      </div>
                  )}
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}