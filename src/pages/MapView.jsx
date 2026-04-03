import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, Plus, X, Clock3, CheckCircle2, Zap, RotateCcw, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/helpers';

export default function MapView({ clubs, selectedId, onSelect, showRadius, setShowRadius, showRoute, setShowRoute, tasks, origin, routeStops, setRouteStops, onOptimizeRoute }) {
  const [zoom, setZoom] = useState(1);
  const routePoints = useMemo(() => {
      if (!showRoute) return [];
      const clubsWithTasks = clubs.filter(c => tasks.some(t => t.clubId === c.id));
      return clubsWithTasks.sort((a, b) => b.lat - a.lat);
  }, [showRoute, clubs, tasks]);

  return (
    <div className="flex-1 relative bg-zinc-100 dark:bg-[#09090b] overflow-hidden group transition-colors duration-300">
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.15] opacity-30 pointer-events-none" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '40px 40px', transform: `scale(${zoom})`, color: 'var(--tw-colors-zinc-400)' }} />
      <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
        
        {showRoute && routePoints.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.4" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.9" /></linearGradient>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                </defs>
                <polyline points={routePoints.map(p => `${p.lng}%,${p.lat}%`).join(' ')} fill="none" stroke="url(#routeGradient)" strokeWidth="0.8" strokeDasharray="2, 2" markerMid="url(#arrow)" markerEnd="url(#arrow)" className="animate-pulse" />
            </svg>
        )}
        {showRoute && (
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center" style={{ top: `${origin.lat}%`, left: `${origin.lng}%` }}>
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce"><MapPin className="w-3 h-3 text-white fill-current" /></div>
                <span className="bg-white/90 dark:bg-black/70 text-zinc-900 dark:text-white text-[9px] px-1.5 rounded mt-1 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-sm font-bold">OFICINA</span>
            </div>
        )}
        
        {clubs.map((club) => {
          const isSelected = selectedId === club.id;
          let pinColor = "bg-zinc-400 border-zinc-300 dark:bg-zinc-600 dark:border-zinc-400";
          if (club.status === 'signed') pinColor = "bg-emerald-500 border-white shadow-[0_0_15px_rgba(16,185,129,0.5)]";
          if (club.status === 'negotiation') pinColor = "bg-amber-500 border-amber-200";
          if (club.status === 'rejected') pinColor = "bg-red-500 border-red-300 dark:bg-red-900 dark:border-red-700 opacity-50";
          if (club.status === 'renewal_pending') pinColor = "bg-blue-500 border-blue-300 animate-pulse";
          
          const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
          const routeIndex = routeStops.findIndex(s => s.id === club.id);
          const isInRoute = showRoute && routeIndex !== -1;

          return (
            <div key={club.id} onClick={(e) => { e.stopPropagation(); onSelect(club); }} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 hover:z-50 group/pin" style={{ top: `${club.lat}%`, left: `${club.lng}%` }}>
              {isSelected && showRadius && club.status === 'signed' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-emerald-500/30 bg-emerald-500/5 animate-pulse pointer-events-none flex items-center justify-center">
                   <div className="absolute top-2 right-1/2 translate-x-1/2 text-[10px] text-emerald-600 dark:text-emerald-500 font-mono bg-white/80 dark:bg-black/50 px-1 rounded shadow-sm">RADIO 5KM</div>
                </div>
              )}
              <div className={cn("w-3 h-3 rounded-full border-2 relative transition-transform group-hover/pin:scale-150", pinColor, isInRoute && "ring-4 ring-emerald-500/50 scale-125 bg-emerald-400 border-white")}>
                {isSelected && <div className="absolute -inset-2 rounded-full border border-zinc-900/30 dark:border-white/50 animate-ping" />}
                {needsAttention && !isSelected && <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full border border-white dark:border-black font-bold">!</div>}
                {isInRoute && <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold text-[9px] px-1.5 rounded-full border border-emerald-400 shadow-md z-30">{routeIndex + 1}</div>}
              </div>
              {(isSelected || club.status === 'signed' || club.status === 'renewal_pending') && (
                <div className={cn("absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border whitespace-nowrap pointer-events-none transition-colors", isSelected ? "bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-black z-50 shadow-lg" : "bg-white/80 text-zinc-700 border-zinc-200 dark:bg-black/60 dark:text-zinc-400 dark:border-zinc-800 shadow-sm")}>{club.name}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
         {selectedId && clubs.find(c => c.id === selectedId)?.status === 'signed' && (
           <button onClick={() => setShowRadius(!showRadius)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRadius ? "bg-emerald-500 text-white dark:text-black border-emerald-400" : "bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-white dark:border-zinc-700")}>
             <Target className={cn("w-4 h-4", showRadius && "animate-spin-slow")} />
             {showRadius ? "RADAR: ON" : "RADAR"}
           </button>
         )}
         <button onClick={() => setShowRoute(!showRoute)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRoute ? "bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-black dark:border-white" : "bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-white dark:border-zinc-700")}>
            <Navigation className="w-4 h-4" />
            {showRoute ? "OCULTAR RUTA" : "RUTA DE VISITA"}
         </button>
      </div>
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="bg-white dark:bg-transparent shadow-sm"><Plus className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="bg-white dark:bg-transparent shadow-sm"><X className="w-4 h-4 rotate-45" /></Button>
      </div>
    </div>
  );
}