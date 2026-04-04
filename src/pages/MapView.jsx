import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Target } from 'lucide-react';
import { cn } from '../utils/helpers';

export default function MapView({ clubs, selectedId, onSelect, showRadius, setShowRadius, showRoute, setShowRoute, tasks, origin, routeStops }) {
  
  // Posición inicial del mapa (Ej: Centro de España/Madrid)
  const mapCenter = [40.4168, -3.7038]; 
  const defaultZoom = 6;

  // Calculamos la ruta si está activada
  const routePoints = useMemo(() => {
      if (!showRoute) return [];
      const clubsWithTasks = clubs.filter(c => tasks.some(t => t.clubId === c.id));
      // Aquí devolvemos un array de arrays con [lat, lng] para Leaflet
      return clubsWithTasks.map(c => [c.lat, c.lng]);
  }, [showRoute, clubs, tasks]);

  // Función para crear tus pines personalizados con Tailwind
  const createCustomPin = (club, isSelected, isInRoute, routeIndex) => {
    let pinColor = "bg-zinc-400 border-zinc-300 dark:bg-zinc-600 dark:border-zinc-400";
    if (club.status === 'signed') pinColor = "bg-emerald-500 border-white shadow-[0_0_15px_rgba(16,185,129,0.5)]";
    if (club.status === 'negotiation') pinColor = "bg-amber-500 border-amber-200";
    if (club.status === 'rejected') pinColor = "bg-red-500 border-red-300 dark:bg-red-900 opacity-50";
    if (club.status === 'renewal_pending') pinColor = "bg-blue-500 border-blue-300 animate-pulse";

    const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";

    // Generamos el HTML del pin usando tus mismas clases
    const html = `
      <div class="relative group cursor-pointer transition-transform hover:scale-150">
        <div class="w-4 h-4 rounded-full border-2 ${pinColor} ${isInRoute ? 'ring-4 ring-emerald-500/50 scale-125 bg-emerald-400' : ''}">
          ${needsAttention && !isSelected ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white font-bold">!</div>` : ''}
          ${isInRoute ? `<div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold text-[10px] px-1.5 rounded-full z-30">${routeIndex + 1}</div>` : ''}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-pin', // Clase limpia sin fondo de leaflet
      html: html,
      iconSize: [16, 16],
      iconAnchor: [8, 8] // Centra el pin exactamente en las coordenadas
    });
  };

  return (
    <div className="flex-1 relative bg-zinc-100 dark:bg-[#09090b] h-full w-full">
      
      {/* Contenedor del Mapa Real */}
      <MapContainer 
        center={mapCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        zoomControl={false} // Desactivamos el control por defecto para usar los tuyos si quisieras
      >
        {/* Capa de estilo de mapa (OpenStreetMap por defecto, puedes cambiarlo por uno oscuro de CartoDB) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Dibujar la ruta */}
        {showRoute && routePoints.length > 1 && (
           <Polyline positions={routePoints} color="#10b981" weight={3} dashArray="5, 10" />
        )}

        {/* Marcadores de Clubes */}
        {clubs.map((club) => {
          const isSelected = selectedId === club.id;
          const routeIndex = routeStops.findIndex(s => s.id === club.id);
          const isInRoute = showRoute && routeIndex !== -1;

          return (
            <Marker 
              key={club.id} 
              position={[club.lat, club.lng]} 
              icon={createCustomPin(club, isSelected, isInRoute, routeIndex)}
              eventHandlers={{
                click: () => onSelect(club),
              }}
            >
              <Popup>
                <div className="text-sm font-bold text-zinc-900">{club.name}</div>
                <div className="text-xs text-zinc-500">Estado: {club.status}</div>
              </Popup>

              {/* Radio de acción */}
              {isSelected && showRadius && club.status === 'signed' && (
                <Circle 
                  center={[club.lat, club.lng]} 
                  radius={5000} // 5 km en metros
                  pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1 }}
                />
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* Tus botones flotantes inferiores (sin cambios, colocados sobre el mapa) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
         {selectedId && clubs.find(c => c.id === selectedId)?.status === 'signed' && (
           <button onClick={() => setShowRadius(!showRadius)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRadius ? "bg-emerald-500 text-white border-emerald-400" : "bg-white text-zinc-700 border-zinc-200")}>
             <Target className={cn("w-4 h-4", showRadius && "animate-spin-slow")} />
             {showRadius ? "RADAR: ON" : "RADAR"}
           </button>
         )}
         <button onClick={() => setShowRoute(!showRoute)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRoute ? "bg-zinc-900 text-white border-zinc-800" : "bg-white text-zinc-700 border-zinc-200")}>
            <Navigation className="w-4 h-4" />
            {showRoute ? "OCULTAR RUTA" : "RUTA DE VISITA"}
         </button>
      </div>
    </div>
  );
}