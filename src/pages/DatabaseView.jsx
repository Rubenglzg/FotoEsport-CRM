// src/views/DatabaseView.jsx
import React from 'react';
import { Download, Plus, Users, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function DatabaseView({ clubs, onSelect }) {
  const getStatusBadge = (status) => {
    const configs = { 
        signed: { label: 'CLIENTE', variant: 'success' }, 
        negotiation: { label: 'NEGOCIANDO', variant: 'warning' }, 
        lead: { label: 'LEAD', variant: 'default' }, 
        rejected: { label: 'RECHAZADO', variant: 'danger' },
        renewal_pending: { label: 'RENOVAR', variant: 'renewal' }
    };
    const config = configs[status] || configs.lead;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-6 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Cartera de Clubes</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gestiona contactos y estados.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Exportar CSV</Button>
           <Button variant="neon"><Plus className="w-4 h-4 mr-2"/> Nuevo Club</Button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex-1 shadow-sm">
        <div className="grid grid-cols-12 bg-zinc-100 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 p-3 text-xs font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
           <div className="col-span-5">Club / Categoría</div>
           <div className="col-span-2">Estado</div>
           <div className="col-span-3">Contacto Principal</div>
           <div className="col-span-1 text-right">Prox. Contacto</div>
           <div className="col-span-1 text-right">Acción</div>
        </div>
        <div className="overflow-y-auto h-full pb-10">
           {clubs.map(club => {
             const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || {};
             const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
             return (
               <div key={club.id} onClick={() => onSelect(club)} className="grid grid-cols-12 items-center p-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  <div className="col-span-5 flex items-center gap-2">
                     {needsAttention && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Requiere Atención"></div>}
                     <div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors">{club.name}</div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3"/> {club.category}</div>
                     </div>
                  </div>
                  <div className="col-span-2">{getStatusBadge(club.status)}</div>
                  <div className="col-span-3">
                     <div className="text-sm text-zinc-700 dark:text-zinc-300">{mainContact?.name || 'Sin contacto'}</div>
                     <div className="text-xs text-zinc-500">{mainContact?.role || '-'}</div>
                  </div>
                  <div className="col-span-1 text-right text-xs font-mono text-zinc-400">{club.nextContact || '-'}</div>
                  <div className="col-span-1 flex justify-end"><Button variant="ghost" size="icon"><ChevronRight className="w-4 h-4"/></Button></div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}