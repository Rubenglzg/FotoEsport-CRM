import React from 'react';
import { CheckCircle2, Zap, Target, Activity, BarChart3, PieChart, Euro, TrendingUp } from 'lucide-react';
import { cn } from '../utils/helpers';

// Utilidad para formatear números a Euros
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

export default function TargetsView({ stats, targetClients }) {
  const conversionRate = stats.total > 0 ? ((stats.signed / stats.total) * 100).toFixed(1) : 0;
  const contactRate = stats.total > 0 ? ((stats.contacted / stats.total) * 100).toFixed(1) : 0;
  const targetProgress = targetClients > 0 ? ((stats.signed / targetClients) * 100).toFixed(1) : 0;

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-8 overflow-y-auto">
       <div className="flex justify-between items-center mb-8">
           <div>
               <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Rendimiento Comercial</h2>
               <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Análisis de facturación y embudo de ventas</p>
           </div>
           
           {/* OBJETIVOS PRINCIPALES */}
           <div className="flex gap-4">
               <div className="text-right bg-white dark:bg-zinc-900 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                   <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Facturación Asegurada</p>
                   <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.closedValue)}</p>
               </div>
               <div className="text-right bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-sm">
                   <p className="text-[10px] font-bold uppercase text-emerald-100 tracking-wider">Objetivo Clubes</p>
                   <div className="flex items-end gap-1 justify-end">
                       <p className="text-2xl font-mono font-bold">{stats.signed}</p>
                       <p className="text-sm font-mono text-emerald-200 mb-0.5">/ {targetClients}</p>
                   </div>
               </div>
           </div>
       </div>

       {/* KPIs FINANCIEROS Y COMERCIALES */}
       <div className="grid grid-cols-4 gap-4 mb-8">
          <MetricCard 
              title="Valor del Pipeline" 
              value={formatCurrency(stats.pipelineValue)} 
              subtitle="En Negociación / Leads"
              icon={<Euro className="w-5 h-5"/>} 
              colorClass="text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400"
          />
          <MetricCard 
              title="Oportunidades Activas" 
              value={stats.activeOpportunities} 
              subtitle="Clubes en proceso"
              icon={<Activity className="w-5 h-5"/>} 
              colorClass="text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400"
          />
          <MetricCard 
              title="Tasa de Cierre" 
              value={`${conversionRate}%`} 
              subtitle="Sobre el total contactado"
              icon={<Zap className="w-5 h-5"/>} 
              colorClass="text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400"
          />
          <MetricCard 
              title="Ticket Medio Base" 
              value="15 €" 
              subtitle="Beneficio por jugador (aprox)"
              icon={<TrendingUp className="w-5 h-5"/>} 
              colorClass="text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
          />
       </div>

       <div className="grid grid-cols-3 gap-6">
          {/* EMBUDO DE VENTAS DETALLADO */}
          <div className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                     <BarChart3 className="w-5 h-5 text-zinc-400" /> Pipeline de Ventas
                 </h3>
                 <span className="text-xs font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                     Tasa de contacto: {contactRate}%
                 </span>
             </div>
             <div className="space-y-6">
                <FunnelStep 
                    label="1. Identificados (Base de datos)" 
                    count={stats.total} total={stats.total} color="bg-zinc-300 dark:bg-zinc-700" 
                />
                <FunnelStep 
                    label="2. Contacto Iniciado" 
                    count={stats.contacted} total={stats.total} color="bg-indigo-400 dark:bg-indigo-500" 
                />
                <FunnelStep 
                    label="3. Oportunidades (Leads / Negociación)" 
                    count={stats.activeOpportunities} total={stats.total} color="bg-blue-400 dark:bg-blue-500" 
                    subtitle={`Valor ponderado: ${formatCurrency(stats.pipelineValue)}`}
                />
                <FunnelStep 
                    label="4. Contratos Cerrados" 
                    count={stats.signed} total={stats.total} color="bg-emerald-500" 
                    subtitle={`Valor total asegurado: ${formatCurrency(stats.closedValue)}`}
                />
             </div>
          </div>

          <div className="flex flex-col gap-6">
              {/* Progreso Circular */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-sm">
                 <div className="relative w-32 h-32 mb-4">
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                         <circle 
                            cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                            strokeDasharray={`${targetProgress > 100 ? 100 : targetProgress} 100`} pathLength="100" strokeLinecap="round"
                            className="text-emerald-500 transition-all duration-1000 ease-out" 
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.min(targetProgress, 100)}%</span>
                     </div>
                 </div>
                 <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Progreso del Objetivo</h3>
              </div>

              {/* Distribución por Categorías */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex-1">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                      <PieChart className="w-4 h-4 text-zinc-400" /> Clubes por Categoría
                  </h3>
                  <div className="space-y-3">
                      {Object.keys(stats.categories || {}).length > 0 ? (
                          Object.entries(stats.categories).sort((a,b) => b[1] - a[1]).map(([category, count]) => (
                              <div key={category} className="flex justify-between items-center text-sm">
                                  <span className="text-zinc-600 dark:text-zinc-400 truncate pr-2">{category}</span>
                                  <span className="font-mono text-zinc-900 dark:text-white">{count}</span>
                              </div>
                          ))
                      ) : (
                          <p className="text-xs text-zinc-500 text-center py-2">Sin categorías registradas</p>
                      )}
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
}

const MetricCard = ({ title, value, subtitle, icon, colorClass }) => (
   <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl relative shadow-sm hover:border-zinc-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
         <div className={cn("p-2.5 rounded-xl", colorClass)}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{value}</p>
      <h3 className="text-zinc-600 dark:text-zinc-300 text-sm font-bold">{title}</h3>
      {subtitle && <p className="text-[11px] text-zinc-500 mt-1">{subtitle}</p>}
   </div>
);

const FunnelStep = ({ label, count, total, color, subtitle }) => {
   const widthPercentage = total > 0 ? `${(count / total) * 100}%` : '0%';
   return (
       <div className="relative">
          <div className="flex justify-between items-end mb-2">
              <div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{label}</span>
                  {subtitle && <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{subtitle}</p>}
              </div>
              <span className="text-lg font-mono text-zinc-900 dark:text-white font-bold">{count}</span>
          </div>
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: widthPercentage }}></div>
          </div>
       </div>
   );
};