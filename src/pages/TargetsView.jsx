import React from 'react';
import { CheckCircle2, Zap, Users, BarChart3, PieChart, Euro, TableProperties } from 'lucide-react';
import { cn } from '../utils/helpers';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

export default function TargetsView({ stats, targetClients, ticketMedio }) {
  const conversionRate = stats.total > 0 ? ((stats.signed / stats.total) * 100).toFixed(0) : 0;
  const targetProgress = targetClients > 0 ? ((stats.signed / targetClients) * 100).toFixed(1) : 0;

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-8 overflow-y-auto">
       <div className="flex justify-between items-center mb-8">
           <div>
               <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Rendimiento Comercial</h2>
               <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Análisis de cartera y proyecciones financieras</p>
           </div>
           
           <div className="text-right bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-sm">
               <p className="text-[10px] font-bold uppercase text-emerald-100 tracking-wider">Objetivo Temporada</p>
               <div className="flex items-end gap-1 justify-end">
                   <p className="text-2xl font-mono font-bold">{stats.signed}</p>
                   <p className="text-sm font-mono text-emerald-200 mb-0.5">/ {targetClients}</p>
               </div>
           </div>
       </div>

       {/* KPIs COMERCIALES ORIGINALES (Contadores de Leads) */}
       <div className="grid grid-cols-3 gap-6 mb-8">
          <MetricCard 
              title="Clubes Activos (Clientes)" 
              value={stats.signed} 
              icon={<CheckCircle2 className="w-5 h-5"/>} 
              colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400"
          />
          <MetricCard 
              title="Conversión Global" 
              value={`${conversionRate}%`} 
              icon={<Zap className="w-5 h-5"/>} 
              colorClass="text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400"
          />
          <MetricCard 
              title="Leads en Negociación" 
              value={stats.negotiation} 
              icon={<Users className="w-5 h-5"/>} 
              colorClass="text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400"
          />
       </div>

       {/* NUEVA TABLA DE PROYECCIÓN FINANCIERA */}
       <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mb-8 overflow-hidden">
           <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
               <TableProperties className="w-5 h-5 text-zinc-400" /> Proyección de Facturación
           </h3>
           <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                   <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 uppercase font-bold text-[10px]">
                       <tr>
                           <th className="px-4 py-3 rounded-l-lg tracking-wider">Fase del Embudo</th>
                           <th className="px-4 py-3 tracking-wider">Nº Clubes</th>
                           <th className="px-4 py-3 tracking-wider">Ticket Medio</th>
                           <th className="px-4 py-3 rounded-r-lg text-right tracking-wider">Valor Estimado</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                       <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                           <td className="px-4 py-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Clientes Cerrados
                           </td>
                           <td className="px-4 py-4 font-mono text-zinc-700 dark:text-zinc-300">{stats.signed}</td>
                           <td className="px-4 py-4 font-mono text-zinc-500">{formatCurrency(ticketMedio)} / jugador</td>
                           <td className="px-4 py-4 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 text-lg">
                               {formatCurrency(stats.closedValue)}
                           </td>
                       </tr>
                       <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                           <td className="px-4 py-4 font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-amber-500"></div> Oportunidades (Leads)
                           </td>
                           <td className="px-4 py-4 font-mono text-zinc-700 dark:text-zinc-300">{stats.activeOpportunities}</td>
                           <td className="px-4 py-4 font-mono text-zinc-500">{formatCurrency(ticketMedio)} / jugador</td>
                           <td className="px-4 py-4 font-mono font-bold text-right text-zinc-900 dark:text-white">
                               {formatCurrency(stats.pipelineValue)}
                           </td>
                       </tr>
                       <tr className="bg-zinc-50/50 dark:bg-zinc-900/50">
                           <td colSpan="3" className="px-4 py-3 font-bold text-right text-zinc-600 dark:text-zinc-400 uppercase text-xs">Potencial Total Cartera:</td>
                           <td className="px-4 py-3 font-mono font-bold text-right text-zinc-900 dark:text-white text-xl border-t-2 border-zinc-200 dark:border-zinc-700">
                               {formatCurrency(stats.closedValue + stats.pipelineValue)}
                           </td>
                       </tr>
                   </tbody>
               </table>
           </div>
       </div>

       <div className="grid grid-cols-2 gap-6">
          {/* EMBUDO DE VENTAS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                     <BarChart3 className="w-5 h-5 text-zinc-400" /> Estado de la Cartera
                 </h3>
             </div>
             <div className="space-y-4">
                <FunnelStep label="Total Base de Datos" count={stats.total} color="bg-zinc-400 dark:bg-zinc-700" total={stats.total} />
                <FunnelStep label="En Negociación / Leads" count={stats.activeOpportunities} color="bg-amber-400 dark:bg-amber-500" total={stats.total} />
                <FunnelStep label="Clientes Cerrados" count={stats.signed} color="bg-emerald-500" total={stats.total} />
             </div>
          </div>

          {/* DISTRIBUCIÓN POR CATEGORÍAS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                 <PieChart className="w-5 h-5 text-zinc-400" /> Por Categorías
             </h3>
             <div className="space-y-4">
                 {Object.keys(stats.categories || {}).length > 0 ? (
                     Object.entries(stats.categories).sort((a,b) => b[1] - a[1]).map(([category, count]) => (
                         <div key={category} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0">
                             <span className="text-zinc-600 dark:text-zinc-300 font-medium">{category}</span>
                             <div className="flex items-center gap-3">
                                 <span className="font-mono font-bold text-zinc-900 dark:text-white">{count}</span>
                                 <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                     {Math.round((count / stats.total) * 100)}%
                                 </span>
                             </div>
                         </div>
                     ))
                 ) : (
                     <p className="text-sm text-zinc-500 text-center py-4">Sin datos de categorías</p>
                 )}
             </div>
          </div>
       </div>
    </div>
  );
}

const MetricCard = ({ title, value, icon, colorClass }) => (
   <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl relative overflow-hidden shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
         <div className={cn("p-2.5 rounded-xl", colorClass)}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
      <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase mt-1">{title}</h3>
   </div>
);

const FunnelStep = ({ label, count, color, total }) => {
   const widthPercentage = total > 0 ? `${(count / total) * 100}%` : '0%';
   return (
       <div>
          <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{label}</span>
              <span className="text-zinc-900 dark:text-white font-bold font-mono">{count}</span>
          </div>
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden flex">
              <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: widthPercentage }}></div>
          </div>
       </div>
   );
};