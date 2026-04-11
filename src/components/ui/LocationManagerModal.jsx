import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Edit2, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export default function LocationManagerModal({ savedLocations, onClose, onAdd, onUpdate, onDelete }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ label: '', address: '', lat: '', lng: '' });
    
    // Referencia para el input de texto clásico
    const inputRef = useRef(null);

    // API CLÁSICA DE GOOGLE MAPS CON FILTRO DE CONSOLA
    useEffect(() => {
        // --- 1. MAGIA AQUÍ: Silenciamos SOLO el aviso de Google ---
        const originalWarn = console.warn;
        console.warn = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('google.maps.places.Autocomplete is not available to new customers')) {
                return; // Si es el aviso de Google, lo ignoramos y no lo imprimimos
            }
            originalWarn.apply(console, args); // Si es otra cosa, lo mostramos normal
        };
        // ---------------------------------------------------------

        let autocomplete = null;
        let listener = null;

        const setupClassicAutocomplete = () => {
            if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
                return;
            }

            // Usamos la versión clásica ligada a un <input>
            autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'es' },
                fields: ['formatted_address', 'geometry', 'name']
            });

            // Escuchamos el evento clásico
            listener = autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                
                if (place.geometry && place.geometry.location) {
                    setFormData(prev => ({
                        ...prev,
                        address: place.formatted_address || place.name,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    }));
                }
            });

            // Prevenir que al pulsar "Enter" en la lista de Google se envíe un formulario
            inputRef.current.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        };

        if (editingId) {
            // Pequeño retraso para asegurar que el <input> existe en el HTML antes de inyectar Google
            setTimeout(setupClassicAutocomplete, 100);
        }

        return () => {
            // --- 2. Restauramos la consola original al cerrar para ser limpios ---
            console.warn = originalWarn;
            if (listener) {
                window.google.maps.event.removeListener(listener);
            }
        };
    }, [editingId]);

    const handleEdit = (loc) => {
        setEditingId(loc.id);
        setFormData({ 
            label: loc.label || '', 
            address: loc.address || '', 
            lat: loc.lat || '', 
            lng: loc.lng || '' 
        });
    };

    const handleSave = () => {
        if (!formData.label || formData.label.trim() === '') {
            alert("❌ Faltan datos: Debes escribir el nombre de la oficina.");
            return;
        }
        
        if (!formData.lat || formData.lat === '') {
            alert("❌ Faltan datos: Debes seleccionar una dirección de la lista desplegable de Google.");
            return;
        }

        if (editingId === 'new') {
            onAdd(formData);
        } else {
            onUpdate(editingId, formData);
        }
        setEditingId(null);
    };

    const isAddressSelected = formData.address && formData.lat !== '';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* ESTO ES CRUCIAL PARA LA VERSIÓN CLÁSICA: Obliga a la lista a salir por encima del modal */}
            <style>{`
                .pac-container {
                    z-index: 99999 !important;
                    font-family: inherit;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                    border: 1px solid #e4e4e7;
                    margin-top: 4px;
                }
                .pac-item { padding: 8px 12px; cursor: pointer; }
                .pac-item:hover { background-color: #f4f4f5; }
                .dark .pac-container { background-color: #18181b; border-color: #27272a; }
                .dark .pac-item { color: #a1a1aa; border-top-color: #27272a; }
                .dark .pac-item:hover { background-color: #27272a; }
                .dark .pac-item-query { color: #fff; }
            `}</style>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                        <MapPin className="text-emerald-500" /> Gestionar Oficinas
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Quitamos overflow para que la lista no se recorte */}
                <div className={`p-6 flex-1 bg-white dark:bg-zinc-900 rounded-b-2xl ${editingId ? 'overflow-visible' : 'overflow-y-auto'}`}>
                    
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
                        <div className="space-y-5 flex flex-col">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Nombre de la Oficina <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.label} 
                                    onChange={e => setFormData(prev => ({...prev, label: e.target.value}))} 
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white" 
                                    placeholder="Ej: Sede Central"
                                />
                            </div>
                            
                            <div className="flex-1 relative z-50">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Buscador de Dirección <span className="text-red-500">*</span>
                                </label>
                                
                                {/* INPUT CLÁSICO DE GOOGLE */}
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    defaultValue={formData.address}
                                    placeholder="Empieza a escribir una calle, ciudad..."
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white shadow-sm"
                                />
                                
                                <div className={`mt-3 p-2.5 rounded-lg flex items-center gap-2 text-xs break-words leading-relaxed transition-colors duration-300 ${isAddressSelected ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-transparent'}`}>
                                    {isAddressSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                                    <span>
                                        <span className="font-bold">Dirección Guardada:</span> {formData.address || "Ninguna seleccionada de la lista"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-2">
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