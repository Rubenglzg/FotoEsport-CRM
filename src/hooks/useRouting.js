// src/hooks/useRouting.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useRouting = (appId, showToast, user) => {
    const [showRadius, setShowRadius] = useState(false);
    const [showRoute, setShowRoute] = useState(false); 
    const [routeStops, setRouteStops] = useState([]); 

    // Estado inicial por defecto (mientras carga de Firebase)
    const [savedLocations, setSavedLocations] = useState([
        { id: '1', label: "Oficina Principal", address: "Sede Central", lat: 39.9864, lng: -0.0513 }
    ]);
    const [activeOrigin, setActiveOrigin] = useState(null);

    // 1. CARGAR OFICINAS DESDE FIREBASE AL INICIAR SESIÓN
    useEffect(() => {
        if (!user) return;
        
        const loadLocations = async () => {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists() && docSnap.data().savedLocations) {
                    const locs = docSnap.data().savedLocations;
                    setSavedLocations(locs);
                    setActiveOrigin(locs[0] || null);
                } else {
                    setActiveOrigin(savedLocations[0]);
                }
            } catch (error) {
                console.error("Error al cargar oficinas:", error);
            }
        };
        
        loadLocations();
    }, [user]);

    // 2. FUNCIÓN PARA GUARDAR EN LA NUBE
    const syncToFirebase = async (newLocations) => {
        setSavedLocations(newLocations); // Actualiza la UI al instante
        if (!user) return;
        try {
            const docRef = doc(db, 'users', user.uid);
            await setDoc(docRef, { savedLocations: newLocations }, { merge: true });
        } catch (error) {
            console.error("Error al sincronizar oficinas:", error);
            showToast("Error al guardar en la nube", "error");
        }
    };

    // --- FUNCIONES CRUD MODIFICADAS PARA USAR FIREBASE ---
    const addSavedLocation = (loc) => {
        const newLoc = { id: Math.random().toString(), ...loc, lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };
        const updatedLocations = [...savedLocations, newLoc];
        syncToFirebase(updatedLocations);
        setActiveOrigin(newLoc);
        showToast("Oficina guardada en la nube", "success");
    };

    const updateSavedLocation = (id, updatedLoc) => {
        const newLocations = savedLocations.map(l => l.id === id ? { ...l, ...updatedLoc, lat: parseFloat(updatedLoc.lat), lng: parseFloat(updatedLoc.lng) } : l);
        syncToFirebase(newLocations);
        if (activeOrigin?.id === id) {
            setActiveOrigin(newLocations.find(l => l.id === id));
        }
        showToast("Oficina actualizada", "success");
    };

    const deleteSavedLocation = (id) => {
        if (savedLocations.length === 1) {
            showToast("Debes tener al menos una oficina registrada.", "error");
            return;
        }
        if (window.confirm("¿Estás seguro de eliminar esta oficina de la base de datos?")) {
            const updatedLocations = savedLocations.filter(l => l.id !== id);
            syncToFirebase(updatedLocations);
            
            // Si borramos la que estaba seleccionada, elegimos la primera de la lista
            if (activeOrigin?.id === id) {
                setActiveOrigin(updatedLocations[0] || null);
            }
            showToast("Oficina eliminada", "success");
        }
    };
    // ---------------------------------------------

    const handleOptimizeRoute = async () => {
        const validStops = routeStops.filter(s => (s.lat || s.coordinates?.lat) && (s.lng || s.coordinates?.lng));
        if (validStops.length === 0) {
            showToast("Añade clubes con ubicación válida a la ruta.", "info"); return;
        }
        showToast("Calculando ruta por carretera (coche)...", "info");
        try {
            const coordinatesStr = [
                `${activeOrigin.lng},${activeOrigin.lat}`,
                ...validStops.map(stop => {
                    const lat = stop.lat || stop.coordinates?.lat;
                    const lng = stop.lng || stop.coordinates?.lng;
                    return `${lng},${lat}`;
                })
            ].join(';');

            const response = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordinatesStr}?source=first&roundtrip=false`);
            if (!response.ok) throw new Error("Error en servidor de rutas");
            const data = await response.json();

            const optimizedRoute = [];
            data.waypoints.forEach((wp, requestIndex) => {
                if (requestIndex === 0) return; 
                optimizedRoute[wp.waypoint_index] = validStops[requestIndex - 1];
            });

            setRouteStops(optimizedRoute.filter(Boolean)); 

            if (data.trips && data.trips.length > 0) {
                const durationMin = Math.round(data.trips[0].duration / 60);
                const distanceKm = (data.trips[0].distance / 1000).toFixed(1);
                showToast(`Ruta lista: ${distanceKm} km en coche (Aprox. ${durationMin} min)`, "success");
            } else { showToast("Ruta optimizada correctamente.", "success"); }
        } catch (error) {
            console.error("Error API Rutas:", error); showToast("Error al calcular ruta.", "error");
        }
    };

    const handleOpenGoogleMapsNav = () => {
        if (routeStops.length === 0) { showToast("No hay ruta que exportar.", "info"); return; }
        const originStr = `${activeOrigin.lat},${activeOrigin.lng}`;
        const stopsStr = routeStops.map(stop => {
            const lat = stop.lat || stop.coordinates?.lat; const lng = stop.lng || stop.coordinates?.lng;
            return `${lat},${lng}`;
        }).join('/');
        window.open(`https://www.google.com/maps/dir/${originStr}/${stopsStr}/data=!4m2!4m1!3e0`, '_blank');
    };

    const toggleRouteStop = (club) => {
        const exists = routeStops.find(s => s.id === club.id);
        if (exists) setRouteStops(routeStops.filter(s => s.id !== club.id));
        else setRouteStops([...routeStops, club]);
    };

    return {
        showRadius, setShowRadius, showRoute, setShowRoute, routeStops, setRouteStops,
        savedLocations, setSavedLocations, activeOrigin, setActiveOrigin,
        handleOptimizeRoute, handleOpenGoogleMapsNav, toggleRouteStop,
        addSavedLocation, updateSavedLocation, deleteSavedLocation
    };
};