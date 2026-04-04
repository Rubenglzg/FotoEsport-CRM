import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Phone, MessageSquare, FileSignature, CheckCircle2, MapPin } from 'lucide-react';
import { Button } from './Button';
import { cn, generateContractFile } from '../../utils/helpers';

export default function ClubDetailPanel({ club, onUpdateClub, onClose, activeTab, setActiveTab, onAddTask, interactions, onAddInteraction, currentSeason }) {
    const [note, setNote] = useState("");
    const [interactionType, setInteractionType] = useState('call');
    const [nextDate, setNextDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [addressInput, setAddressInput] = useState(club.address || "");
    const autoCompleteRef = useRef();
    const inputRef = useRef();

    const handleAddInteraction = async () => {
        if(!note) return;
        setIsSubmitting(true);
        try {
            await onAddInteraction({ id: Math.random().toString(), clubId: club.id, type: interactionType, user: "Tú", note, date: new Date().toLocaleDateString() });
            if(nextDate) {
                await onAddTask({ id: Math.random().toString(), clubId: club.id, task: `Seguimiento: ${interactionType === 'call' ? 'Llamada' : 'Contacto'}`, priority: 'medium', due: nextDate, time: '09:00' });
            }
            setNote(""); setNextDate("");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleAsset = (assetKey) => onUpdateClub({ ...club, assets: { ...club.assets, [assetKey]: !club.assets[assetKey] } });

    // Configuración del Autocompletado de Google
    useEffect(() => {
        // 1. Cargamos la librería de forma asíncrona si no está
        const setupAutocomplete = async () => {
            const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
            
            if (inputRef.current && !autoCompleteRef.current) {
                // Creamos el nuevo elemento de autocompletado
                const autocomplete = new PlaceAutocompleteElement({
                    inputElement: inputRef.current,
                    componentRestrictions: { country: "es" }
                });

                autoCompleteRef.current = autocomplete;

                // El nuevo evento es 'gmp-placeselect'
                autocomplete.addEventListener("gmp-placeselect", ({ settlement }) => {
                    const place = autocomplete.value; // El lugar seleccionado
                    
                    if (place && place.location) {
                        const lat = place.location.lat();
                        const lng = place.location.lng();
                        const formattedAddress = place.formattedAddress;
                        
                        setAddressInput(formattedAddress);
                        onUpdateClub({
                            ...club,
                            address: formattedAddress,
                            lat: lat,
                            lng: lng
                        });
                    }
                });
            }
        };

        if (window.google) {
            setupAutocomplete();
        }
    }, [club, onUpdateClub]);

    // Sincronizar el input cuando cambia de club
    useEffect(() => {
        setAddressInput(club.address || "");
    }, [club.id]);


    return (
        <div className="flex-1 flex flex-col min-w-[400px] h-full bg-white dark:bg-zinc-900 transition-colors">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 relative bg-zinc-50 dark:bg-zinc-900/50">
                 <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X className="w-5 h-5"/></button>
                 <div className="flex items-start gap-4 mb-4">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold border", club.status === 'signed' ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20" : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700")}>
                      {club.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">{club.name}</h2>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 flex items-center gap-2"><Users className="w-3 h-3" /> {club.category}</p>
                    </div>
                 </div>
              </div>

              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                 <button onClick={() => setActiveTab('details')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'details' ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-900")}>Gestión</button>
                 <button onClick={() => setActiveTab('timeline')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'timeline' ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-900")}>Actividad</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                 {activeTab === 'details' ? (
                   <div className="space-y-8">
                      {/* Contactos */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest">Contactos</h4>
                        {club.contacts && club.contacts.map((contact, idx) => (
                            <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg mb-2">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{contact.name}</span>
                                </div>
                                <div className="text-xs text-zinc-500 mb-2">{contact.role}</div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400 gap-2"><Phone className="w-3 h-3"/> {contact.phone}</div>
                                    <div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400 gap-2"><MessageSquare className="w-3 h-3"/> {contact.email}</div>
                                </div>
                            </div>
                        ))}
                      </div>

                      {/* --- SECCIÓN: UBICACIÓN (GOOGLE PLACES + MANUAL) --- */}
                      <div>
                          <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest">Ubicación (Mapa)</h4>
                          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex flex-col gap-3 shadow-sm">
                              
                              <div className="flex gap-2">
                                  <div className="flex-1 relative">
                                      <MapPin className="absolute left-2.5 top-2 w-4 h-4 text-zinc-400" />
                                      <input 
                                          ref={inputRef}
                                          type="text"
                                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded py-1.5 pl-8 pr-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
                                          value={addressInput}
                                          onChange={(e) => {
                                              setAddressInput(e.target.value);
                                              onUpdateClub({ ...club, address: e.target.value });
                                          }}
                                          placeholder="Empieza a escribir la dirección..."
                                      />
                                  </div>
                              </div>
                              
                              <div className="flex gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                  <div className="flex-1">
                                      <label className="text-[9px] text-zinc-500 block mb-1">LATITUD EXACTA</label>
                                      <input 
                                          type="number" step="any"
                                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                                          value={club.lat || ''}
                                          onChange={(e) => onUpdateClub({ ...club, lat: parseFloat(e.target.value) || 0 })}
                                      />
                                  </div>
                                  <div className="flex-1">
                                      <label className="text-[9px] text-zinc-500 block mb-1">LONGITUD EXACTA</label>
                                      <input 
                                          type="number" step="any"
                                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                                          value={club.lng || ''}
                                          onChange={(e) => onUpdateClub({ ...club, lng: parseFloat(e.target.value) || 0 })}
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                      {/* ----------------------------------------------- */}

                      {/* Assets y Contrato */}
                      <div>
                          <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest">Requisitos y Contrato</h4>
                          <button onClick={() => generateContractFile(club.name, currentSeason)} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg shadow-sm hover:shadow-md transition-all mb-4">
                              <FileSignature className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-bold text-zinc-800 dark:text-white">Generar Contrato PDF</span>
                          </button>
                          
                          <div className="space-y-2">
                              {['hasLogo', 'hasRoster', 'contractSigned'].map(key => (
                                  <div key={key} onClick={() => toggleAsset(key)} className={cn("flex items-center gap-3 p-2 rounded cursor-pointer border transition-all", club.assets?.[key] ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800")}>
                                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center", club.assets?.[key] ? "bg-emerald-500 border-emerald-500 text-white dark:text-black" : "bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600")}>
                                          {club.assets?.[key] && <CheckCircle2 className="w-3 h-3"/>}
                                      </div>
                                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                          {key === 'hasLogo' ? 'Escudo Vectorial' : key === 'hasRoster' ? 'Listado Jugadores' : 'Contrato Firmado'}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6">
                     <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg space-y-3 shadow-sm">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Registrar Interacción</label>
                        <textarea className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 resize-none" rows={2} placeholder={`Notas...`} value={note} onChange={(e) => setNote(e.target.value)} />
                        <div className="flex items-center gap-2 pt-2">
                             <div className="flex-1">
                                <input type="date" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 w-full outline-none focus:border-emerald-500" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
                             </div>
                             <Button variant="primary" size="sm" onClick={handleAddInteraction} disabled={!note} isLoading={isSubmitting}>Guardar</Button>
                        </div>
                     </div>
                     <div className="space-y-6 border-l border-zinc-200 dark:border-zinc-800 ml-2 mt-6">
                     {interactions.map(event => (
                       <div key={event.id} className="relative pl-6">
                          <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border bg-zinc-200 border-zinc-400 dark:bg-zinc-800 dark:border-zinc-600"></div>
                          <div className="flex justify-between items-baseline mb-1">
                             <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 capitalize">{event.type}</span>
                             <span className="text-[10px] text-zinc-500">{event.date}</span>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded border border-zinc-200 dark:border-zinc-800/50">{event.note}</p>
                       </div>
                     ))}
                   </div>
                   </div>
                 )}
              </div>
           </div>
    );
}