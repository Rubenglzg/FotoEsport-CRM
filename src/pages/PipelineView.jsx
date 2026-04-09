// src/pages/PipelineView.jsx
import React, { useState } from 'react';
import { Users, MoreHorizontal, Calendar } from 'lucide-react';
import { cn } from '../utils/helpers';

export default function PipelineView({ clubs, statuses, onUpdateClub, onSelect, selectedSeason }) {
    const [draggedClubId, setDraggedClubId] = useState(null);

    // Manejadores del Drag & Drop
    const handleDragStart = (e, clubId) => {
        setDraggedClubId(clubId);
        e.dataTransfer.setData('clubId', clubId);
        // Efecto visual al arrastrar
        e.dataTransfer.effectAllowed = 'move';
        // Hacemos que el elemento sea un poco transparente mientras se arrastra (opcional)
        setTimeout(() => e.target.classList.add('opacity-50'), 0);
    };

    const handleDragEnd = (e) => {
        setDraggedClubId(null);
        e.target.classList.remove('opacity-50');
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necesario para permitir el Drop
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, newStatusId) => {
        e.preventDefault();
        const clubId = e.dataTransfer.getData('clubId');
        
        if (!clubId) return;

        const club = clubs.find(c => c.id === clubId);
        
        // Si el club existe y realmente cambió de estado
        if (club && club.status !== newStatusId) {
            // Limpiamos los campos derivados de la UI antes de guardar para no ensuciar la BD
            const { lastContactDate, leadScore, ...rawClub } = club;
            
            const updatedClub = {
                ...rawClub,
                status: newStatusId, // Actualizamos el fallback global
                seasonStatuses: {
                    ...(rawClub.seasonStatuses || {}),
                    [selectedSeason]: newStatusId // Actualizamos para la temporada actual
                }
            };
            onUpdateClub(updatedClub);
        }
    };

    // Agrupamos los clubes por su estado actual
    const getClubsByStatus = (statusId) => {
        return clubs.filter(club => club.status === statusId);
    };

    // Calculamos el valor económico de una columna (opcional, muy visual para un Kanban)
    const getColumnValue = (statusClubs) => {
        // Asumimos un ticket medio de ejemplo, o puedes pasarlo por props
        return statusClubs.reduce((acc, club) => acc + (club.estimatedPlayers || 0), 0);
    };

    return (
        <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-6 flex flex-col h-full overflow-hidden">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Pipeline de Ventas</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Arrastra las tarjetas para avanzar los clubes en el embudo.</p>
            </div>

            {/* Contenedor del Kanban con scroll horizontal */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-4 select-none">
                {statuses.map(status => {
                    const statusClubs = getClubsByStatus(status.id);
                    const totalPlayers = getColumnValue(statusClubs);

                    return (
                        <div 
                            key={status.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status.id)}
                            className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col w-[320px] min-w-[320px] max-h-full"
                        >
                            {/* Cabecera de la columna */}
                            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 rounded-t-xl sticky top-0">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }}></span>
                                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">{status.label}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                        {statusClubs.length}
                                    </span>
                                </div>
                            </div>

                            {/* Zona de tarjetas (Scroll vertical) */}
                            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                                {statusClubs.map(club => (
                                    <div
                                        key={club.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, club.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => onSelect(club)}
                                        className={cn(
                                            "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm cursor-grab hover:border-emerald-500/50 transition-all",
                                            draggedClubId === club.id ? "ring-2 ring-emerald-500 opacity-50" : ""
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{club.name}</h4>
                                            {club.leadScore > 0 && (
                                                <div className="flex gap-0.5" title="Lead Score">
                                                    {[...Array(club.leadScore)].map((_, i) => (
                                                        <svg key={i} className="w-3 h-3 text-amber-400 fill-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                <span>{club.estimatedPlayers || '0'} Jugadores</span>
                                            </div>
                                            {(club.lastInteraction === "Never" || club.lastInteraction === "30d") ? (
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Requiere atención"></div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="truncate max-w-[80px]">{club.lastContactDate === "Sin contacto" ? "N/A" : club.lastContactDate}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {statusClubs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-6 text-zinc-400 dark:text-zinc-600 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg h-24">
                                        <span className="text-xs">Soltar aquí</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}