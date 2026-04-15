import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export default function NewClubModal({ userProfile, onClose, onSave }) {
  // LÓGICA DE PERMISOS "Toda España"
  const hasAllSpain = userProfile?.allowedZones?.includes('Toda España');
  const isAdminOrAllSpain = userProfile?.role === 'admin' || hasAllSpain;

  const defaultZone = (userProfile?.role === 'comercial' && !hasAllSpain && userProfile?.allowedZones?.length > 0)
                      ? userProfile.allowedZones[0] 
                      : '';

  const [formData, setFormData] = useState({
    name: '', category: 'Fútbol', provincia: defaultZone, 
    address: '', lat: '', lng: '', // <-- NUEVOS CAMPOS AÑADIDOS
    estimatedPlayers: '', totalTeams: '',
    baseTeams: '', genericEmail: '', genericPhone: '',
    contacts: [{ name: '', role: '', phone: '', email: '', isDecisionMaker: true }]
  });
  
  const [error, setError] = useState('');
  
  // REFERENCIAS PARA GOOGLE MAPS
  const adminInputRef = useRef(null);
  const addressInputRef = useRef(null); // <-- REFERENCIA PARA LA DIRECCIÓN EXACTA

  // EFECTO: Carga de Google Maps para PROVINCIA (Admin / Toda España)
  useEffect(() => {
    const initGoogle = () => {
        if (isAdminOrAllSpain && window.google && window.google.maps && window.google.maps.places && adminInputRef.current) {
            if (adminInputRef.current.hasAttribute('data-google-ready')) return;
            adminInputRef.current.setAttribute('data-google-ready', 'true');

            const autocomplete = new window.google.maps.places.Autocomplete(adminInputRef.current, {
                types: ['(regions)'], 
                componentRestrictions: { country: 'es' } 
            });
            
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place && place.name) {
                    setFormData(prev => ({ ...prev, provincia: place.name }));
                    setTimeout(() => { if (adminInputRef.current) adminInputRef.current.value = place.name; }, 10);
                }
            });
            
            adminInputRef.current.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        } else if (isAdminOrAllSpain) {
            setTimeout(initGoogle, 500);
        }
    };

    initGoogle();
  }, [isAdminOrAllSpain]);

  // EFECTO: Carga de Google Maps para UBICACIÓN EXACTA (Para todos los usuarios)
  useEffect(() => {
    const initAddressGoogle = () => {
        if (window.google && window.google.maps && window.google.maps.places && addressInputRef.current) {
            if (addressInputRef.current.hasAttribute('data-google-ready')) return;
            addressInputRef.current.setAttribute('data-google-ready', 'true');

            const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
                componentRestrictions: { country: 'es' },
                fields: ['formatted_address', 'geometry', 'name'] // Solicitamos los datos de dirección y coordenadas
            });
            
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place && place.geometry && place.geometry.location) {
                    const newAddress = place.formatted_address || place.name;
                    setFormData(prev => ({ 
                        ...prev, 
                        address: newAddress,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    }));
                    setTimeout(() => { if (addressInputRef.current) addressInputRef.current.value = newAddress; }, 10);
                }
            });

            // Evitar que el 'Enter' cierre el modal al seleccionar una sugerencia
            addressInputRef.current.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        } else {
            setTimeout(initAddressGoogle, 500);
        }
    };

    initAddressGoogle();
  }, []);

  const handleSave = () => {
      if (!formData.name.trim()) return setError("El nombre del club es obligatorio.");
      if (!formData.provincia.trim()) return setError("La Provincia / Zona es obligatoria.");
      
      // NUEVA VALIDACIÓN: La ubicación exacta es obligatoria
      if (!formData.address.trim()) return setError("La Ubicación Exacta (dirección) es obligatoria.");
      
      setError('');
      
      // Le inyectamos un ID único y la fecha de creación antes de guardar
      onSave({
          ...formData,
          id: Date.now().toString(),
          createdAt: Date.now()
      });
  };

  const addContactField = () => setFormData({ ...formData, contacts: [...formData.contacts, { name: '', role: '', phone: '', email: '', isDecisionMaker: false }] });
  const removeContact = (index) => setFormData({ ...formData, contacts: formData.contacts.filter((_, i) => i !== index) });
  const updateContact = (index, field, value) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, contacts: newContacts });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* Estilos para asegurar que las sugerencias de Google queden por encima del Modal */}
      <style>{`
          .pac-container { z-index: 100000 !important; }
      `}</style>

      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo Club Deportivo</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4"/></Button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-200"><AlertTriangle className="w-4 h-4"/> {error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Nombre del Club *</label>
              <input className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: CD Ejemplo" />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 uppercase text-emerald-600">Provincia / Zona *</label>
              <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  
                  {isAdminOrAllSpain ? (
                      <input ref={adminInputRef} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-emerald-500" value={formData.provincia} onChange={e => setFormData({...formData, provincia: e.target.value})} placeholder="Buscar provincia..." />
                  ) : (
                      <select className="w-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-lg pl-9 pr-3 py-2 text-emerald-900 dark:text-emerald-400 font-bold outline-none" value={formData.provincia} onChange={e => setFormData({...formData, provincia: e.target.value})}>
                          {userProfile.allowedZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                      </select>
                  )}
              </div>
            </div>

            {/* NUEVA CASILLA: UBICACIÓN EXACTA */}
            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase text-emerald-600">Ubicación Exacta *</label>
              <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input 
                      ref={addressInputRef} 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-emerald-500" 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      placeholder="Busca la dirección o la calle con Google..." 
                  />
              </div>
            </div>

            <div><label className="text-xs font-bold text-zinc-500 uppercase">Jugadores Aprox.</label><input type="number" className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" value={formData.estimatedPlayers} onChange={e => setFormData({...formData, estimatedPlayers: Number(e.target.value)})} placeholder="Ej: 350" /></div>
            <div><label className="text-xs font-bold text-zinc-500 uppercase">Total de Equipos</label><input type="number" className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" value={formData.totalTeams} onChange={e => setFormData({...formData, totalTeams: Number(e.target.value)})} placeholder="Ej: 15" /></div>
            <div className="col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase">Fútbol Base (Equipos)</label><input type="number" className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" value={formData.baseTeams} onChange={e => setFormData({...formData, baseTeams: Number(e.target.value)})} placeholder="Ej: 12" /></div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Teléfono Genérico</label>
              <input className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" value={formData.genericPhone} onChange={e => setFormData({...formData, genericPhone: e.target.value})} placeholder="Ej: 600123456" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Email Genérico</label>
              <input type="email" className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" value={formData.genericEmail} onChange={e => setFormData({...formData, genericEmail: e.target.value})} placeholder="Ej: info@club.com" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-sm font-bold uppercase text-emerald-600">Contactos Específicos</h3><Button variant="outline" size="sm" onClick={addContactField}><Plus className="w-3 h-3 mr-1"/> Añadir</Button></div>
            {formData.contacts.map((contact, index) => (
              <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 relative">
                {index > 0 && <button onClick={() => removeContact(index)} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>}
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Nombre" className="bg-white dark:bg-zinc-900 border rounded px-2 py-1 text-sm" value={contact.name} onChange={e => updateContact(index, 'name', e.target.value)} />
                  <input placeholder="Cargo" className="bg-white dark:bg-zinc-900 border rounded px-2 py-1 text-sm" value={contact.role} onChange={e => updateContact(index, 'role', e.target.value)} />
                  <input placeholder="Teléfono" className="bg-white dark:bg-zinc-900 border rounded px-2 py-1 text-sm" value={contact.phone} onChange={e => updateContact(index, 'phone', e.target.value)} />
                  <input placeholder="Email" className="bg-white dark:bg-zinc-900 border rounded px-2 py-1 text-sm" value={contact.email} onChange={e => updateContact(index, 'email', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="neon" onClick={handleSave}><Save className="w-4 h-4 mr-2"/> Guardar Club</Button></div>
      </div>
    </div>
  );
}