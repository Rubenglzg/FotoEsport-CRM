import React, { useState, useRef, useEffect } from 'react';
import { X, Users, Phone, MessageSquare, FileSignature, CheckCircle2, MapPin, Trash2, Edit2, Mic, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { cn, generateContractFile, summarizeWithAI } from '../../utils/helpers';

export default function ClubDetailPanel({ 
    club, onUpdateClub, onClose, activeTab, setActiveTab, onAddTask, 
    interactions, onAddInteraction, currentSeason, onDeleteClub, 
    onUpdateInteraction, onDeleteInteraction, statuses, 
    checklistConfig = [],
    seasons = []
    }) {
    const [note, setNote] = useState("");
    const [interactionType, setInteractionType] = useState('call');
    const [nextDate, setNextDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    
    // Estados de Edición Local
    const [tempName, setTempName] = useState(club.name);
    const [contacts, setContacts] = useState(club.contacts || []);
    const [editingInteraction, setEditingInteraction] = useState(null);
    const [editNote, setEditNote] = useState("");

    const inputContainerRef = useRef(null);

    // Sincronizar al cambiar de club
    useEffect(() => {
        setTempName(club.name);
        setContacts(club.contacts || []);
    }, [club.id, club.name, club.contacts]);

    // Lógicas de Actualización del Club
    const handleSaveName = () => { if (tempName.trim() !== club.name) onUpdateClub({...club, name: tempName}); };
    // Leemos el estado de la temporada actual
    const currentStatus = club.seasonStatuses?.[currentSeason] || club.status || 'to_contact';

    // Guardamos el cambio dentro del registro de la temporada
    const handleStatusChange = (e) => {
        onUpdateClub({
            ...club, 
            seasonStatuses: {
                ...club.seasonStatuses,
                [currentSeason]: e.target.value
            }
        });
    };
    const handleSaveContacts = () => onUpdateClub({...club, contacts});
    const getAssetValue = (item) => {
        // 1. Requisitos anuales (Ej: Plantillas)
        if (item.type === 'seasonal') return club.assets?.[`${currentSeason}_${item.id}`];
        
        // 2. Requisitos de Contrato (El cálculo matemático)
        if (item.type === 'contract') {
            const isGloballyMarked = club.assets?.[item.id];
            if (!isGloballyMarked) return false; // Si nunca se firmó, es false

            const duration = club.assets?.[`${item.id}_duration`] || 1;
            const startSeason = club.assets?.[`${item.id}_startSeason`] || currentSeason;

            const startIndex = seasons.indexOf(startSeason);
            const currentIndex = seasons.indexOf(currentSeason);

            if (startIndex === -1 || currentIndex === -1) return false;

            // Diferencia en años desde que se firmó hasta el año que estás mirando en la barra superior
            const yearsPassed = currentIndex - startIndex;

            // El contrato es válido SI: no estás mirando al pasado (antes de que se firmara) 
            // Y SI los años pasados son menores a la duración del contrato.
            return yearsPassed >= 0 && yearsPassed < duration;
        }

        // 3. Requisitos Globales para siempre (Ej: Logo)
        return club.assets?.[item.id];
    };

   const toggleDynamicAsset = (item) => {
        const isChecked = getAssetValue(item);
        let updates = { ...club.assets };
        
        if (item.type === 'seasonal') {
            updates[`${currentSeason}_${item.id}`] = !isChecked;
        } else {
            updates[item.id] = !isChecked;
            
            // NUEVO: Si es un contrato y lo estás marcando como hecho, guarda la temporada inicial
            if (item.type === 'contract' && !isChecked) {
                updates[`${item.id}_startSeason`] = currentSeason;
                if (!updates[`${item.id}_duration`]) {
                    updates[`${item.id}_duration`] = 1; // Por defecto 1 año
                }
            }
        }
        
        onUpdateClub({ ...club, assets: updates });
    };

    const updateContractDuration = (itemId, years) => {
        onUpdateClub({ ...club, assets: { ...club.assets, [`${itemId}_duration`]: years } });
    };

    // Gestión de Contactos
    const handleAddContact = () => setContacts([...contacts, { name: '', role: '', phone: '', email: '', isDecisionMaker: false }]);
    const updateContact = (index, field, value) => {
        const newContacts = [...contacts];
        newContacts[index][field] = value;
        setContacts(newContacts);
    };
    const removeContact = (index) => {
        const newContacts = contacts.filter((_, i) => i !== index);
        setContacts(newContacts);
        onUpdateClub({...club, contacts: newContacts});
    };

    // Gestión de Interacciones
    const handleAddInteraction = async () => {
        if(!note) return;
        setIsSubmitting(true);
        try {
            await onAddInteraction({ id: Math.random().toString(), clubId: club.id, type: interactionType, user: "Tú", note, date: new Date().toLocaleDateString() });
            if(nextDate) await onAddTask({ id: Math.random().toString(), clubId: club.id, task: `Seguimiento: ${interactionType === 'call' ? 'Llamada' : 'Contacto'}`, priority: 'medium', due: nextDate, time: '09:00' });
            setNote(""); setNextDate("");
        } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
    };
    const startEditInteraction = (event) => {
        setEditingInteraction(event.id);
        setEditNote(event.note);
    };
    const saveEditInteraction = async (id) => {
        await onUpdateInteraction(id, editNote);
        setEditingInteraction(null);
        setEditNote("");
    };

    // --- NUEVAS FUNCIONES PARA IA Y VOZ ---
    const startDictation = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta el dictado por voz. Prueba en Google Chrome.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNote(prev => prev + (prev ? " " : "") + transcript);
        };
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event) => {
            console.error("Error de micrófono", event.error);
            setIsRecording(false);
        };
        
        recognition.start();
    };

    const handleAISummary = async () => {
        if (!note.trim()) return;
        setIsSummarizing(true);
        try {
            const summary = await summarizeWithAI(note);
            setNote(summary);
        } catch (error) {
            alert("Hubo un error al resumir. Revisa la consola.");
        } finally {
            setIsSummarizing(false);
        }
    };

    // Autocompletado de Google Places
    useEffect(() => {
        const setupModernAutocomplete = async () => {
            if (!inputContainerRef.current || !window.google) return;
            try {
                const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
                inputContainerRef.current.innerHTML = '';
                const autocomplete = new PlaceAutocompleteElement({ componentRestrictions: { country: ['es'] } });
                autocomplete.style.width = '100%'; autocomplete.style.boxSizing = 'border-box';
                autocomplete.addEventListener('gmp-placeselect', async (e) => {
                    const place = e.place;
                    await place.fetchFields({ fields: ['location', 'formattedAddress'] });
                    if (place.location) onUpdateClub({ ...club, address: place.formattedAddress, lat: place.location.lat(), lng: place.location.lng() });
                });
                inputContainerRef.current.appendChild(autocomplete);
            } catch (error) { console.error("Error Google Places:", error); }
        };
        setupModernAutocomplete();
    }, [club.id]);

    return (
        <div className="flex-1 flex flex-col min-w-[400px] h-full bg-white dark:bg-zinc-900 transition-colors">
              {/* CABECERA (NOMBRE Y ESTADO) */}
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 relative bg-zinc-50 dark:bg-zinc-900/50">
                 <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X className="w-5 h-5"/></button>
                 <div className="flex items-start gap-4 mb-2 pr-6">
                    <div className="w-12 h-12 rounded-lg flex flex-shrink-0 items-center justify-center text-lg font-bold border bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      {club.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <input 
                         value={tempName} 
                         onChange={(e) => setTempName(e.target.value)} 
                         onBlur={handleSaveName}
                         className="text-lg font-bold text-zinc-900 dark:text-white leading-tight bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-emerald-500 outline-none w-full transition-colors"
                         placeholder="Nombre del Club"
                      />
                      <select 
                         value={currentStatus}
                         onChange={handleStatusChange}
                         className="mt-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded py-1 px-2 outline-none text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer shadow-sm"
                      >
                         {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                 </div>
              </div>

              {/* PESTAÑAS */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                 <button onClick={() => setActiveTab('details')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'details' ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-900")}>Gestión</button>
                 <button onClick={() => setActiveTab('timeline')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'timeline' ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-900")}>Actividad</button>
              </div>

              {/* CONTENIDO DEL PANEL */}
              <div className="flex-1 overflow-y-auto p-6">
                 {activeTab === 'details' ? (
                   <div className="space-y-8">
                      {/* Contactos Editables */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Contactos</h4>
                            <button onClick={handleAddContact} className="text-[10px] text-emerald-600 font-bold hover:underline">+ Añadir</button>
                        </div>
                        {contacts.map((contact, idx) => (
                            <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg mb-2 relative group focus-within:ring-1 focus-within:ring-emerald-500">
                                <button onClick={() => removeContact(idx)} title="Eliminar Contacto" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                                <input value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} onBlur={handleSaveContacts} className="font-bold text-zinc-800 dark:text-zinc-200 text-sm bg-transparent outline-none w-[90%] border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 placeholder:font-normal mb-1" placeholder="Nombre completo" />
                                <input value={contact.role} onChange={e => updateContact(idx, 'role', e.target.value)} onBlur={handleSaveContacts} className="text-xs text-zinc-500 mb-2 bg-transparent outline-none w-full border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700" placeholder="Cargo (Ej: Presidente)" />
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400 gap-2"><Phone className="w-3 h-3 text-zinc-400"/> <input value={contact.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} onBlur={handleSaveContacts} className="bg-transparent outline-none flex-1 border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700" placeholder="Teléfono" /></div>
                                    <div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400 gap-2"><MessageSquare className="w-3 h-3 text-zinc-400"/> <input value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} onBlur={handleSaveContacts} className="bg-transparent outline-none flex-1 border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700" placeholder="Correo electrónico" /></div>
                                </div>
                            </div>
                        ))}
                      </div>

                      {/* Ubicación Mapa */}
                      <div className="relative z-50">
                          <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest">Ubicación (Mapa)</h4>
                          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex flex-col gap-3 shadow-sm">
                              <div className="w-full relative z-50">
                                  <div ref={inputContainerRef} className="w-full rounded"></div>
                                  <div className="text-[10px] text-zinc-500 mt-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded break-words leading-relaxed" title={club.address}><span className="font-bold text-zinc-600 dark:text-zinc-400">Actual:</span> {club.address || "Ninguna"}</div>
                              </div>
                              <div className="flex gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                  <div className="flex-1 min-w-0"><label className="text-[9px] text-zinc-500 block mb-1">LATITUD</label><input type="number" step="any" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono" value={club.lat || ''} onChange={(e) => onUpdateClub({ ...club, lat: parseFloat(e.target.value) || 0 })} /></div>
                                  <div className="flex-1 min-w-0"><label className="text-[9px] text-zinc-500 block mb-1">LONGITUD</label><input type="number" step="any" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono" value={club.lng || ''} onChange={(e) => onUpdateClub({ ...club, lng: parseFloat(e.target.value) || 0 })} /></div>
                              </div>
                          </div>
                      </div>

                      {/* Assets y Contrato DINÁMICO */}
                      <div>
                          <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest flex justify-between">
                              <span>Requisitos y Contrato</span>
                              <span className="text-emerald-500">{currentSeason}</span>
                          </h4>
                          <button onClick={() => generateContractFile(club.name, currentSeason)} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg shadow-sm hover:shadow-md transition-all mb-4">
                              <FileSignature className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-bold text-zinc-800 dark:text-white">Generar Contrato PDF</span>
                          </button>
                          
                          <div className="space-y-2">
                              {checklistConfig.map(item => {
                                  const isChecked = getAssetValue(item);
                                  
                                  return (
                                      <div key={item.id} className={cn("flex flex-col gap-2 p-2.5 rounded border transition-all", isChecked ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800")}>
                                          
                                          {/* Check Principal */}
                                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleDynamicAsset(item)}>
                                              <div className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0", isChecked ? "bg-emerald-500 border-emerald-500 text-white dark:text-black" : "bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600")}>
                                                  {isChecked && <CheckCircle2 className="w-3 h-3"/>}
                                              </div>
                                              <div className="flex flex-col">
                                                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                                      {item.label}
                                                  </span>
                                                  <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                                                      {item.type === 'global' ? '🌍 Para siempre' : item.type === 'seasonal' ? '🔄 Renovación Anual' : '📜 Documento Legal'}
                                                  </span>
                                              </div>
                                          </div>

                                          {/* Selector de Duración (Solo si es Contrato y está marcado) */}
                                          {item.type === 'contract' && isChecked && (
                                              <div className="pl-7 pt-2 mt-1 border-t border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-2">
                                                  <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Válido por:</label>
                                                  <select 
                                                      value={club.assets?.[`${item.id}_duration`] || 1}
                                                      onChange={(e) => updateContractDuration(item.id, parseInt(e.target.value))}
                                                      className="text-xs bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-500/30 rounded px-1.5 py-1 outline-none focus:border-emerald-500 text-zinc-800 dark:text-zinc-200 font-bold"
                                                  >
                                                      <option value={1}>1 Temporada (Solo {currentSeason})</option>
                                                      <option value={2}>2 Temporadas</option>
                                                      <option value={3}>3 Temporadas</option>
                                                      <option value={4}>4 Temporadas</option>
                                                      <option value={5}>5 Temporadas</option>
                                                  </select>
                                              </div>
                                          )}
                                          
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Botón Peligro: Eliminar Club */}
                      <div className="pt-6 mt-6 border-t border-red-100 dark:border-red-500/10">
                          <button onClick={onDeleteClub} className="w-full py-2.5 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 rounded-lg transition-colors text-sm font-bold">
                              <Trash2 className="w-4 h-4" /> Eliminar Club Permanentemente
                          </button>
                      </div>

                   </div>
                  ) : (
                   <div className="space-y-6">
                     <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Registrar Interacción</label>
                            
                            {/* NUEVOS BOTONES DE HERRAMIENTAS */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={startDictation} 
                                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                                >
                                    <Mic className="w-3 h-3" /> {isRecording ? "Escuchando..." : "Dictar"}
                                </button>
                                <button 
                                    onClick={handleAISummary} 
                                    disabled={!note || isSummarizing}
                                    className="flex items-center gap-1 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 text-[10px] font-bold px-2 py-1 rounded transition-colors dark:bg-indigo-500/20 dark:text-indigo-400"
                                >
                                    <Sparkles className="w-3 h-3" /> {isSummarizing ? "Procesando..." : "Resumir con IA"}
                                </button>
                            </div>
                        </div>

                        <textarea className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 resize-none min-h-[80px]" placeholder="Pega aquí el chat de WhatsApp o usa el botón de dictar para grabar una nota de voz..." value={note} onChange={(e) => setNote(e.target.value)} />
                        
                        <div className="flex items-center gap-2 pt-2">
                             <div className="flex-1">
                                <input type="date" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 w-full outline-none focus:border-emerald-500" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
                             </div>
                             <Button variant="primary" size="sm" onClick={handleAddInteraction} disabled={!note} isLoading={isSubmitting}>Guardar Historial</Button>
                        </div>
                     </div>

                     <div className="space-y-6 border-l border-zinc-200 dark:border-zinc-800 ml-2 mt-6 pl-4 pb-4">
                     {interactions.map(event => (
                       <div key={event.id} className="relative group">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border bg-zinc-200 border-zinc-400 dark:bg-zinc-800 dark:border-zinc-600"></div>
                          <div className="flex justify-between items-baseline mb-1">
                             <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                {event.type === 'whatsapp' ? 'WhatsApp' : event.type === 'call' ? 'Llamada' : event.type}
                            </span>
                             <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-zinc-500">{event.date}</span>
                                 <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                     <button onClick={() => startEditInteraction(event)} className="text-blue-500 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5"/></button>
                                     <button onClick={() => onDeleteInteraction(event.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                                 </div>
                             </div>
                          </div>
                          
                          {editingInteraction === event.id ? (
                              <div className="mt-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-blue-200 dark:border-blue-900/50">
                                  <textarea className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-blue-500 resize-none" rows={2} value={editNote} onChange={e => setEditNote(e.target.value)} />
                                  <div className="flex gap-2 mt-2">
                                      <Button size="sm" onClick={() => saveEditInteraction(event.id)}>Guardar</Button>
                                      <Button size="sm" variant="ghost" onClick={() => { setEditingInteraction(null); setEditNote(""); }}>Cancelar</Button>
                                  </div>
                              </div>
                          ) : (
                              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded border border-zinc-200 dark:border-zinc-800/50">{event.note}</p>
                          )}
                       </div>
                     ))}
                   </div>
                   </div>
                 )}
              </div>
           </div>
    );
}