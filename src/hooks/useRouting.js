// src/hooks/useRouting.js
import { useState, useEffect } from 'react';

export const useRouting = (appId, showToast) => {
    const [showRadius, setShowRadius] = useState(false);
    const [showRoute, setShowRoute] = useState(false); 
    const [routeStops, setRouteStops] = useState([]); 

    const [savedLocations, setSavedLocations] = useState(() => {
        const saved = localStorage.getItem(`${appId}_locations`);
        return saved ? JSON.parse(saved) : [
            { id: '1', label: "Oficina Principal", lat: 39.9864, lng: -0.0513 }
        ];
    });
    const [activeOrigin, setActiveOrigin] = useState(savedLocations[0]);

    // Guardar automáticamente cualquier nueva ubicación
    useEffect(() => {
        localStorage.setItem(`${appId}_locations`, JSON.stringify(savedLocations));
    }, [savedLocations, appId]);

    const handleOptimizeRoute = async () => {
        const validStops = routeStops.filter(s => (s.lat || s.coordinates?.lat) && (s.lng || s.coordinates?.lng));
        
        if (validStops.length === 0) {
            showToast("Añade clubes con ubicación válida a la ruta.", "info");
            return;
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
            } else {
                showToast("Ruta optimizada correctamente.", "success");
            }

        } catch (error) {
            console.error("Error API Rutas:", error);
            showToast("Error al calcular ruta por carretera. Revisa la conexión.", "error");
        }
    };

    const handleOpenGoogleMapsNav = () => {
        if (routeStops.length === 0) {
            showToast("No hay ruta que exportar.", "info");
            return;
        }
        
        const originStr = `${activeOrigin.lat},${activeOrigin.lng}`;
        const stopsStr = routeStops.map(stop => {
            const lat = stop.lat || stop.coordinates?.lat;
            const lng = stop.lng || stop.coordinates?.lng;
            return `${lat},${lng}`;
        }).join('/');
        
        window.open(`https://www.google.com/maps/dir/$${originStr}/${stopsStr}/data=!4m2!4m1!3e0`, '_blank');
    };

    const toggleRouteStop = (club) => {
        const exists = routeStops.find(s => s.id === club.id);
        if (exists) {
            setRouteStops(routeStops.filter(s => s.id !== club.id));
        } else {
            setRouteStops([...routeStops, club]);
        }
    };

    const addNewLocation = () => {
        const label = window.prompt("Nombre de la ubicación (ej: Mi Casa, Hotel Madrid):");
        if (!label) return;
        const lat = window.prompt("Latitud (ej: 39.4699):");
        const lng = window.prompt("Longitud (ej: -0.3774):");
        
        if (lat && lng) {
            const newLoc = { id: Math.random().toString(), label, lat: parseFloat(lat), lng: parseFloat(lng) };
            setSavedLocations([...savedLocations, newLoc]);
            setActiveOrigin(newLoc);
            showToast("Ubicación guardada", "success");
        }
    };

    return {
        showRadius, setShowRadius,
        showRoute, setShowRoute,
        routeStops, setRouteStops,
        savedLocations, setSavedLocations,
        activeOrigin, setActiveOrigin,
        handleOptimizeRoute,
        handleOpenGoogleMapsNav,
        toggleRouteStop,
        addNewLocation
    };
};