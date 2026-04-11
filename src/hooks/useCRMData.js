// src/hooks/useCRMData.js
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'; // <-- AÑADIDO: query y where
import { db } from '../lib/firebase';
import { DEFAULT_STATUSES } from '../utils/constants';

// <-- AÑADIDO: userProfile en los parámetros
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
        // <-- AÑADIDO: Esperamos a tener userProfile también
        if (!user || isLocked || !userProfile) return; 
        
        // <-- NUEVA LÓGICA: ¿De quién es la base de datos que vamos a leer?
        // Si eres admin, lees tu propia base de datos (user.uid).
        // Si es un comercial, debe leer la base de datos del admin (userProfile.adminUid).
        const dataUid = userProfile.role === 'admin' ? user.uid : (userProfile.adminUid || user.uid);
        
        // 1. CLUBS (CON FILTRO DE ZONAS)
        const clubsRef = collection(db, 'artifacts', appId, 'users', dataUid, 'clubs');
        let clubsQuery = clubsRef; // Por defecto (admin), traemos todos
        
        // Si es comercial y tiene zonas asignadas, filtramos la consulta
        if (userProfile.role === 'comercial' && userProfile.allowedZones?.length > 0) {
            // ATENCIÓN: Asumimos que en tus clubes tienes un campo llamado 'provincia' o 'zona'
            clubsQuery = query(clubsRef, where('provincia', 'in', userProfile.allowedZones));
        }

        const unsubClubs = onSnapshot(clubsQuery, (snapshot) => {
            setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 2. TAREAS (Leen de la misma base de datos central)
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
    }, [user, userProfile, isLocked, appId]); // <-- AÑADIDO: userProfile en las dependencias

    return {
        seasons, setSeasons, selectedSeason, setSelectedSeason, activeSeason, setActiveSeason,
        clubs, setClubs, tasks, setTasks, interactions, setInteractions, statuses, setStatuses,
        targetClients, setTargetClients, ticketMedio, setTicketMedio, checklistConfig, setChecklistConfig
    };
};