import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Target, MapPin, Plus, X, Car, ChevronDown, Filter, Settings } from 'lucide-react';
import { cn } from '../utils/helpers';
import { Button } from '../components/ui/Button';

import LocationManagerModal from '../components/ui/LocationManagerModal';

// Añade esto ANTES de tu componente MapView
function ResizeMap() {
  const map = useMap();
  
  useEffect(() => {
    // Le damos 400ms para que Flexbox y las transiciones terminen de acomodar la pantalla
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function MapView({ 
    clubs, selectedId, onSelect, showRadius, setShowRadius, 
    showRoute, setShowRoute, tasks, savedLocations, activeOrigin, 
    setActiveOrigin, addSavedLocation, updateSavedLocation, deleteSavedLocation, 
    addNewLocation, routeStops, setRouteStops, 
    toggleRouteStop, onOptimizeRoute, onExportRoute, statuses
}) {

    // 1. Estados para el filtro visual
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false); // <--- NUEVO ESTADO PARA EL DESPLEGABLE

    // 2. Filtramos los clubes que se van a pintar en el mapa
    const displayedClubs = statusFilter === 'all' 
        ? clubs 
        : clubs.filter(club => club.status === statusFilter);
  
  const mapCenter = [40.4168, -3.7038]; 
  const defaultZoom = 6;

  const [showLocationManager, setShowLocationManager] = useState(false);

  // Calculamos la línea de la ruta dibujada en el mapa
  const routeLine = useMemo(() => {
      if (!showRoute || !routeStops || routeStops.length === 0) return [];
      const points = [];
      
      if (activeOrigin?.lat && activeOrigin?.lng) {
          points.push([activeOrigin.lat, activeOrigin.lng]);
      }
      
      routeStops.forEach(stop => {
          if (!stop) return;
          const lat = stop.lat || stop.coordinates?.lat;
          const lng = stop.lng || stop.coordinates?.lng;
          if (lat && lng) points.push([lat, lng]);
      });
      
      return points;
  }, [showRoute, routeStops, activeOrigin]);

  // Función para crear pines con el COLOR DINÁMICO de los estados
  const createCustomPin = (club, isSelected, isInRoute, routeIndex) => {
    const statusConfig = statuses?.find(s => s.id === club.status);
    const pinHexColor = statusConfig ? statusConfig.color : '#94a3b8';
    const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";

    const html = `
      <div class="relative group cursor-pointer transition-transform hover:scale-150">
        <div class="w-4 h-4 rounded-full border-2 border-white shadow-md ${isInRoute ? 'ring-4 ring-emerald-500/50 scale-125' : ''}" style="background-color: ${pinHexColor};">
          ${needsAttention && !isSelected ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white font-bold">!</div>` : ''}
          ${isInRoute ? `<div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white font-bold text-[10px] px-1.5 rounded-full z-30 shadow-md border border-zinc-700">${routeIndex + 1}</div>` : ''}
        </div>
      </div>
    `;

    return L.divIcon({ className: 'custom-leaflet-pin', html: html, iconSize: [16, 16], iconAnchor: [8, 8] });
  };

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
      
      {/* ======================================================== */}
      {/* NUEVO FILTRO VISUAL PERSONALIZADO (Arriba a la izquierda) */}
      {/* ======================================================== */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto flex flex-col">
          {/* Botón Principal que abre/cierra */}
          <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-between gap-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 min-w-[220px]"
          >
              <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-zinc-500" />
                  <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                  
                  {/* Etiqueta Activa */}
                  {statusFilter === 'all' ? (
                     <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                         Todos los clubes
                     </span>
                  ) : (
                     <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: statuses?.find(s => s.id === statusFilter)?.color }}></span>
                         <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider truncate max-w-[120px]">
                             {statuses?.find(s => s.id === statusFilter)?.label}
                         </span>
                     </div>
                  )}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200", isFilterOpen && "rotate-180")} />
          </button>

          {/* Menú Desplegable con los colores */}
          {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden py-2 z-[1001] animate-in fade-in slide-in-from-top-2">
                  
                  <button 
                      onClick={() => { setStatusFilter('all'); setIsFilterOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors text-left"
                  >
                      <div className="w-4 h-4 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">📍</div>
                      <span className={cn("text-xs font-bold transition-colors", statusFilter === 'all' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300")}>
                          Todos los clubes
                      </span>
                  </button>
                  
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 mx-4 my-2"></div>

                  <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase text-zinc-500 tracking-widest">
                      Por Estado
                  </div>

                  {statuses?.map(s => (
                      <button 
                          key={s.id}
                          onClick={() => { setStatusFilter(s.id); setIsFilterOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors text-left group"
                      >
                          <span className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: s.color }}></span>
                          <span className={cn("text-xs font-bold transition-colors truncate", statusFilter === s.id ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200")}>{s.label}</span>
                          {statusFilter === s.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-zinc-800 dark:bg-zinc-200"></div>}
                      </button>
                  ))}
              </div>
          )}
      </div>
      {/* ======================================================== */}

    {/* PANEL FLOTANTE DEL GESTOR DE RUTAS */}
      {showRoute && (
         <div className="absolute top-20 md:top-4 right-4 left-4 md:left-auto z-[1000] w-auto md:w-80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right-8 fade-in">
             <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                 <Car className="w-5 h-5 text-emerald-500" />
                 <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Planificador de Ruta</h3>
             </div>
             
             <div className="mb-4">
               <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">1. Punto de Salida</label>
               <div className="flex gap-2">
                 <select 
                   className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs rounded-lg px-2 py-1.5 text-zinc-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
                   value={activeOrigin?.id || ''}
                   onChange={(e) => setActiveOrigin(savedLocations.find(l => l.id === e.target.value))}
                 >
                   {savedLocations?.map(loc => (
                     <option key={loc.id} value={loc.id}>{loc.label}</option>
                   ))}
                 </select>
                 
                 {/* BOTÓN DE GESTIÓN (Único botón al lado del select) */}
                 <button 
                      onClick={() => setShowLocationManager(true)} 
                      className="p-1.5 text-zinc-400 hover:text-emerald-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors"
                      title="Gestionar Oficinas"
                  >
                      <Settings size={14} />
                  </button>
               </div>
             </div>

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
        <ResizeMap />
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {showRoute && routeLine.length > 1 && (
           <Polyline positions={routeLine} color="#10b981" weight={4} dashArray="8, 8" className="animate-pulse" opacity={0.7} />
        )}

        {showRoute && activeOrigin?.lat && activeOrigin?.lng && (
            <Marker position={[activeOrigin.lat, activeOrigin.lng]} icon={createOriginPin()}>
                <Popup><div className="font-bold text-sm">Punto de Salida</div><div className="text-xs text-zinc-500">{activeOrigin.label}</div></Popup>
            </Marker>
        )}

        {/* Marcadores de Clubes */}
        {displayedClubs.map((club) => {
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
                    
                    <div className="text-xs font-bold mt-1 px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: `${statuses?.find(s => s.id === club.status)?.color}20`, color: statuses?.find(s => s.id === club.status)?.color }}>
                        {statuses?.find(s => s.id === club.status)?.label || club.status}
                    </div>

                    {showRoute && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleRouteStop(club); }}
                            className={cn("w-full text-xs font-bold py-1.5 rounded-md transition-colors mt-3", isInRoute ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100")}
                        >
                            {isInRoute ? "- Quitar de Ruta" : "+ Añadir a Ruta"}
                        </button>
                    )}
                </div>
              </Popup>

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
      <div className="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 w-max max-w-[90vw]">
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

      {/* MODAL GESTOR DE OFICINAS */}
        {showLocationManager && (
            <LocationManagerModal
                savedLocations={savedLocations}
                onClose={() => setShowLocationManager(false)}
                onAdd={addSavedLocation}
                onUpdate={updateSavedLocation}
                onDelete={deleteSavedLocation}
            />
        )}

    </div>
  );
}