// src/hooks/useCRMData.js
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_STATUSES } from '../utils/constants';

export const useCRMData = (user, isLocked, appId) => {
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
        if (!user || isLocked) return;
        
        const clubsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'clubs');
        const unsubClubs = onSnapshot(clubsRef, (snapshot) => {
            setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
        const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const intRef = collection(db, 'artifacts', appId, 'users', user.uid, 'interactions');
        const unsubInt = onSnapshot(intRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInteractions(data.sort((a, b) => b.createdAt - a.createdAt));
        });

        const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm');
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
    }, [user, isLocked, appId]);

    // Devolvemos todos los datos y funciones para modificar los estados locales
    return {
        seasons, setSeasons,
        selectedSeason, setSelectedSeason,
        activeSeason, setActiveSeason,
        clubs, setClubs,
        tasks, setTasks,
        interactions, setInteractions,
        statuses, setStatuses,
        targetClients, setTargetClients,
        ticketMedio, setTicketMedio,
        checklistConfig, setChecklistConfig
    };
};