import React, { useState, useRef, useEffect } from 'react';
import { X, Users, Phone, ChevronDown, ChevronUp, MessageSquare, FileSignature, CheckCircle2, MapPin, Trash2, Edit2, Mic, Sparkles, Target, Shield, FileText, User, Briefcase, Mail, Search, Check, Clock, PhoneCall } from 'lucide-react';
import { Button } from './Button';
import { cn, generateContractFile, summarizeWithAI, predictDateWithAI } from '../../utils/helpers';

export default function ClubDetailPanel({ 
    club, onUpdateClub, onClose, activeTab, setActiveTab, onAddTask, 
    interactions, onAddInteraction, currentSeason, onDeleteClub, 
    onUpdateInteraction, onDeleteInteraction, statuses, onUpdate, sportsList,
    checklistConfig = [],
    seasons = [],
    userProfile,
    teamUsers = []
    }) {
    const [note, setNote] = useState("");
    const [interactionType, setInteractionType] = useState('manual');
    const [nextDate, setNextDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isSuggestingDate, setIsSuggestingDate] = useState(false);
    const recognitionRef = useRef(null);
    const [expandedContactIdx, setExpandedContactIdx] = useState(null);
    const manualStopRef = useRef(false);
    const [interactionDate, setInteractionDate] = useState(new Date().toISOString().split('T')[0]);

    const [tempActiveFrom, setTempActiveFrom] = useState(club.activeFromSeason || '');
    const [tempActiveUntil, setTempActiveUntil] = useState(club.activeUntilSeason || '');

    // ESTADOS DEL SELECTOR VISUAL DE COMERCIALES
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assignSearch, setAssignSearch] = useState('');

    // Función para alternar el desplegable
    const toggleContact = (idx) => {
        setExpandedContactIdx(expandedContactIdx === idx ? null : idx);
    };

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
    const [tempCategory, setTempCategory] = useState(Array.isArray(club.category) ? club.category : (club.category ? [club.category] : []));
    const [tempAddress, setTempAddress] = useState(club.address || '');

    const [tempPlayers, setTempPlayers] = useState(club.estimatedPlayers || '');
    const [tempTotalTeams, setTempTotalTeams] = useState(club.totalTeams || '');
    const [tempBaseTeams, setTempBaseTeams] = useState(club.baseTeams || '');
    const [tempRecDate, setTempRecDate] = useState(club.recommendedContactDate || '');
    const [tempGenericEmail, setTempGenericEmail] = useState(club.genericEmail || '');
    const [tempGenericPhone, setTempGenericPhone] = useState(club.genericPhone || '');
    const [tempAssignedTo, setTempAssignedTo] = useState(Array.isArray(club.assignedTo) ? club.assignedTo : (club.assignedTo ? [club.assignedTo] : []));
    const [isSportsOpen, setIsSportsOpen] = useState(false);

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
        setTempAssignedTo(Array.isArray(club.assignedTo) ? club.assignedTo : (club.assignedTo ? [club.assignedTo] : []));
        setTempCategory(Array.isArray(club.category) ? club.category : (club.category ? [club.category] : []));
        setTempActiveFrom(club.activeFromSeason || '');
        setTempActiveUntil(club.activeUntilSeason || '');
        setTempAddress(club.address || '');
    }, [club.id, club.name, club.provincia, club.category, club.activeFromSeason, club.activeUntilSeason, club.contacts, club.estimatedPlayers, club.totalTeams, club.baseTeams, club.recommendedContactDate, club.genericEmail, club.genericPhone, club.assignedTo]);

    // Lógicas de Actualización
    const handleSaveName = () => { if (tempName.trim() !== club.name) onUpdateClub({...club, name: tempName}); };
    const handleSaveProvincia = () => { if (tempProvincia !== club.provincia) onUpdateClub({...club, provincia: tempProvincia}); };
    const handleSaveAddress = () => { 
        if (tempAddress !== club.address) onUpdateClub({...club, address: tempAddress}); 
    };
    const handleSavePlayers = () => { if (Number(tempPlayers) !== club.estimatedPlayers) onUpdateClub({...club, estimatedPlayers: Number(tempPlayers)}); };
    const handleSaveTotalTeams = () => { if (Number(tempTotalTeams) !== club.totalTeams) onUpdateClub({...club, totalTeams: Number(tempTotalTeams)}); };
    const handleSaveBaseTeams = () => { if (Number(tempBaseTeams) !== club.baseTeams) onUpdateClub({...club, baseTeams: Number(tempBaseTeams)}); };
    const handleSaveRecDate = () => { if (tempRecDate !== club.recommendedContactDate) onUpdateClub({...club, recommendedContactDate: tempRecDate}); };
    const handleSaveGenericEmail = () => { if (tempGenericEmail !== club.genericEmail) onUpdateClub({...club, genericEmail: tempGenericEmail}); };
    const handleSaveGenericPhone = () => { if (tempGenericPhone !== club.genericPhone) onUpdateClub({...club, genericPhone: tempGenericPhone}); };
    const handleSaveAssignedTo = () => { if (tempAssignedTo !== club.assignedTo) onUpdateClub({...club, assignedTo: tempAssignedTo}); };

    const handleSaveCategory = () => { 
        if (tempCategory !== club.category) onUpdateClub({...club, category: tempCategory}); 
    };

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

    const handleActiveFromChange = (e) => {
        const val = e.target.value;
        setTempActiveFrom(val);
        onUpdateClub({ ...club, activeFromSeason: val });
    };

    const handleActiveUntilChange = (e) => {
        const val = e.target.value;
        setTempActiveUntil(val);
        onUpdateClub({ ...club, activeUntilSeason: val });
    };
    
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
            const userName = userProfile?.nombre ? `${userProfile.nombre} ${userProfile.apellidos}`.trim() : "Usuario";
            
            // Creamos un objeto de fecha con el valor del input y lo pasamos a formato local (DD/MM/YYYY)
            const dateObj = new Date(interactionDate);
            const formattedDate = dateObj.toLocaleDateString();

            await onAddInteraction({ 
                id: Math.random().toString(), 
                clubId: club.id, 
                type: interactionType, 
                user: userName,
                note, 
                date: formattedDate // <--- Ahora usamos la fecha del selector en lugar de la fecha actual
            });
            
            if(nextDate) {
                await onAddTask({ id: Math.random().toString(), clubId: club.id, task: `Seguimiento: ${interactionType === 'manual' ? 'Manual' : 'Contacto'}`, priority: 'medium', due: nextDate, time: '09:00' });
            }
            
            setNote(""); 
            setNextDate("");
            setInteractionDate(new Date().toISOString().split('T')[0]); // Reiniciamos a la fecha de hoy
        } catch (error) { 
            console.error(error); 
        } finally { 
            setIsSubmitting(false); 
        }
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
        if (isRecording) {
            manualStopRef.current = true;
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            return;
        }

        manualStopRef.current = false;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta el dictado por voz.");
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES';
            recognition.interimResults = false;
            
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            recognition.continuous = !isMobile;

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                }
                if (finalTranscript) setNote(prev => prev + (prev ? " " : "") + finalTranscript.trim());
            };

            recognition.onend = () => {
                if (!manualStopRef.current) {
                    try { recognition.start(); } catch (e) { console.error(e); setIsRecording(false); }
                } else {
                    setIsRecording(false);
                }
            };

            recognition.onerror = (event) => {
                if (event.error === 'no-speech') return; 
                console.error("Error de micrófono", event.error);
                if (event.error === 'not-allowed') alert("Permiso de micrófono denegado.");
                manualStopRef.current = true;
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }

        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (e) {
            console.error(e);
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
        const originalWarn = console.warn;
        console.warn = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('google.maps.places.Autocomplete is not available')) return;
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
                    const newAddress = place.formatted_address || place.name;
                    
                    setTempAddress(newAddress); // Actualizamos el estado local
                    
                    onUpdateClub({ 
                        ...club, 
                        address: newAddress, 
                        lat: place.geometry.location.lat(), 
                        lng: place.geometry.location.lng() 
                    });

                    // Forzar blur para ocultar el teclado en móvil automáticamente
                    setTimeout(() => {
                        if (inputRef.current) inputRef.current.blur();
                    }, 10);
                }
            });

            inputRef.current.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        };

        setTimeout(setupClassicAutocomplete, 100);

        return () => {
            console.warn = originalWarn;
            if (listener) window.google.maps.event.removeListener(listener);
        };
    }, [club.id]);

    const isAddressSelected = club.address && club.lat !== undefined && club.lat !== '';

    return (
        <div className="flex-1 flex flex-col w-full sm:min-w-[400px] h-full bg-white dark:bg-zinc-900 transition-colors overflow-y-auto overflow-x-hidden">
              <style>{`
                  .pac-container {
                      z-index: 99999 !important;
                      font-family: inherit;
                      border-radius: 0.5rem;
                      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                      border: 1px solid #e4e4e7;
                      margin-top: 4px;
                  }
                  .pac-item { padding: 10px 14px; cursor: pointer; font-size: 1rem; }
                  .pac-item:hover { background-color: #f4f4f5; }
                  .dark .pac-container { background-color: #18181b; border-color: #27272a; }
                  .dark .pac-item { color: #a1a1aa; border-top-color: #27272a; }
                  .dark .pac-item:hover { background-color: #27272a; }
                  .dark .pac-item-query { color: #fff; }
              `}</style>

              <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 relative bg-zinc-50 dark:bg-zinc-900/50">
                 <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X className="w-6 h-6"/></button>
                 <div className="flex items-start gap-5 mb-2 pr-8">
                    <div className="w-16 h-16 rounded-xl flex flex-shrink-0 items-center justify-center text-2xl font-bold border bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      {club.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <input 
                         value={tempName} 
                         onChange={(e) => setTempName(e.target.value)} 
                         onBlur={handleSaveName}
                         className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-emerald-500 outline-none w-full transition-colors"
                         placeholder="Nombre del Club"
                      />
                      <select 
                         value={currentStatus}
                         onChange={handleStatusChange}
                         className="mt-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 px-3 outline-none text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer shadow-sm"
                      >
                         {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>

                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors col-span-2 relative z-[60] mt-5">
                            <span className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1.5">Deportes</span>
                            <div 
                                onClick={() => setIsSportsOpen(!isSportsOpen)}
                                className="w-full min-h-[40px] flex flex-wrap items-center gap-2 cursor-pointer"
                            >
                                {(!tempCategory || tempCategory.length === 0) ? (
                                    <span className="text-zinc-400 text-sm font-medium">-- Seleccionar --</span>
                                ) : (
                                    tempCategory.map(sport => (
                                        <span key={sport} className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">
                                            {sport}
                                            <button type="button" onClick={(e) => { 
                                                e.stopPropagation(); 
                                                const newVal = tempCategory.filter(s => s !== sport);
                                                setTempCategory(newVal);
                                                onUpdateClub({...club, category: newVal}); 
                                            }} className="hover:text-red-500"><X className="w-4 h-4"/></button>
                                        </span>
                                    ))
                                )}
                            </div>

                            {isSportsOpen && (
                                <>
                                    <div className="fixed inset-0 z-[70]" onClick={() => setIsSportsOpen(false)}></div>
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar z-[80]">
                                        {sportsList.map(sport => {
                                            const isSelected = tempCategory?.includes(sport);
                                            return (
                                                <label key={sport} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-b last:border-0 border-zinc-100 dark:border-zinc-800">
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const newVal = e.target.checked ? [...tempCategory, sport] : tempCategory.filter(s => s !== sport);
                                                            setTempCategory(newVal);
                                                            onUpdateClub({...club, category: newVal});
                                                        }}
                                                    />
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                                        {isSelected && <Check className="w-4 h-4" />}
                                                    </div>
                                                    <span className={`text-base font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{sport}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-xs font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5"><Users className="w-4 h-4"/> Fichas</span>
                              <input 
                                  type="number" 
                                  value={tempPlayers} 
                                  onChange={(e) => setTempPlayers(e.target.value)} 
                                  onBlur={handleSavePlayers}
                                  className="text-base font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 300" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-xs font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5"><Target className="w-4 h-4"/> Equipos Tot.</span>
                              <input 
                                  type="number" 
                                  value={tempTotalTeams} 
                                  onChange={(e) => setTempTotalTeams(e.target.value)} 
                                  onBlur={handleSaveTotalTeams}
                                  className="text-base font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 15" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-xs font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5"><Shield className="w-4 h-4"/> Fútbol Base</span>
                              <input 
                                  type="number" 
                                  value={tempBaseTeams} 
                                  onChange={(e) => setTempBaseTeams(e.target.value)} 
                                  onBlur={handleSaveBaseTeams}
                                  className="text-base font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: 12" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors">
                              <span className="text-xs font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> Provincia</span>
                              <input 
                                  ref={provinciaRef}
                                  type="text" 
                                  value={tempProvincia} 
                                  onChange={(e) => setTempProvincia(e.target.value)} 
                                  onBlur={handleSaveProvincia}
                                  className="text-base font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                  placeholder="Ej: Tarragona" 
                              />
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors col-span-2">
                                <span className="text-xs font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5"><Phone className="w-4 h-4"/> Teléfono Genérico</span>
                                <input 
                                    type="tel" 
                                    value={tempGenericPhone} 
                                    onChange={(e) => setTempGenericPhone(e.target.value)} 
                                    onBlur={handleSaveGenericPhone}
                                    className="text-base font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                    placeholder="Ej: 600123456" 
                                />
                            </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors col-span-2">
                                <span className="text-xs font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5"><MessageSquare className="w-4 h-4"/> Email Genérico</span>
                                <input 
                                    type="email" 
                                    value={tempGenericEmail} 
                                    onChange={(e) => setTempGenericEmail(e.target.value)} 
                                    onBlur={handleSaveGenericEmail}
                                    className="text-base font-mono font-bold bg-transparent outline-none w-full text-zinc-900 dark:text-white" 
                                    placeholder="Ej: info@club.com" 
                                />
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex flex-col shadow-sm focus-within:border-emerald-500 transition-colors col-span-2 relative z-40">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4"/> Comerciales Asignados
                                </span>
                                
                                <div 
                                    onClick={() => setIsAssignOpen(!isAssignOpen)}
                                    className="w-full min-h-[44px] flex flex-wrap items-center gap-2 bg-transparent outline-none cursor-pointer mt-1"
                                >
                                    {(() => {
                                        const currentArr = Array.isArray(tempAssignedTo) ? tempAssignedTo : [];
                                        
                                        if (currentArr.length === 0) {
                                            return (
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-emerald-900/60 dark:text-emerald-400/60 text-base font-bold">-- Seleccionar responsables --</span>
                                                    <ChevronDown className={`w-5 h-5 text-emerald-600 shrink-0 transition-transform ${isAssignOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                            );
                                        }
                                        
                                        return (
                                            <>
                                                {currentArr.map(name => (
                                                    <div key={name} className="flex items-center gap-2 bg-emerald-500 text-white dark:text-zinc-900 px-3 py-1.5 rounded-md text-sm font-bold shadow-sm antialiased">
                                                        {name}
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newAssigned = currentArr.filter(n => n !== name);
                                                                setTempAssignedTo(newAssigned);
                                                                onUpdateClub({...club, assignedTo: newAssigned});
                                                            }}
                                                            className="hover:bg-black/20 dark:hover:bg-white/20 rounded-full p-1 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="ml-auto">
                                                    <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform ${isAssignOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {isAssignOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[90]" onClick={() => setIsAssignOpen(false)}></div>
                                        <div className="absolute z-[100] top-[100%] left-0 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        placeholder="Buscar comercial..." 
                                                        value={assignSearch}
                                                        onChange={(e) => setAssignSearch(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 text-base bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-emerald-500 text-zinc-900 dark:text-white shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                                                <button 
                                                    type="button"
                                                    onClick={() => { 
                                                        setTempAssignedTo([]);
                                                        onUpdateClub({...club, assignedTo: []});
                                                    }}
                                                    className="w-full flex items-center px-4 py-3 text-base text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                >
                                                    -- Desmarcar todos --
                                                </button>
                                                
                                                {teamUsers
                                                    .filter(u => `${u.nombre || ''} ${u.apellidos || ''}`.toLowerCase().includes(assignSearch.toLowerCase()))
                                                    .map(u => {
                                                        const fullName = `${u.nombre || ''} ${u.apellidos || ''}`.trim();
                                                        const currentArr = Array.isArray(tempAssignedTo) ? tempAssignedTo : [];
                                                        const isSelected = currentArr.includes(fullName);
                                                        
                                                        return (
                                                            <button 
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => { 
                                                                    let newAssigned;
                                                                    if (isSelected) {
                                                                        newAssigned = currentArr.filter(n => n !== fullName);
                                                                    } else {
                                                                        newAssigned = [...currentArr, fullName];
                                                                    }
                                                                    setTempAssignedTo(newAssigned);
                                                                    onUpdateClub({...club, assignedTo: newAssigned}); 
                                                                }}
                                                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-base font-medium ${isSelected ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                                    {fullName.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="flex-1 text-left truncate">{fullName}</span>
                                                                {u.role === 'admin' && <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded font-bold uppercase tracking-wider">Admin</span>}
                                                                
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                                                    {isSelected && <Check className="w-4 h-4" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                      </div>

                    </div>
                 </div>
              </div>

              <div className="flex border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-[60] bg-white dark:bg-zinc-900 shadow-sm">
                 <button onClick={() => setActiveTab('details')} className={cn("flex-1 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'details' ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-900")}>Gestión</button>
                 <button onClick={() => setActiveTab('timeline')} className={cn("flex-1 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'timeline' ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-900")}>Actividad</button>
              </div>

<div className="flex-1 p-6 md:p-8">
                 {activeTab === 'details' ? (
                   <div className="space-y-10">
                      {/* --- SECCIÓN DE FECHAS CLAVE (Renovada para ser más intuitiva) --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Último contacto */}
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col shadow-sm">
                              <span className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                                  <Clock className="w-4 h-4"/> Último Contacto
                              </span>
                              <div className="text-sm text-zinc-900 dark:text-white font-bold h-[42px] flex items-center bg-zinc-50 dark:bg-zinc-900 px-4 rounded-lg border border-zinc-100 dark:border-zinc-800 truncate">
                                  {club.lastContactDate || "Sin historial de contacto"}
                              </div>
                          </div>

                          {/* Próximo contacto (Destacado en verde esmeralda) */}
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex flex-col shadow-sm relative overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                  <PhoneCall className="w-16 h-16 text-emerald-600"/>
                              </div>
                              
                              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1.5 z-10">
                                  <PhoneCall className="w-4 h-4"/> Próxima Fecha de Contacto
                              </label>
                              
                              <div className="flex flex-col sm:flex-row gap-2 z-10 w-full">
                                  <input 
                                      type="date" 
                                      value={tempRecDate} 
                                      onChange={(e) => setTempRecDate(e.target.value)} 
                                      onBlur={handleSaveRecDate}
                                      className="bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 text-zinc-900 dark:text-white font-bold flex-1 shadow-sm h-[42px]" 
                                  />
                                  <Button 
                                    variant="primary" 
                                    size="sm" 
                                    onClick={handleAIPredictDate} 
                                    disabled={isSuggestingDate} 
                                    className="whitespace-nowrap flex items-center justify-center gap-2 h-[42px]"
                                    title="Analizar historial y sugerir fecha con Inteligencia Artificial"
                                   >
                                      <Sparkles className="w-4 h-4" /> 
                                      <span className="sm:hidden lg:inline">Sugerir IA</span>
                                  </Button>
                              </div>
                          </div>
                      </div>

                      
                      {/* --- SECCIÓN DE CONTACTOS REDISEÑADA (ACORDEÓN) --- */}
                      <div className="space-y-5">
                          <div className="flex justify-between items-center">
                              <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                                  <User className="w-4 h-4" /> Personas de Contacto
                              </h4>
                              <button onClick={handleAddContact} className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                                  + Añadir Nuevo
                              </button>
                          </div>
                          
                          <div className="space-y-3">
                              {contacts.map((contact, idx) => {
                                  const isExpanded = expandedContactIdx === idx;
                                  
                                  return (
                                      <div key={idx} className={`bg-white dark:bg-zinc-950 border rounded-2xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                          
                                          {/* CABECERA */}
                                          <div 
                                              onClick={() => toggleContact(idx)}
                                              className={`p-4 flex items-center gap-5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${isExpanded ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-b border-zinc-100 dark:border-zinc-800' : ''}`}
                                          >
                                              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                                                  {contact.name ? contact.name.substring(0,2).toUpperCase() : <User className="w-5 h-5"/>}
                                              </div>

                                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                      <span className={`text-lg font-bold truncate ${isExpanded ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                          {contact.name || "Nuevo Contacto"}
                                                      </span>
                                                      
                                                      {!isExpanded && contact.phone && (
                                                          <span className="flex items-center gap-1.5 text-base text-zinc-500 font-medium">
                                                              <Phone className="w-4 h-4 text-emerald-500"/>
                                                              {contact.phone}
                                                          </span>
                                                      )}
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-2 mt-1 text-base text-zinc-500">
                                                      <Briefcase className="w-4 h-4 text-zinc-400 flex-shrink-0"/> 
                                                      <span className="truncate">{contact.role || "Sin cargo asignado"}</span>
                                                  </div>
                                              </div>

                                              <div className="flex items-center gap-3 pl-3">
                                                  {isExpanded ? <ChevronUp className="w-6 h-6 text-emerald-500" /> : <ChevronDown className="w-6 h-6 text-zinc-400" />}
                                              </div>
                                          </div>

                                          {/* CUERPO DESPLEGABLE */}
                                          {isExpanded && (
                                              <div className="p-5 bg-white dark:bg-zinc-950 space-y-5">
                                                  <div className="grid grid-cols-1 gap-5">
                                                      <div className="grid grid-cols-2 gap-4">
                                                          <div className="space-y-1.5">
                                                              <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Nombre</label>
                                                              <input value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} onBlur={handleSaveContacts} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-base focus:border-emerald-500 outline-none transition-colors" placeholder="Nombre completo" />
                                                          </div>
                                                          <div className="space-y-1.5">
                                                              <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Cargo</label>
                                                              <input value={contact.role} onChange={e => updateContact(idx, 'role', e.target.value)} onBlur={handleSaveContacts} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-base focus:border-emerald-500 outline-none transition-colors" placeholder="Cargo (Ej: Presidente)" />
                                                          </div>
                                                      </div>

                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                          <div className="relative">
                                                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                              <input value={contact.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} onBlur={handleSaveContacts} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-base focus:border-emerald-500 outline-none transition-colors" placeholder="Teléfono" />
                                                          </div>
                                                          <div className="relative">
                                                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                              <input value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} onBlur={handleSaveContacts} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-base focus:border-emerald-500 outline-none transition-colors" placeholder="Correo electrónico" />
                                                          </div>
                                                      </div>

                                                      <div className="space-y-1.5">
                                                          <label className="text-xs font-bold text-zinc-400 uppercase ml-1 flex items-center gap-1.5">
                                                              <FileText className="w-4 h-4 text-amber-500"/> Notas y Observaciones
                                                          </label>
                                                          <textarea 
                                                              value={contact.notes || ''} 
                                                              onChange={e => updateContact(idx, 'notes', e.target.value)} 
                                                              onBlur={handleSaveContacts} 
                                                              rows={3}
                                                              className="w-full bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-900/30 rounded-lg px-4 py-3 text-base focus:border-amber-500 outline-none resize-none placeholder:italic transition-colors" 
                                                              placeholder="Escribe aquí detalles importantes..." 
                                                          />
                                                      </div>
                                                  </div>

                                                  <div className="pt-3 flex justify-end">
                                                      <button 
                                                          onClick={() => { if(window.confirm('¿Eliminar este contacto?')) removeContact(idx); }} 
                                                          className="text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                                      >
                                                          <Trash2 className="w-4 h-4"/> Eliminar Contacto
                                                      </button>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      {/* UBICACIÓN MAPA */}
                      <div className="relative z-50">
                          <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-widest">Ubicación (Mapa)</h4>
                          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-4 shadow-sm">
                              <div className="w-full relative z-50">
                                    <input 
                                        ref={inputRef}
                                        type="text" 
                                        value={tempAddress}
                                        onChange={(e) => setTempAddress(e.target.value)}
                                        onBlur={handleSaveAddress}
                                        placeholder="Escribe la dirección del club..."
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white shadow-sm"
                                    />
                                  
                                  <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm break-words leading-relaxed transition-colors duration-300 ${isAddressSelected ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-transparent'}`}>
                                      {isAddressSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                                      <span>
                                          <span className="font-bold">Dirección Guardada:</span> {club.address || "Ninguna seleccionada de la lista"}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Visibilidad del Club */}
                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col shadow-sm col-span-2 mb-8">
                            <span className="text-xs font-bold text-zinc-500 uppercase mb-3">👁️ Visibilidad en el CRM (Filtro por Temporadas)</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-400 font-bold block mb-1.5">Visible DESDE:</label>
                                    <select 
                                        value={tempActiveFrom} 
                                        onChange={handleActiveFromChange} 
                                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 outline-none text-zinc-700 dark:text-zinc-300 font-medium"
                                    >
                                        <option value="">Siempre visible (Sin límite inicial)</option>
                                        {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400 font-bold block mb-1.5">Visible HASTA:</label>
                                    <select 
                                        value={tempActiveUntil} 
                                        onChange={handleActiveUntilChange} 
                                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 outline-none text-zinc-700 dark:text-zinc-300 font-medium"
                                    >
                                        <option value="">Siempre visible (Sin límite final)</option>
                                        {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                      <div>
                          <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-widest flex justify-between">
                              <span>Requisitos y Contrato</span>
                              <span className="text-emerald-500 text-sm">{currentSeason}</span>
                          </h4>
                          <button onClick={() => generateContractFile(club, currentSeason)} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-all mb-5">
                              <FileSignature className="w-5 h-5 text-blue-500" />
                              <span className="text-base font-bold text-zinc-800 dark:text-white">Generar Contrato PDF</span>
                          </button>
                          
                          <div className="space-y-3">
                              {checklistConfig.map(item => {
                                  const isChecked = getAssetValue(item);
                                  
                                  return (
                                      <div key={item.id} className={cn("flex flex-col gap-3 p-4 rounded-xl border transition-all", isChecked ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800")}>
                                          
                                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleDynamicAsset(item)}>
                                              <div className={cn("w-5 h-5 rounded border flex items-center justify-center flex-shrink-0", isChecked ? "bg-emerald-500 border-emerald-500 text-white dark:text-black" : "bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600")}>
                                                  {isChecked && <CheckCircle2 className="w-4 h-4"/>}
                                              </div>
                                              <div className="flex flex-col">
                                                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                      {item.label}
                                                  </span>
                                                  <span className="text-xs uppercase tracking-wider text-zinc-500 mt-0.5">
                                                      {item.type === 'global' ? '🌍 Para siempre' : item.type === 'seasonal' ? '🔄 Renovación Anual' : '📜 Documento Legal'}
                                                  </span>
                                              </div>
                                          </div>

                                          {item.type === 'contract' && isChecked && (
                                              <div className="pl-9 pt-3 mt-2 border-t border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-3">
                                                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Válido por:</label>
                                                  <select 
                                                      value={club.assets?.[`${item.id}_duration`] || 1}
                                                      onChange={(e) => updateContractDuration(item.id, parseInt(e.target.value))}
                                                      className="text-sm bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 text-zinc-800 dark:text-zinc-200 font-bold"
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

                      <div className="pt-8 mt-8 border-t border-red-100 dark:border-red-500/10">
                          <button onClick={onDeleteClub} className="w-full py-3.5 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 rounded-xl transition-colors text-base font-bold">
                              <Trash2 className="w-5 h-5" /> Eliminar Club Permanentemente
                          </button>
                      </div>

                   </div>
                  ) : (
                   <div className="space-y-8">
                     <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Registrar Interacción</label>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={toggleDictation} 
                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-sm' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                                >
                                    <Mic className="w-4 h-4" /> {isRecording ? "Detener grabación" : "Dictar"}
                                </button>
                                <button 
                                    onClick={handleAISummary} 
                                    disabled={!note || isSummarizing}
                                    className="flex items-center gap-1.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors dark:bg-indigo-500/20 dark:text-indigo-400"
                                >
                                    <Sparkles className="w-4 h-4" /> {isSummarizing ? "Procesando..." : "Resumir con IA"}
                                </button>
                            </div>
                        </div>

                        <textarea className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-base text-zinc-900 dark:text-white outline-none focus:border-emerald-500 resize-none min-h-[120px]" placeholder="Pega aquí el chat de WhatsApp o usa el botón de dictar para grabar una nota de voz..." value={note} onChange={(e) => setNote(e.target.value)} />
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-3">
                            <div className="flex-1 w-full">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1 block">Fecha Actividad</label>
                                <input 
                                    type="date" 
                                    className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 w-full outline-none focus:border-emerald-500" 
                                    value={interactionDate} 
                                    onChange={(e) => setInteractionDate(e.target.value)} 
                                />
                            </div>
                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                <Button 
                                    variant="primary" 
                                    size="default" 
                                    onClick={handleAddInteraction} 
                                    disabled={!note} 
                                    isLoading={isSubmitting}
                                    className="w-full"
                                >
                                    Guardar Historial
                                </Button>
                            </div>
                        </div>
                     </div>

                    <div className="space-y-8 border-l-2 border-zinc-200 dark:border-zinc-800 ml-2 pl-6 pb-6 mt-8">
                        {[...interactions].map(event => (
                        <div key={event.id} className="relative group">
                          <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-zinc-200 border-zinc-400 dark:bg-zinc-800 dark:border-zinc-600"></div>
                            <div className="flex justify-between items-baseline mb-2">
                             <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                                {event.type === 'whatsapp' ? 'WhatsApp' : event.type === 'call' ? 'Llamada' : event.type === 'manual' ? 'Manual' : event.type}
                                <span className="text-sm font-normal text-zinc-500 ml-3 border-l border-zinc-300 dark:border-zinc-700 pl-3">
                                    por {event.user || 'Desconocido'}
                                </span>
                            </span>
                             <div className="flex items-center gap-3">
                                 <span className="text-xs text-zinc-500">{event.date}</span>
                                 <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                                     <button onClick={() => startEditInteraction(event)} className="text-blue-500 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                     <button onClick={() => onDeleteInteraction(event.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                 </div>
                             </div>
                          </div>
                          
                          {editingInteraction === event.id ? (
                              <div className="mt-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50">
                                  <textarea className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-base text-zinc-900 dark:text-white outline-none focus:border-blue-500 resize-none" rows={3} value={editNote} onChange={e => setEditNote(e.target.value)} />
                                  <div className="flex gap-3 mt-3">
                                      <Button size="sm" onClick={() => saveEditInteraction(event.id)}>Guardar</Button>
                                      <Button size="sm" variant="ghost" onClick={() => { setEditingInteraction(null); setEditNote(""); }}>Cancelar</Button>
                                  </div>
                              </div>
                          ) : (
                              <p className="whitespace-pre-wrap text-base text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/50">{event.note}</p>
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