// src/components/ui/LocationManagerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from './Button';

export default function LocationManagerModal({ savedLocations, onClose, onAdd, onUpdate, onDelete }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ label: '', address: '', lat: '', lng: '' });
    
    // Referencia para el contenedor de Google (Igual que en tus clubes)
    const inputContainerRef = useRef(null);

    useEffect(() => {
        const setupAutocomplete = async () => {
            // Solo actuamos si el contenedor existe y Google está cargado
            if (!inputContainerRef.current || !window.google) return;

            try {
                // Usamos la librería moderna que usa tu CRM
                const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
                
                // Limpiamos el contenedor antes de inyectar
                inputContainerRef.current.innerHTML = '';
                
                // Creamos el elemento con restricción a España
                const autocomplete = new PlaceAutocompleteElement({ 
                    componentRestrictions: { country: ['es'] } 
                });
                
                autocomplete.style.width = '100%';
                
                // Escuchamos la selección
                autocomplete.addEventListener('gmp-placeselect', async (e) => {
                    const place = e.place;
                    await place.fetchFields({ fields: ['location', 'formattedAddress'] });
                    
                    if (place.location) {
                        setFormData(prev => ({
                            ...prev,
                            address: place.formattedAddress,
                            lat: place.location.lat(),
                            lng: place.location.lng()
                        }));
                    }
                });

                inputContainerRef.current.appendChild(autocomplete);
            } catch (error) { 
                console.error("Error Google Places:", error); 
            }
        };

        if (editingId) {
            setupAutocomplete();
        }
    }, [editingId]);

    const handleEdit = (loc) => {
        setEditingId(loc.id);
        // CORREGIDO: Ahora usamos loc.lng correctamente
        setFormData({ 
            label: loc.label || '', 
            address: loc.address || '', 
            lat: loc.lat || '', 
            lng: loc.lng || '' 
        });
    };

    const handleSave = () => {
        if (!formData.label || !formData.address || !formData.lat) {
            alert("Debes indicar un nombre y seleccionar una dirección válida de la lista.");
            return;
        }
        if (editingId === 'new') {
            onAdd(formData);
        } else {
            onUpdate(editingId, formData);
        }
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* ESTILO CSS PARA FORZAR LA LISTA DE GOOGLE ENCIMA DEL MODAL */}
            <style>{`
                .pac-container, gmp-place-autocomplete, [part="pnl"] {
                    z-index: 10001 !important;
                }
            `}</style>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                        <MapPin className="text-emerald-500" /> Gestionar Oficinas
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-zinc-900">
                    {!editingId ? (
                        <>
                            <div className="space-y-3 mb-6">
                                {savedLocations.map(loc => (
                                    <div key={loc.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 bg-zinc-50 dark:bg-zinc-900/50 transition-colors">
                                        <div className="pr-4">
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{loc.label}</h4>
                                            <p className="text-xs text-zinc-500 truncate max-w-[250px]">{loc.address || 'Sin dirección registrada'}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => handleEdit(loc)} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => onDelete(loc.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full" onClick={() => { setEditingId('new'); setFormData({ label: '', address: '', lat: '', lng: ''}); }}>
                                <Plus className="w-4 h-4 mr-2" /> Añadir Nueva Oficina
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Nombre de la Oficina</label>
                                <input 
                                    type="text" 
                                    value={formData.label} 
                                    onChange={e => setFormData({...formData, label: e.target.value})} 
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white" 
                                    placeholder="Ej: Sede Central"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Dirección Completa (Google Maps)</label>
                                
                                {/* Contenedor de Google */}
                                <div className="relative">
                                    <div ref={inputContainerRef} className="w-full rounded min-h-[40px]"></div>
                                </div>
                                
                                <p className="text-[10px] text-zinc-500 mt-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded break-words leading-relaxed">
                                    <span className="font-bold">Actual:</span> {formData.address || "Ninguna seleccionada"}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <Button variant="outline" className="flex-1" onClick={() => setEditingId(null)}>Cancelar</Button>
                                <Button className="flex-1" onClick={handleSave}>Guardar Oficina</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}