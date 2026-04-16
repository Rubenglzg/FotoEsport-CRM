// src/hooks/useCRMStats.js
import { useMemo } from 'react';

export const useCRMStats = (clubs, interactions, selectedSeason, filterNeedsAttention, ticketMedio, tasks, clearedNotifications) => {
    
    // 0. NUEVO: Filtramos primero los clubes por su rango de visibilidad
    const visibleClubs = useMemo(() => {
        return clubs.filter(club => {
            if (!selectedSeason) return true;
            
            // Asume que las temporadas tienen formato comparable alfabéticamente (ej: "23/24" < "24/25")
            if (club.activeFromSeason && selectedSeason < club.activeFromSeason) {
                return false;
            }
            if (club.activeUntilSeason && selectedSeason > club.activeUntilSeason) {
                return false;
            }
            return true;
        });
    }, [clubs, selectedSeason]);

    // 1. Inyectamos estado, última fecha y calculamos el LEAD SCORE
    const clubsWithSeasonalStatus = useMemo(() => {
        // ATENCIÓN: Cambiamos 'clubs.map' por 'visibleClubs.map'
        return visibleClubs.map(club => {
            const clubInteractions = interactions.filter(i => i.clubId === club.id);
            const lastIntDate = clubInteractions.length > 0 ? clubInteractions[0].date : "Sin contacto";
            const status = club.seasonStatuses?.[selectedSeason] || club.status || 'to_contact';

            let score = 0;

            if (status === 'signed' || status === 'client') {
                score = 5; 
            } else if (status === 'rejected' || status === 'not_interested') {
                score = 0; 
            } else {
                const players = Number(club.estimatedPlayers) || 0;
                if (players >= 300) score += 2.5;
                else if (players >= 150) score += 1.5;
                else if (players > 50) score += 0.5;

                if (club.interestLevel === 'high') score += 1.5;
                else if (club.interestLevel === 'medium') score += 0.5;
                else if (status === 'negotiation') score += 1.5;
                else if (status === 'lead' || status === 'prospect') score += 0.5;

                if (lastIntDate !== "Sin contacto") {
                    const daysSinceContact = (new Date() - new Date(lastIntDate)) / (1000 * 60 * 60 * 24);
                    if (daysSinceContact <= 15) score += 1;
                    else if (daysSinceContact <= 30) score += 0.5;
                }
            }

            return {
                ...club,
                lastContactDate: lastIntDate,
                status: status,
                leadScore: Math.min(Math.round(score), 5) 
            };
        });
    }, [visibleClubs, selectedSeason, interactions]);

    // 2. Filtramos la lista según alertas
    const filteredClubs = useMemo(() => 
        filterNeedsAttention 
            ? clubsWithSeasonalStatus.filter(c => c.lastInteraction === "Never" || c.lastInteraction === "30d") 
            : clubsWithSeasonalStatus, 
    [clubsWithSeasonalStatus, filterNeedsAttention]);
    
    // 3. Cuadro de mando y Valor Económico (Pipeline)
    const stats = useMemo(() => {
        const total = clubsWithSeasonalStatus.length;
        const TICKET_MEDIO = ticketMedio;
        
        let signed = 0, negotiation = 0, prospect = 0, toContact = 0, notInterested = 0;
        let pipelineValue = 0, closedValue = 0;
        const categories = {};

        clubsWithSeasonalStatus.forEach(club => {
            const status = club.status;
            const players = club.estimatedPlayers || 0; 
            const clubValue = players * TICKET_MEDIO;

            if (status === 'signed' || status === 'client') {
                signed++;
                closedValue += clubValue;
            } else if (status === 'negotiation' || status === 'lead') {
                negotiation++;
                pipelineValue += clubValue; 
            } else if (status === 'prospect') {
                prospect++;
                pipelineValue += (clubValue * 0.3); 
            } else if (status === 'to_contact') {
                toContact++;
            } else if (status === 'not_interested' || status === 'rejected') {
                notInterested++;
            }

            const cat = club.category || 'General';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        const contacted = total - toContact;
        const activeOpportunities = negotiation + prospect;

        return { 
            total, signed, negotiation, prospect, toContact, contacted, notInterested, 
            activeOpportunities, categories, pipelineValue, closedValue 
        };
    }, [clubsWithSeasonalStatus, ticketMedio]);

    // 4. Notificaciones
    const notifications = useMemo(() => {
        if (clearedNotifications) return [];
        const alerts = [];
        const staleClubs = clubs.filter(c => c.lastInteraction === "Never" || c.lastInteraction === "30d");
        if (staleClubs.length > 0) alerts.push({ type: 'alert', title: 'Leads en Enfriamiento', message: `Hay ${staleClubs.length} clubes sin contacto reciente.` });
        const highPriorityTasks = tasks.filter(t => t.priority === 'high');
        if (highPriorityTasks.length > 0) alerts.push({ type: 'info', title: 'Agenda Prioritaria', message: `Tienes ${highPriorityTasks.length} tareas de Alta Prioridad hoy.` });
        return alerts;
    }, [clubs, tasks, clearedNotifications]);

    return { filteredClubs, stats, notifications };
};