// src/components/layout/Header.jsx
import React, { useState } from 'react';
import { Search, Bell, AlertTriangle, CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/helpers';

function SeasonSelector({ seasons, selectedSeason, activeSeason, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative group">
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer"
            >
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400">
                    <CalendarIcon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 pl-2 pr-6">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white select-none">
                        {selectedSeason}
                    </span>
                    {selectedSeason === activeSeason && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                            Activa
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : 'group-hover:text-emerald-500'}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {seasons.map(s => (
                            <div 
                                key={s} 
                                onClick={() => { onSelect(s); setIsOpen(false); }}
                                className={`flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 
                                ${selectedSeason === s 
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <span>{s}</span>
                                {activeSeason === s && (
                                    <span className="text-[10px] bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        Activa
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function Header({ 
    currentView, 
    seasons, 
    selectedSeason,
    activeSeason, // <-- NUEVO PROP
    onActiveSeasonChange, 
    filterNeedsAttention, 
    setFilterNeedsAttention, 
    notifications, 
    showNotifications,
    setShowNotifications 
}) {
    return (
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-between px-3 md:px-6 z-40 shrink-0 gap-2">
           <div className="flex items-center gap-2 md:gap-4 flex-1">
             <h1 className="hidden md:block text-lg font-bold uppercase tracking-wide text-zinc-800 dark:text-white">
                {currentView === 'overview' && 'Asistente IA'}
                {currentView === 'map' && 'Mapa Táctico'}
                {currentView === 'pipeline' && 'Pipeline de Ventas'}
                {currentView === 'database' && 'Directorio'}
                {currentView === 'calendar' && 'Planificación'}
                {currentView === 'targets' && 'Cuadro de Mando'}
                {currentView === 'settings' && 'Configuración'}
             </h1>
             <div className="hidden md:block h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700"></div>
             <SeasonSelector 
                 seasons={seasons} 
                 selectedSeason={selectedSeason} 
                 activeSeason={activeSeason} // <-- PASAMOS LA TEMPORADA ACTIVA
                 onSelect={onActiveSeasonChange} 
             />
              <button onClick={() => setFilterNeedsAttention(!filterNeedsAttention)} className={cn("flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm", filterNeedsAttention ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500 dark:text-red-400" : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400")}>
                <AlertTriangle className="w-4 h-4 md:w-3 md:h-3" />
                <span className="hidden sm:inline">{filterNeedsAttention ? "Viendo Prioritarios" : "Filtrar Alertas"}</span>
             </button>
           </div>
           
            <div className="flex items-center gap-2 md:gap-4">
                {(currentView === 'map' || currentView === 'database') && (
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                        {/* El buscador se vuelve más pequeño en móvil y w-64 en escritorio */}
                        <input type="text" placeholder="Buscar..." className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-2 py-2 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 w-32 sm:w-48 md:w-64 transition-all text-zinc-900 dark:text-white" />
                    </div>
                )}
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-colors">
                    <Bell className="w-4 h-4" />{notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm"></span>}
                </button>
           </div>
        </header>
    );
}