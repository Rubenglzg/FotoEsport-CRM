// src/components/ui/LocationManagerModal.jsx
import React, { useState } from 'react';
import { MapPin, X, Edit2, Trash2, Plus, Map as MapIcon } from 'lucide-react';
import { Button } from './Button';

export default function LocationManagerModal({ savedLocations, onClose, onAdd, onUpdate, onDelete }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ label: '', address: '', lat: '', lng: '' });

    const handleEdit = (loc) => {
        setEditingId(loc.id);
        setFormData({ label: loc.label || '', address: loc.address || '', lat: loc.lat || '', lng: loc.lng || '' });
    };

    const handleSave = () => {
        if (!formData.label || !formData.lat || !formData.lng) {
            alert("El Nombre, la Latitud y la Longitud son obligatorios.");
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
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{loc.label}</h4>
                                            <p className="text-xs text-zinc-500">{loc.address || 'Sin dirección registrada'}</p>
                                            <p className="text-xs font-mono text-zinc-400 mt-1">{loc.lat}, {loc.lng}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(loc)} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => onDelete(loc.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
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
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Nombre (Ej: Oficina Madrid)</label>
                                <input type="text" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white" placeholder="Nombre identificativo"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Dirección Completa (Opcional)</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white" placeholder="Calle, Número, Ciudad..."/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Latitud</label>
                                    <input type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white" placeholder="Ej: 39.4699"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Longitud</label>
                                    <input type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white" placeholder="Ej: -0.3774"/>
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2 border border-blue-100 dark:border-blue-800 mt-2">
                                <MapIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Para obtener tus coordenadas, abre <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="font-bold underline hover:text-blue-600">Google Maps</a>, busca tu oficina, haz clic derecho sobre el punto exacto y copia los números.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <Button variant="outline" className="flex-1" onClick={() => setEditingId(null)}>Cancelar</Button>
                                <Button className="flex-1" onClick={handleSave}>Guardar Ubicación</Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}