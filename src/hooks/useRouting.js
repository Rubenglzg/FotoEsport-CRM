// src/hooks/useRouting.js
import { useState, useEffect } from 'react';

export const useRouting = (appId, showToast) => {
    const [showRadius, setShowRadius] = useState(false);
    const [showRoute, setShowRoute] = useState(false); 
    const [routeStops, setRouteStops] = useState([]); 

    const [savedLocations, setSavedLocations] = useState(() => {
        const saved = localStorage.getItem(`${appId}_locations`);
        return saved ? JSON.parse(saved) : [
            { id: '1', label: "Oficina Principal", address: "Sede Central", lat: 39.9864, lng: -0.0513 }
        ];
    });
    
    const [activeOrigin, setActiveOrigin] = useState(savedLocations[0] || null);

    // Guardar automáticamente cualquier nueva ubicación
    useEffect(() => {
        localStorage.setItem(`${appId}_locations`, JSON.stringify(savedLocations));
        // Asegurarnos de que el activeOrigin no sea uno que acabamos de borrar
        if (activeOrigin && !savedLocations.find(l => l.id === activeOrigin.id)) {
            setActiveOrigin(savedLocations[0] || null);
        }
    }, [savedLocations, appId, activeOrigin]);

    // --- NUEVAS FUNCIONES CRUD DE UBICACIONES ---
    const addSavedLocation = (loc) => {
        const newLoc = { id: Math.random().toString(), ...loc, lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };
        setSavedLocations([...savedLocations, newLoc]);
        setActiveOrigin(newLoc);
        showToast("Oficina creada", "success");
    };

    const updateSavedLocation = (id, updatedLoc) => {
        const newLocations = savedLocations.map(l => l.id === id ? { ...l, ...updatedLoc, lat: parseFloat(updatedLoc.lat), lng: parseFloat(updatedLoc.lng) } : l);
        setSavedLocations(newLocations);
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
        if (window.confirm("¿Estás seguro de eliminar esta oficina?")) {
            setSavedLocations(savedLocations.filter(l => l.id !== id));
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
        window.open(`https://www.google.com/maps/dir/$${originStr}/${stopsStr}/data=!4m2!4m1!3e0`, '_blank');
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