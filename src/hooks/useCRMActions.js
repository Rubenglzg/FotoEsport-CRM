// src/hooks/useCRMActions.js
import { doc, setDoc, updateDoc, writeBatch, deleteDoc, FieldPath, collection, query, where, getDocs, deleteField } from 'firebase/firestore';
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
        if (!window.confirm("¿Estás seguro de eliminar este club? Se perderán todos sus datos, tareas y actividades asociadas.")) return;
        
        showToast("Eliminando club y datos asociados...", "info");

        try {
            const batch = writeBatch(db);

            // 1. Eliminar el documento del club principal
            const clubRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', clubId);
            batch.delete(clubRef);

            // 2. Buscar y eliminar todas las interacciones (actividades) asociadas a este club
            const interactionsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'interactions');
            const qInteractions = query(interactionsRef, where('clubId', '==', clubId));
            const interactionsSnapshot = await getDocs(qInteractions);
            
            interactionsSnapshot.forEach((docSnap) => {
                batch.delete(docSnap.ref);
            });

            // 3. Buscar y eliminar todas las tareas asociadas a este club
            const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
            const qTasks = query(tasksRef, where('clubId', '==', clubId));
            const tasksSnapshot = await getDocs(qTasks);
            
            for (const taskDoc of tasksSnapshot.docs) {
                const taskData = taskDoc.data();
                
                // Si la tarea tenía un evento programado en Google Calendar, lo eliminamos también
                if (taskData.googleEventId && googleToken) {
                    try {
                        await deleteGoogleCalendarEvent(taskData.googleEventId, googleToken, () => {
                            setGoogleToken(null);
                            showToast("La sesión del Calendario ha caducado. El evento debe borrarse manualmente.", "error");
                        });
                    } catch (err) {
                        console.error("Error al borrar evento de calendario:", err);
                    }
                }
                
                // Añadimos la tarea al lote de borrado de Firestore
                batch.delete(taskDoc.ref);
            }

            // 4. Ejecutar todas las eliminaciones en Firebase al mismo tiempo (atomicidad)
            await batch.commit();

            setSelectedClub(null);
            showToast("Club y toda su actividad eliminados", "success");
        } catch (e) { 
            console.error("Error eliminando club en cascada:", e); 
            showToast("Error al eliminar los datos del club", "error");
        }
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
                // USAMOS FIELDPATH AQUÍ PARA PERMITIR LA BARRA "/" EN EL NOMBRE
                batch.update(clubRef, new FieldPath('seasonStatuses', newSeasonName), newStatus);
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
        // 1. Identificar clubes que SOLO existen en esta temporada
        const clubsToDelete = clubs.filter(club => {
            const statuses = club.seasonStatuses || {};
            const keys = Object.keys(statuses);
            return keys.length === 1 && keys[0] === seasonName;
        });

        // 2. Identificar clubes que están en esta temporada pero también en otras
        const clubsToUpdate = clubs.filter(club => {
            const statuses = club.seasonStatuses || {};
            const keys = Object.keys(statuses);
            return keys.includes(seasonName) && keys.length > 1;
        });

        // 3. Generar mensaje de confirmación dinámico
        let confirmMessage = `⚠️ ADVERTENCIA: Estás a punto de eliminar la temporada "${seasonName}".`;
        
        if (clubsToDelete.length > 0) {
            confirmMessage = `⚠️ ADVERTENCIA: Estás a punto de eliminar la temporada "${seasonName}".\n\n🚨 IMPORTANTE: Hay ${clubsToDelete.length} club(es) que SOLO existen en esta temporada. Si continúas, también se eliminarán por completo todos los datos asociados a esos clubes.\n\n¿Deseas continuar?`;
        } else {
            confirmMessage += `\n\n¿Deseas continuar?`;
        }

        if (!window.confirm(confirmMessage)) return;
        
        const updatedSeasons = seasons.filter(s => s !== seasonName);
        if (updatedSeasons.length === 0) {
            showToast("Debe quedar al menos una temporada en el CRM", "error");
            return;
        }

        try {
            // Usamos writeBatch para hacer todas las eliminaciones y ediciones a la vez
            const batch = writeBatch(db);

            // A) Eliminar los clubes huérfanos por completo
            clubsToDelete.forEach(club => {
                const clubRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', club.id);
                batch.delete(clubRef);
            });

            // B) Eliminar el registro de esta temporada en los clubes que sobreviven
            clubsToUpdate.forEach(club => {
                const clubRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', club.id);
                batch.update(clubRef, new FieldPath('seasonStatuses', seasonName), deleteField());
            });

            // C) Actualizar la configuración general de temporadas
            const updates = { seasons: updatedSeasons };
            if (activeSeason === seasonName) {
                updates.activeSeason = updatedSeasons[0];
                setActiveSeason(updatedSeasons[0]);
            }
            if (selectedSeason === seasonName) {
                setSelectedSeason(updatedSeasons[0]);
                updates.currentSeason = updatedSeasons[0];
            }
            
            const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm');
            batch.update(settingsRef, updates);

            // Ejecutamos todos los cambios a la base de datos juntos
            await batch.commit();
            
            // Si el usuario tenía seleccionado en el panel lateral un club que acaba de ser eliminado, lo deseleccionamos
            const selectedClubWasDeleted = clubsToDelete.some(c => c.id === window.currentSelectedClubId);
            if (selectedClubWasDeleted && typeof setSelectedClub === 'function') {
                setSelectedClub(null);
            }

            showToast("Temporada y datos relacionados eliminados", "success");

        } catch (error) {
            console.error("Error al eliminar la temporada:", error);
            showToast("Error al eliminar la temporada", "error");
        }
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