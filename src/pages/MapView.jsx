import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Target, MapPin, Plus, X, Car } from 'lucide-react';
import { cn } from '../utils/helpers';
import { Button } from '../components/ui/Button';

export default function MapView({ 
  clubs, selectedId, onSelect, 
  showRadius, setShowRadius, 
  showRoute, setShowRoute, 
  tasks, 
  // Nuevas props del Gestor de Rutas
  savedLocations, activeOrigin, setActiveOrigin, addNewLocation,
  routeStops = [], setRouteStops, toggleRouteStop, onOptimizeRoute, onExportRoute
}) {
  
  const mapCenter = [40.4168, -3.7038]; 
  const defaultZoom = 6;

  // Calculamos la línea de la ruta dibujada en el mapa (Origen + Paradas ordenadas)
  const routeLine = useMemo(() => {
      if (!showRoute || !routeStops || routeStops.length === 0) return [];
      const points = [];
      
      if (activeOrigin?.lat && activeOrigin?.lng) {
          points.push([activeOrigin.lat, activeOrigin.lng]);
      }
      
      routeStops.forEach(stop => {
          if (!stop) return; // <--- ESTO EVITA EL CRASHEO
          const lat = stop.lat || stop.coordinates?.lat;
          const lng = stop.lng || stop.coordinates?.lng;
          if (lat && lng) points.push([lat, lng]);
      });
      
      return points;
  }, [showRoute, routeStops, activeOrigin]);

  // Función para crear tus pines personalizados con Tailwind
  const createCustomPin = (club, isSelected, isInRoute, routeIndex) => {
    let pinColor = "bg-zinc-400 border-zinc-300 dark:bg-zinc-600 dark:border-zinc-400";
    if (club.status === 'signed') pinColor = "bg-emerald-500 border-white shadow-[0_0_15px_rgba(16,185,129,0.5)]";
    if (club.status === 'negotiation') pinColor = "bg-amber-500 border-amber-200";
    if (club.status === 'rejected') pinColor = "bg-red-500 border-red-300 dark:bg-red-900 opacity-50";
    if (club.status === 'renewal_pending') pinColor = "bg-blue-500 border-blue-300 animate-pulse";

    const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";

    const html = `
      <div class="relative group cursor-pointer transition-transform hover:scale-150">
        <div class="w-4 h-4 rounded-full border-2 ${pinColor} ${isInRoute ? 'ring-4 ring-emerald-500/50 scale-125 bg-emerald-400' : ''}">
          ${needsAttention && !isSelected ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white font-bold">!</div>` : ''}
          ${isInRoute ? `<div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white font-bold text-[10px] px-1.5 rounded-full z-30 shadow-md border border-zinc-700">${routeIndex + 1}</div>` : ''}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-pin',
      html: html,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  // Marcador especial para el Origen (La Base)
  const createOriginPin = () => {
      const html = `
      <div class="relative group cursor-pointer transition-transform hover:scale-110">
        <div class="w-6 h-6 rounded-lg bg-zinc-900 border-2 border-white flex items-center justify-center shadow-xl">
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
      </div>`;
      return L.divIcon({ className: 'custom-leaflet-pin', html: html, iconSize: [24, 24], iconAnchor: [12, 12] });
  };

  return (
    <div className="flex-1 relative bg-zinc-100 dark:bg-[#09090b] h-full w-full">
      
      {/* PANEL FLOTANTE DEL GESTOR DE RUTAS */}
      {showRoute && (
         <div className="absolute top-4 right-4 z-[1000] w-80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right-8 fade-in">
             <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                 <Car className="w-5 h-5 text-emerald-500" />
                 <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Planificador de Ruta</h3>
             </div>
             
             {/* Selección de Origen */}
             <div className="mb-4">
               <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">1. Punto de Salida</label>
               <div className="flex gap-2">
                 <select 
                   className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs rounded-lg px-2 py-1.5 text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
                   value={activeOrigin?.id || ''}
                   onChange={(e) => setActiveOrigin(savedLocations.find(l => l.id === e.target.value))}
                 >
                   {savedLocations?.map(loc => (
                     <option key={loc.id} value={loc.id}>{loc.label}</option>
                   ))}
                 </select>
                 <button onClick={addNewLocation} className="px-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Añadir nueva ubicación">
                     <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                 </button>
               </div>
             </div>

             {/* Paradas Seleccionadas */}
             <div className="mb-4">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1 flex justify-between">
                    <span>2. Paradas a visitar</span>
                    <span className="text-emerald-500">{routeStops.length} Clubes</span>
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                   {routeStops.length === 0 ? (
                      <div className="text-zinc-400 dark:text-zinc-500 text-xs italic text-center py-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                          Haz clic en los pines del mapa para añadir clubes a la ruta.
                      </div>
                   ) : (
                      // Añadimos filter(Boolean) aquí por seguridad extrema
                      routeStops.filter(Boolean).map((stop, i) => (
                         <div key={stop.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1.5 rounded-lg text-xs group">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate"><span className="text-zinc-400 mr-1">{i+1}.</span>{stop.name}</span>
                            <button onClick={() => toggleRouteStop(stop)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                                <X className="w-3 h-3" />
                            </button>
                         </div>
                      ))
                   )}
                </div>
             </div>

             {/* Acciones */}
             <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button onClick={onOptimizeRoute} className="flex-1 text-xs py-2" variant="primary" disabled={routeStops.length === 0}>
                    Optimizar
                </Button>
                <Button onClick={onExportRoute} className="flex-1 text-xs py-2" variant="outline" disabled={routeStops.length === 0}>
                    Navegar (GPS)
                </Button>
             </div>
         </div>
      )}

      {/* Contenedor del Mapa Real */}
      <MapContainer 
        center={mapCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Dibujar la ruta desde Origen a Paradas */}
        {showRoute && routeLine.length > 1 && (
           <Polyline positions={routeLine} color="#10b981" weight={4} dashArray="8, 8" className="animate-pulse" opacity={0.7} />
        )}

        {/* Pin del Origen Activo */}
        {showRoute && activeOrigin?.lat && activeOrigin?.lng && (
            <Marker position={[activeOrigin.lat, activeOrigin.lng]} icon={createOriginPin()}>
                <Popup><div className="font-bold text-sm">Punto de Salida</div><div className="text-xs text-zinc-500">{activeOrigin.label}</div></Popup>
            </Marker>
        )}

        {/* Marcadores de Clubes */}
        {clubs.map((club) => {
          const isSelected = selectedId === club.id;
          const routeIndex = routeStops.findIndex(s => s.id === club.id);
          const isInRoute = showRoute && routeIndex !== -1;
          
          const lat = club.lat || club.coordinates?.lat;
          const lng = club.lng || club.coordinates?.lng;
          if(!lat || !lng) return null;

          return (
            <Marker 
              key={club.id} 
              position={[lat, lng]} 
              icon={createCustomPin(club, isSelected, isInRoute, routeIndex)}
              eventHandlers={{
                click: () => onSelect(club),
              }}
            >
              <Popup>
                <div className="p-1">
                    <div className="text-sm font-bold text-zinc-900">{club.name}</div>
                    <div className="text-xs text-zinc-500 mb-2">Estado: {club.status}</div>
                    
                    {/* Botón rápido para añadir a la ruta desde el Popup */}
                    {showRoute && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleRouteStop(club); }}
                            className={cn("w-full text-xs font-bold py-1.5 rounded-md transition-colors mt-1", isInRoute ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100")}
                        >
                            {isInRoute ? "- Quitar de Ruta" : "+ Añadir a Ruta"}
                        </button>
                    )}
                </div>
              </Popup>

              {/* Radio de acción */}
              {isSelected && showRadius && club.status === 'signed' && (
                <Circle 
                  center={[lat, lng]} 
                  radius={5000} 
                  pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }}
                />
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* Botones Flotantes Inferiores */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
         {selectedId && clubs.find(c => c.id === selectedId)?.status === 'signed' && (
           <button onClick={() => setShowRadius(!showRadius)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRadius ? "bg-emerald-500 text-white border-emerald-400" : "bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-white dark:border-zinc-800")}>
             <Target className={cn("w-4 h-4", showRadius && "animate-spin-slow")} />
             {showRadius ? "RADAR: ON" : "RADAR"}
           </button>
         )}
         <button onClick={() => { setShowRoute(!showRoute); if(showRoute) setRouteStops([]); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRoute ? "bg-zinc-900 text-white border-zinc-800" : "bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-white dark:border-zinc-800")}>
            <Navigation className="w-4 h-4" />
            {showRoute ? "CERRAR RUTA" : "CREAR RUTA"}
         </button>
      </div>
    </div>
  );
}