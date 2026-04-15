import React, { useState, useRef, useEffect } from 'react';
import { X, Users, Phone, MessageSquare, FileSignature, CheckCircle2, MapPin, Trash2, Edit2, Mic, Sparkles, Target, Shield, FileText } from 'lucide-react';
import { Button } from './Button';
import { cn, generateContractFile, summarizeWithAI, predictDateWithAI } from '../../utils/helpers';

export default function ClubDetailPanel({ 
    club, onUpdateClub, onClose, activeTab, setActiveTab, onAddTask, 
    interactions, onAddInteraction, currentSeason, onDeleteClub, 
    onUpdateInteraction, onDeleteInteraction, statuses, 
    checklistConfig = [],
    seasons = [],
    userProfile // <-- AÑADIDO
    }) {
    const [note, setNote] = useState("");
    const [interactionType, setInteractionType] = useState('manual');
    const [nextDate, setNextDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isSuggestingDate, setIsSuggestingDate] = useState(false);
    const recognitionRef = useRef(null);
    const manualStopRef = useRef(false);

    const handleAIPredictDate = async () => {
        setIsSuggestingDate(true);
        try {
            const historyText = interactions.map(i => `Fecha: ${i.date} | Vía: ${i.type} | Nota: ${i.note}`).join('\n');
            const predictedDate = await predictDateWithAI(historyText);
            
            if (predictedDate) {
                setTempRecDate(predictedDate);
                onUpdateClub({...club, recommendedContactDate: predictedDate});
            } else {
                alert("Límite de peticiones alcanzado. Por favor, espera 1 minuto.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSuggestingDate(false);
        }
    };
    
    // Estados de Edición Local
    const [tempName, setTempName] = useState(club.name);
    const [tempProvincia, setTempProvincia] = useState(club.provincia || '');
    const [contacts, setContacts] = useState(club.contacts || []);
    const [editingInteraction, setEditingInteraction] = useState(null);
    const [editNote, setEditNote] = useState("");

    const [tempPlayers, setTempPlayers] = useState(club.estimatedPlayers || '');
    const [tempTotalTeams, setTempTotalTeams] = useState(club.totalTeams || '');
    const [tempBaseTeams, setTempBaseTeams] = useState(club.baseTeams || '');
    const [tempRecDate, setTempRecDate] = useState(club.recommendedContactDate || '');
    const [tempGenericEmail, setTempGenericEmail] = useState(club.genericEmail || '');
    const [tempGenericPhone, setTempGenericPhone] = useState(club.genericPhone || '');

    // Referencias para inputs de texto y mapas
    const inputRef = useRef(null);
    const provinciaRef = useRef(null);

    // Conectar Google Maps al campo Provincia
    useEffect(() => {
        const initGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places && provinciaRef.current) {
                if (provinciaRef.current.hasAttribute('data-google-ready')) return;
                provinciaRef.current.setAttribute('data-google-ready', 'true');

                const autocomplete = new window.google.maps.places.Autocomplete(provinciaRef.current, { 
                    types: ['(regions)'], 
                    componentRestrictions: { country: 'es' } 
                });
                
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place && place.name) {
                        setTempProvincia(place.name);
                        // Guarda automáticamente al seleccionar
                        setTimeout(() => { 
                            if (provinciaRef.current) {
                                provinciaRef.current.value = place.name;
                                provinciaRef.current.blur(); 
                            }
                        }, 10);
                    }
                });
            } else {
                setTimeout(initGoogle, 500);
            }
        };
        initGoogle();
    }, []);

    // Sincronizar al cambiar de club
    useEffect(() => {
        setTempName(club.name);
        setTempProvincia(club.provincia || '');
        setContacts(club.contacts || []);
        setTempPlayers(club.estimatedPlayers || '');
        setTempTotalTeams(club.totalTeams || '');
        setTempBaseTeams(club.baseTeams || '');
        setTempRecDate(club.recommendedContactDate || '');
        setTempGenericEmail(club.genericEmail || '');
        setTempGenericPhone(club.genericPhone || '');
    }, [club.id, club.name, club.provincia, club.contacts, club.estimatedPlayers, club.totalTeams, club.baseTeams, club.recommendedContactDate, club.genericEmail, club.genericPhone]);

    // Lógicas de Actualización
    const handleSaveName = () => { if (tempName.trim() !== club.name) onUpdateClub({...club, name: tempName}); };
    const handleSaveProvincia = () => { if (tempProvincia !== club.provincia) onUpdateClub({...club, provincia: tempProvincia}); };
    const handleSavePlayers = () => { if (Number(tempPlayers) !== club.estimatedPlayers) onUpdateClub({...club, estimatedPlayers: Number(tempPlayers)}); };
    const handleSaveTotalTeams = () => { if (Number(tempTotalTeams) !== club.totalTeams) onUpdateClub({...club, totalTeams: Number(tempTotalTeams)}); };
    const handleSaveBaseTeams = () => { if (Number(tempBaseTeams) !== club.baseTeams) onUpdateClub({...club, baseTeams: Number(tempBaseTeams)}); };
    const handleSaveRecDate = () => { if (tempRecDate !== club.recommendedContactDate) onUpdateClub({...club, recommendedContactDate: tempRecDate}); };
    const handleSaveGenericEmail = () => { if (tempGenericEmail !== club.genericEmail) onUpdateClub({...club, genericEmail: tempGenericEmail}); };
    const handleSaveGenericPhone = () => { if (tempGenericPhone !== club.genericPhone) onUpdateClub({...club, genericPhone: tempGenericPhone}); };

    const currentStatus = club.seasonStatuses?.[currentSeason] || club.status || 'to_contact';

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
        if (item.type === 'seasonal') return club.assets?.[`${currentSeason}_${item.id}`];
        
        if (item.type === 'contract') {
            const isGloballyMarked = club.assets?.[item.id];
            if (!isGloballyMarked) return false; 

            const duration = club.assets?.[`${item.id}_duration`] || 1;
            const startSeason = club.assets?.[`${item.id}_startSeason`] || currentSeason;

            const startIndex = seasons.indexOf(startSeason);
            const currentIndex = seasons.indexOf(currentSeason);

            if (startIndex === -1 || currentIndex === -1) return false;

            const yearsPassed = currentIndex - startIndex;
            return yearsPassed >= 0 && yearsPassed < duration;
        }

        return club.assets?.[item.id];
    };

   const toggleDynamicAsset = (item) => {
        const isChecked = getAssetValue(item);
        let updates = { ...club.assets };
        
        if (item.type === 'seasonal') {
            updates[`${currentSeason}_${item.id}`] = !isChecked;
        } else {
            updates[item.id] = !isChecked;
            
            if (item.type === 'contract' && !isChecked) {
                updates[`${item.id}_startSeason`] = currentSeason;
                if (!updates[`${item.id}_duration`]) {
                    updates[`${item.id}_duration`] = 1; 
                }
            }
        }
        
        onUpdateClub({ ...club, assets: updates });
    };

    const updateContractDuration = (itemId, years) => {
        onUpdateClub({ ...club, assets: { ...club.assets, [`${itemId}_duration`]: years } });
    };

    // Gestión de Contactos
    const handleAddContact = () => setContacts([...contacts, { name: '', role: '', phone: '', email: '', isDecisionMaker: false, notes: '' }]);
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
            // Combinar nombre y apellidos del perfil del usuario
            const userName = userProfile?.nombre ? `${userProfile.nombre} ${userProfile.apellidos}`.trim() : "Usuario";
            
            await onAddInteraction({ 
                id: Math.random().toString(), 
                clubId: club.id, 
                type: interactionType, 
                user: userName, // Usar el nombre real
                note, 
                date: new Date().toLocaleDateString() 
            });
            
            if(nextDate) await onAddTask({ id: Math.random().toString(), clubId: club.id, task: `Seguimiento: ${interactionType === 'manual' ? 'Manual' : 'Contacto'}`, priority: 'medium', due: nextDate, time: '09:00' });
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

    // Funciones para IA y Voz
    const toggleDictation = () => {
        // Si ya está grabando, el usuario quiere pararlo manualmente
        if (isRecording) {
            manualStopRef.current = true;
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
            return;
        }

        // Si no está grabando, empezamos de cero
        manualStopRef.current = false;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta el dictado por voz.");
            return;
        }

        // Solo configuramos el reconocimiento una vez y lo guardamos
        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES';
            recognition.interimResults = false;
            
            // En móvil quitamos el modo continuo para evitar el error "caption record"
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            recognition.continuous = !isMobile;

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setNote(prev => prev + (prev ? " " : "") + finalTranscript.trim());
                }
            };

            recognition.onend = () => {
                // TRUCO: Si el usuario NO pulsó el botón de parar, volvemos a arrancar el micrófono automáticamente
                if (!manualStopRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Error al reiniciar automáticamente", e);
                        setIsRecording(false);
                    }
                } else {
                    setIsRecording(false);
                }
            };

            recognition.onerror = (event) => {
                // Ignoramos el error de silencio para que 'onend' lo reinicie
                if (event.error === 'no-speech') return; 
                
                console.error("Error de micrófono", event.error);
                if (event.error === 'not-allowed') {
                    alert("Permiso de micrófono denegado.");
                }
                
                manualStopRef.current = true;
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }

        // Iniciamos la grabación
        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Error al iniciar el micrófono", e);
            setIsRecording(false);
        }
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

    // Autocompletado CLÁSICO de Google Places
    useEffect(() => {
        // Silenciamos el aviso publicitario de Google de la consola
        const originalWarn = console.warn;
        console.warn = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('google.maps.places.Autocomplete is not available to new customers')) return;
            originalWarn.apply(console, args);
        };

        let autocomplete = null;
        let listener = null;

        const setupClassicAutocomplete = () => {
            if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) return;

            autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'es' },
                fields: ['formatted_address', 'geometry', 'name']
            });

            listener = autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                
                if (place.geometry && place.geometry.location) {
                    onUpdateClub({ 
                        ...club, 
                        address: place.formatted_address || place.name, 
                        lat: place.geometry.location.lat(), 
                        lng: place.geometry.location.lng() 
                    });
                }
            });

            inputRef.current.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        };

        setTimeout(setupClassicAutocomplete, 100);

        return () => {
            console.warn = originalWarn;
            if (listener) {
                window.google.maps.event.removeListener(listener);
            }
        };
    }, [club.id]); // Aseguramos que se reinicie si cambiamos de club

    // Variable para saber si el club tiene dirección guardada (Para el Check Verde)
    const isAddressSelected = club.address && club.lat !== undefined && club.lat !== '';

    return (
        <div className="flex-1 flex flex-col min-w-[400px] h-full bg-white dark:bg-zinc-900 transition-colors">
              {/* Estilos para que la lista clásica de Google se vea perfecta por encima del panel */}
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

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Fichas</span>
                              <input 
                                  type="number" 
                                  value={tempPlayers} 
                                  onChange={(e) => setTempPlayers(e.target.value)} 
                                  onBlur={handleSavePlayers}
                                  className="text-sm font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 300" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Equipos Tot.</span>
                              <input 
                                  type="number" 
                                  value={tempTotalTeams} 
                                  onChange={(e) => setTempTotalTeams(e.target.value)} 
                                  onBlur={handleSaveTotalTeams}
                                  className="text-sm font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 15" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> Fútbol Base</span>
                              <input 
                                  type="number" 
                                  value={tempBaseTeams} 
                                  onChange={(e) => setTempBaseTeams(e.target.value)} 
                                  onBlur={handleSaveBaseTeams}
                                  className="text-sm font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 12" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Provincia</span>
                              <input 
                                  ref={provinciaRef}
                                  type="text" 
                                  value={tempProvincia} 
                                  onChange={(e) => setTempProvincia(e.target.value)} 
                                  onBlur={handleSaveProvincia}
                                  className="text-sm font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: Tarragona" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors col-span-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Teléfono Genérico</span>
                                <input 
                                    type="tel" 
                                    value={tempGenericPhone} 
                                    onChange={(e) => setTempGenericPhone(e.target.value)} 
                                    onBlur={handleSaveGenericPhone}
                                    className="text-sm font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                    placeholder="Ej: 600123456" 
                                />
                            </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors col-span-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Email Genérico</span>
                                <input 
                                    type="email" 
                                    value={tempGenericEmail} 
                                    onChange={(e) => setTempGenericEmail(e.target.value)} 
                                    onBlur={handleSaveGenericEmail}
                                    className="text-sm font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                    placeholder="Ej: info@club.com" 
                                />
                            </div>
                      </div>

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
                      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles className="w-16 h-16 text-blue-500"/></div>
                          <h4 className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-3 tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3"/> Inteligencia y Actividad</h4>
                          
                          <div className="grid grid-cols-2 gap-4 relative z-10">
                              <div className="flex flex-col justify-end">
                                  <label className="text-[10px] text-zinc-500 block mb-1 font-bold">Último Contacto</label>
                                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-3 flex items-center h-[34px] text-xs text-zinc-700 dark:text-zinc-300 font-medium shadow-sm w-full">
                                      {club.lastContactDate || "Sin historial"}
                                  </div>
                              </div>
                              
                              <div className="flex flex-col justify-end">
                                  <label className="text-[10px] text-zinc-500 block mb-1 font-bold">Próximo Recomendado</label>
                                  <div className="flex gap-1 shadow-sm h-[34px]">
                                      <input 
                                          type="date" 
                                          value={tempRecDate} 
                                          onChange={(e) => setTempRecDate(e.target.value)} 
                                          onBlur={handleSaveRecDate}
                                          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs flex-1 outline-none focus:border-blue-500 text-zinc-900 dark:text-white h-full" 
                                      />
                                      <Button variant="primary" size="sm" onClick={handleAIPredictDate} disabled={isSuggestingDate} title="Sugerir fecha con IA" className="px-2 h-full flex items-center justify-center">
                                          <Sparkles className="w-4 h-4" />
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Equipos Tot.</span>
                              <input 
                                  type="number" 
                                  value={tempTotalTeams} 
                                  onChange={(e) => setTempTotalTeams(e.target.value)} 
                                  onBlur={handleSaveTotalTeams}
                                  className="text-sm font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 15" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> Fútbol Base</span>
                              <input 
                                  type="number" 
                                  value={tempBaseTeams} 
                                  onChange={(e) => setTempBaseTeams(e.target.value)} 
                                  onBlur={handleSaveBaseTeams}
                                  className="text-sm font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 12" 
                              />
                          </div>
                      </div>
                      
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
                                    
                                    {/* NUEVO CAMPO DE NOTAS */}
                                    <div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400 gap-2 mt-1">
                                        <FileText className="w-3 h-3 text-zinc-400"/> 
                                        <input 
                                            value={contact.notes || ''} 
                                            onChange={e => updateContact(idx, 'notes', e.target.value)} 
                                            onBlur={handleSaveContacts} 
                                            className="bg-transparent outline-none flex-1 border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 placeholder:italic" 
                                            placeholder="Notas (Ej: Trabaja de tardes, llamar por la mañana)" 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                      </div>

                      {/* NUEVA UBICACIÓN MAPA (Sencillo y sin Latitud/Longitud visibles) */}
                      <div className="relative z-50">
                          <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest">Ubicación (Mapa)</h4>
                          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex flex-col gap-3 shadow-sm">
                              <div className="w-full relative z-50">
                                  <input 
                                      ref={inputRef}
                                      type="text" 
                                      defaultValue={club.address}
                                      placeholder="Escribe la dirección del club..."
                                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white shadow-sm"
                                  />
                                  
                                  <div className={`mt-3 p-2.5 rounded-lg flex items-center gap-2 text-xs break-words leading-relaxed transition-colors duration-300 ${isAddressSelected ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-transparent'}`}>
                                      {isAddressSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                                      <span>
                                          <span className="font-bold">Dirección Guardada:</span> {club.address || "Ninguna seleccionada de la lista"}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>

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
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={toggleDictation} 
                                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-sm' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                                >
                                    <Mic className="w-3 h-3" /> {isRecording ? "Detener grabación" : "Dictar"}
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
                        {[...interactions].map(event => (
                        <div key={event.id} className="relative group">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border bg-zinc-200 border-zinc-400 dark:bg-zinc-800 dark:border-zinc-600"></div>
                            <div className="flex justify-between items-baseline mb-1">
                             <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                {event.type === 'whatsapp' ? 'WhatsApp' : event.type === 'call' ? 'Llamada' : event.type === 'manual' ? 'Manual' : event.type}
                                {/* <-- AÑADIDO: Muestra quién registró la nota --> */}
                                <span className="text-xs font-normal text-zinc-500 ml-2 border-l border-zinc-300 dark:border-zinc-700 pl-2">
                                    por {event.user || 'Desconocido'}
                                </span>
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