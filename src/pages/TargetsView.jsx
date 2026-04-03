import React from 'react';
import { CheckCircle2, Zap, Users } from 'lucide-react';
import { cn } from '../utils/helpers';

export default function TargetsView({ stats, targetClients }) {
  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-8 overflow-y-auto">
       <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Rendimiento Comercial</h2>
           <div className="text-right">
               <p className="text-[10px] font-bold uppercase text-zinc-500">Objetivo Temporada</p>
               <p className="text-xl font-mono text-emerald-600 dark:text-emerald-400">{targetClients} Clubes</p>
           </div>
       </div>
       <div className="grid grid-cols-3 gap-6 mb-8">
          <MetricCard title="Clubes Activos (Clientes)" value={stats.signed} change="+3" trend="up" icon={<CheckCircle2 className="w-5 h-5"/>} />
          <MetricCard title="Conversión de Leads" value={`${stats.total > 0 ? (stats.signed / stats.total * 100).toFixed(0) : 0}%`} change="+5%" trend="up" icon={<Zap className="w-5 h-5"/>} />
          <MetricCard title="En Negociación" value={stats.negotiation} change="-2" trend="down" icon={<Users className="w-5 h-5"/>} />
       </div>
       <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Estado de la Cartera</h3>
             <div className="space-y-4">
                <FunnelStep label="Total Base de Datos" count={stats.total} color="bg-zinc-400 dark:bg-zinc-700" width="100%" />
                <FunnelStep label="En Negociación" count={stats.negotiation} color="bg-amber-400 dark:bg-amber-500" width="40%" />
                <FunnelStep label="Clientes Cerrados" count={stats.signed} color="bg-emerald-500" width="25%" />
             </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-sm">
             <div className="w-32 h-32 rounded-full border-4 border-zinc-100 dark:border-zinc-800 border-t-emerald-500 dark:border-t-emerald-500 flex items-center justify-center mb-4 relative">
                <div className="text-center z-10">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.signed}</span>
                    <span className="text-xs text-zinc-500 block">/ {targetClients}</span>
                </div>
             </div>
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Progreso Objetivo</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400">Te faltan {Math.max(0, targetClients - stats.signed)} clubes.</p>
          </div>
       </div>
    </div>
  );
}

const MetricCard = ({ title, value, change, trend, icon }) => (
   <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-start mb-4">
         <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">{icon}</div>
         <span className={cn("text-xs font-bold px-2 py-1 rounded", trend === 'up' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400")}>{change}</span>
      </div>
      <h3 className="text-zinc-500 text-sm font-bold uppercase">{title}</h3>
      <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
   </div>
);

const FunnelStep = ({ label, count, color, width }) => (
   <div>
      <div className="flex justify-between text-xs mb-1">
          <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
          <span className="text-zinc-900 dark:text-white font-bold">{count}</span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", color)} style={{ width }}></div>
      </div>
   </div>
);