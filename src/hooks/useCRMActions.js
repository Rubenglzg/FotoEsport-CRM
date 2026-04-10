// src/hooks/useCRMActions.js
import { doc, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { exportToCSV } from '../utils/helpers';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '../services/googleCalendar';

export const useCRMActions = ({
    user, appId, showToast, clubs, tasks, seasons, activeSeason, selectedSeason, 
    checklistConfig, setActiveSeason, setSelectedSeason, googleToken, setGoogleToken,
    setSelectedClub
}) => {

    const handleSeedDatabase = async () => {
        if(!user) return;
        try {
            // Nota: Si no usas SEED_CLUBS, puedes omitir esta función o importarla de tus constantes
            showToast("Base de datos inicializada (Requiere variables SEED).", "info");
        } catch (e) { console.error(e); }
    };

    const handleCreateClub = async (newClubData) => {
        if(!user) return;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', newClubData.id), newClubData);
            showToast("Club añadido exitosamente", "success");
            return true;
        } catch (error) {
            console.error("Error al crear club:", error);
            showToast("Error al crear el club", "error");
            return false;
        }
    };

    const handleUpdateClub = async (updatedClub) => {
        if(!user) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', updatedClub.id), updatedClub);
        // Si el club estaba seleccionado en el panel derecho, también actualizamos su vista
        setSelectedClub(prev => prev?.id === updatedClub.id ? updatedClub : prev);
    };

    const handleDeleteClub = async (clubId) => {
        if (!window.confirm("¿Estás seguro de eliminar este club? Se perderán todos sus datos.")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', clubId));
            setSelectedClub(null);
            showToast("Club eliminado", "success");
        } catch (e) { console.error(e); }
    };

    const handleUpdateChecklist = async (newChecklist) => {
        if(!user) return;
        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), 
                { checklistConfig: newChecklist }, { merge: true }
            );
            showToast("Configuración de requisitos actualizada", "success");
        } catch (error) {
            showToast("Error al guardar la configuración", "error");
        }
    };

    const addTask = async (newTask) => {
        if(!user) return;
        let googleEventId = null;
        if (googleToken) {
           googleEventId = await createGoogleCalendarEvent(newTask, googleToken, clubs);
        }
        const taskToSave = { ...newTask, googleEventId: googleEventId || null };
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', newTask.id.toString()), taskToSave);
    };

    const deleteTask = async (taskId) => {
        if(!user) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
            try {
                const taskToDelete = tasks.find(t => t.id.toString() === taskId.toString());
                if (taskToDelete && taskToDelete.googleEventId && googleToken) {
                    await deleteGoogleCalendarEvent(taskToDelete.googleEventId, googleToken, () => {
                        setGoogleToken(null);
                        showToast("La sesión del Calendario ha caducado.", "error");
                    });
                }
                await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId.toString()));
                showToast("Tarea eliminada del CRM y del Calendario", "success");
            } catch (error) {
                showToast("Error al eliminar", "error");
            }
        }
    };

    const updateTaskPriority = async (taskId) => {
        if(!user) return;
        const task = tasks.find(t => t.id === taskId);
        if(task) {
            const newPriority = task.priority === 'high' ? 'medium' : 'high';
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), { priority: newPriority });
        }
    };

    const addInteraction = async (interaction) => {
        if(!user) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', interaction.id.toString()), { ...interaction, createdAt: Date.now() });
    };

    const handleUpdateInteraction = async (interactionId, newNote) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', interactionId), {
                note: newNote, updatedAt: Date.now()
            });
            showToast("Actividad actualizada", "success");
        } catch (e) { console.error(e); }
    };

    const handleDeleteInteraction = async (interactionId) => {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', interactionId));
            showToast("Actividad eliminada", "success");
        } catch (e) { console.error(e); }
    };

    const handleUpdateStatuses = async (newStatuses) => {
        if(!user) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { statuses: newStatuses }, { merge: true });
        showToast("Estados actualizados", "success");
    };

    const handleUpdateTargetClients = async (newTarget) => {
        if(!user) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { targetClients: Number(newTarget) }, { merge: true });
        showToast("Objetivos actualizados", "success");
    };

    const handleUpdateTicketMedio = async (newTicket) => {
        if(!user) return;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { ticketMedio: Number(newTicket) }, { merge: true });
        showToast("Ticket medio actualizado", "success");
    };

    const handleAddSeason = async (newSeasonName) => {
        if (!newSeasonName || seasons.includes(newSeasonName)) {
            showToast("Nombre inválido o la temporada ya existe", "error");
            return;
        }

        const updatedSeasons = [...seasons, newSeasonName];
        const previousSeason = activeSeason; 
        
        showToast("Creando temporada y calculando estados...", "info");

        try {
            const batch = writeBatch(db);

            clubs.forEach(club => {
                const prevStatus = club.seasonStatuses?.[previousSeason] || club.status || 'to_contact';
                let newStatus = 'to_contact';

                if (prevStatus === 'rejected') newStatus = 'rejected'; 
                else if (prevStatus === 'to_contact') newStatus = 'to_contact'; 
                else if (prevStatus === 'prospect') newStatus = 'to_contact'; 
                else if (prevStatus === 'lead' || prevStatus === 'negotiation') newStatus = 'prospect'; 
                else if (prevStatus === 'signed') {
                    let isContractValid = false;
                    const contractItem = checklistConfig.find(item => item.type === 'contract');
                    
                    if (contractItem && club.assets?.[contractItem.id]) {
                        const duration = club.assets[`${contractItem.id}_duration`] || 1;
                        const startSeason = club.assets[`${contractItem.id}_startSeason`] || previousSeason;
                        
                        const startIndex = updatedSeasons.indexOf(startSeason);
                        const newSeasonIndex = updatedSeasons.indexOf(newSeasonName);
                        
                        if (startIndex !== -1 && newSeasonIndex !== -1 && (newSeasonIndex - startIndex) < duration) {
                            isContractValid = true;
                        }
                    }
                    newStatus = isContractValid ? 'signed' : 'lead';
                }

                const clubRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', club.id);
                batch.update(clubRef, { [`seasonStatuses.${newSeasonName}`]: newStatus });
            });

            const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm');
            batch.update(settingsRef, { seasons: updatedSeasons, activeSeason: newSeasonName });

            await batch.commit(); 
            
            setActiveSeason(newSeasonName);
            setSelectedSeason(newSeasonName); 
            showToast(`Temporada ${newSeasonName} lista.`, "success");

        } catch (error) {
            console.error(error);
            showToast("Error al procesar los clubes", "error");
        }
    };

    const handleEditSeason = async (oldName, newName) => {
        if (!newName || (seasons.includes(newName) && oldName !== newName)) {
            showToast("Nombre inválido o ya existe", "error");
            return;
        }
        const updatedSeasons = seasons.map(s => s === oldName ? newName : s);
        const updates = { seasons: updatedSeasons };
        
        if (selectedSeason === oldName) {
            updates.currentSeason = newName;
            setSelectedSeason(newName);
        }
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), updates, { merge: true });
        showToast("Temporada actualizada", "success");
    };

    const handleSetOfficialActiveSeason = async (seasonName) => {
        if(!user) return;
        setActiveSeason(seasonName);
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { activeSeason: seasonName }, { merge: true });
        showToast(`Temporada ${seasonName} establecida como Oficial`, "success");
    };

    const handleDeleteSeason = async (seasonName) => {
        if (!window.confirm(`⚠️ ADVERTENCIA: Estás a punto de eliminar la temporada "${seasonName}".`)) return;
        
        const updatedSeasons = seasons.filter(s => s !== seasonName);
        if (updatedSeasons.length === 0) {
            showToast("Debe quedar al menos una temporada en el CRM", "error");
            return;
        }
        
        const updates = { seasons: updatedSeasons };
        if (activeSeason === seasonName) {
            updates.activeSeason = updatedSeasons[0];
            setActiveSeason(updatedSeasons[0]);
        }
        if (selectedSeason === seasonName) {
            setSelectedSeason(updatedSeasons[0]);
        }
        
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), updates, { merge: true });
        showToast("Temporada eliminada", "success");
    };

    const handleExportSeason = (seasonName) => {
        exportToCSV(clubs, seasonName);
        showToast(`Resumen exportado`, "success");
    };

    const handleActiveSeasonChange = async (newSeason) => {
        setSelectedSeason(newSeason);
        if (user) {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { currentSeason: newSeason }, { merge: true });
        }
    };

    return {
        handleSeedDatabase, handleCreateClub, handleUpdateClub, handleDeleteClub,
        handleUpdateChecklist, addTask, deleteTask, updateTaskPriority, addInteraction,
        handleUpdateInteraction, handleDeleteInteraction, handleUpdateStatuses,
        handleUpdateTargetClients, handleUpdateTicketMedio, handleAddSeason,
        handleEditSeason, handleSetOfficialActiveSeason, handleDeleteSeason,
        handleExportSeason, handleActiveSeasonChange
    };
};