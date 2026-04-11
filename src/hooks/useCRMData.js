// src/hooks/useCRMData.js
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'; 
import { db } from '../lib/firebase';
import { DEFAULT_STATUSES } from '../utils/constants';

export const useCRMData = (user, userProfile, isLocked, appId) => { 
    // --- DATOS FIRESTORE ---
    const [seasons, setSeasons] = useState(['2024-2025']);
    const [selectedSeason, setSelectedSeason] = useState('2024-2025');
    const [activeSeason, setActiveSeason] = useState('2024-2025');
    const [clubs, setClubs] = useState([]); 
    const [tasks, setTasks] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
    const [targetClients, setTargetClients] = useState(50);
    const [ticketMedio, setTicketMedio] = useState(15);
    const [checklistConfig, setChecklistConfig] = useState([
        { id: 'logo', label: 'Escudo Vectorial', type: 'global' },
        { id: 'roster', label: 'Listado de Jugadores', type: 'seasonal' },
        { id: 'contract', label: 'Contrato Firmado', type: 'contract' }
    ]);

    // --- SUSCRIPCIONES A FIRESTORE ---
    useEffect(() => {
        if (!user || isLocked || !userProfile) return; 
        
        const dataUid = userProfile.role === 'admin' ? user.uid : (userProfile.adminUid || user.uid);
        
        // 1. CLUBS (CON FILTRO DE ZONAS Y SOPORTE "Toda España")
        const clubsRef = collection(db, 'artifacts', appId, 'users', dataUid, 'clubs');
        let clubsQuery = clubsRef; 
        
        if (userProfile.role === 'comercial' && userProfile.allowedZones?.length > 0) {
            // Si NO tiene Toda España, filtramos. Si la tiene, dejamos que descargue todo.
            if (!userProfile.allowedZones.includes('Toda España')) {
                clubsQuery = query(clubsRef, where('provincia', 'in', userProfile.allowedZones));
            }
        }

        const unsubClubs = onSnapshot(clubsQuery, (snapshot) => {
            setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 2. TAREAS
        const tasksRef = collection(db, 'artifacts', appId, 'users', dataUid, 'tasks');
        const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 3. INTERACCIONES
        const intRef = collection(db, 'artifacts', appId, 'users', dataUid, 'interactions');
        const unsubInt = onSnapshot(intRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInteractions(data.sort((a, b) => b.createdAt - a.createdAt));
        });

        // 4. CONFIGURACIONES
        const settingsRef = doc(db, 'artifacts', appId, 'users', dataUid, 'settings', 'crm');
        const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.statuses) setStatuses(data.statuses);
                if (data.targetClients) setTargetClients(data.targetClients);
                if (data.ticketMedio) setTicketMedio(data.ticketMedio);
                if (data.seasons) setSeasons(data.seasons);
                if (data.checklistConfig) setChecklistConfig(data.checklistConfig);
                
                const seasonOficial = data.activeSeason || data.currentSeason || '2024-2025';
                setActiveSeason(seasonOficial);
                
                if (!window.hasLoadedInitialSeason) {
                    setSelectedSeason(seasonOficial);
                    window.hasLoadedInitialSeason = true;
                }
            } else {
                setStatuses(DEFAULT_STATUSES);
            }
        });

        return () => { unsubClubs(); unsubTasks(); unsubInt(); unsubSettings(); };
    }, [user, userProfile, isLocked, appId]); 

    return {
        seasons, setSeasons, selectedSeason, setSelectedSeason, activeSeason, setActiveSeason,
        clubs, setClubs, tasks, setTasks, interactions, setInteractions, statuses, setStatuses,
        targetClients, setTargetClients, ticketMedio, setTicketMedio, checklistConfig, setChecklistConfig
    };
};