// src/pages/PipelineView.jsx
import React, { useState } from 'react';
import { Users, MoreHorizontal, Calendar } from 'lucide-react';
import { cn } from '../utils/helpers';

export default function PipelineView({ clubs, statuses, onUpdateClub, onSelect, selectedSeason }) {
    const [draggedClubId, setDraggedClubId] = useState(null);

    const handleDragStart = (e, clubId) => {
        setDraggedClubId(clubId);
        e.dataTransfer.setData('clubId', clubId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => e.target.classList.add('opacity-50'), 0);
    };

    const handleDragEnd = (e) => {
        setDraggedClubId(null);
        e.target.classList.remove('opacity-50');
    };

    const handleDragOver = (e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, newStatusId) => {
        e.preventDefault();
        const clubId = e.dataTransfer.getData('clubId');
        if (!clubId) return;
        moveClubToStatus(clubId, newStatusId);
    };

    // Nueva función separada para poder reusarla en el select del móvil
    const moveClubToStatus = (clubId, newStatusId) => {
        const club = clubs.find(c => c.id === clubId);
        if (club && club.status !== newStatusId) {
            const { lastContactDate, leadScore, ...rawClub } = club;
            const updatedClub = {
                ...rawClub,
                status: newStatusId,
                seasonStatuses: {
                    ...(rawClub.seasonStatuses || {}),
                    [selectedSeason]: newStatusId 
                }
            };
            onUpdateClub(updatedClub);
        }
    };

    const getClubsByStatus = (statusId) => clubs.filter(club => club.status === statusId);
    const getColumnValue = (statusClubs) => statusClubs.reduce((acc, club) => acc + (club.estimatedPlayers || 0), 0);

    return (
        <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-4 md:p-6 flex flex-col h-full overflow-hidden">
            <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">Pipeline de Ventas</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm">
                    <span className="hidden md:inline">Arrastra las tarjetas para avanzar los clubes en el embudo.</span>
                    <span className="md:hidden">Usa el desplegable de cada tarjeta para cambiarla de fase.</span>
                </p>
            </div>

            {/* Contenedor del Kanban adaptado para móvil */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-6 md:pb-4 select-none snap-x snap-mandatory">
                {statuses.map(status => {
                    const statusClubs = getClubsByStatus(status.id);
                    return (
                        <div 
                            key={status.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status.id)}
                            className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col w-[85vw] sm:w-[320px] min-w-[85vw] sm:min-w-[320px] max-h-full snap-center"
                        >
                            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 rounded-t-xl sticky top-0">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }}></span>
                                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">{status.label}</h3>
                                </div>
                                <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                    {statusClubs.length}
                                </span>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar pb-24 md:pb-3">
                                {statusClubs.map(club => (
                                    <div
                                        key={club.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, club.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={(e) => {
                                            // Evitar que al tocar el select se abra el panel lateral
                                            if(e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION') {
                                                onSelect(club);
                                            }
                                        }}
                                        className={cn(
                                            "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm cursor-grab hover:border-emerald-500/50 transition-all",
                                            draggedClubId === club.id ? "ring-2 ring-emerald-500 opacity-50" : ""
                                        )}
                                    >
                                        <div className="flex flex-col gap-1.5 mb-3">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{club.name}</h4>
                                            
                                            {/* Visualización de comerciales en la ficha del Kanban */}
                                            {club.assignedTo && (Array.isArray(club.assignedTo) ? club.assignedTo.length > 0 : true) && (
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {(() => {
                                                        const names = Array.isArray(club.assignedTo) ? club.assignedTo : [club.assignedTo];
                                                        return names.map(name => (
                                                            <span key={name} className="text-[11px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 truncate max-w-full antialiased">
                                                                {name}
                                                            </span>
                                                        ));
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                <span>{club.estimatedPlayers || '0'} Jugadores</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span className="truncate max-w-[80px]">{club.lastContactDate === "Sin contacto" ? "N/A" : club.lastContactDate}</span>
                                            </div>
                                        </div>
                                        {/* BOTONES DE FASE RÁPIDOS PARA MÓVIL */}
                                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 md:hidden flex gap-2">
                                            {(() => {
                                                // Calculamos la fase anterior y siguiente dinámicamente
                                                const currentIndex = statuses.findIndex(s => s.id === club.status);
                                                const prevStatus = currentIndex > 0 ? statuses[currentIndex - 1] : null;
                                                const nextStatus = currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;

                                                return (
                                                    <>
                                                        <button 
                                                            disabled={!prevStatus}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if(prevStatus) moveClubToStatus(club.id, prevStatus.id);
                                                            }}
                                                            className="flex-1 bg-zinc-100 dark:bg-zinc-800 disabled:opacity-30 text-zinc-600 dark:text-zinc-400 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                                                        >
                                                            <span className="text-[10px]">◀</span> Atrás
                                                        </button>
                                                        <button 
                                                            disabled={!nextStatus}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if(nextStatus) moveClubToStatus(club.id, nextStatus.id);
                                                            }}
                                                            className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 disabled:opacity-30 disabled:bg-zinc-100 disabled:text-zinc-400 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-800/50 disabled:border-transparent"
                                                        >
                                                            Avanzar <span className="text-[10px]">▶</span>
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}