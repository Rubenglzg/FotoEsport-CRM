import React, { useState, useEffect, useRef } from 'react';
import { Settings, CheckCircle2, RefreshCw, Save, Mail, Calendar, Edit2, Trash2, Download, Plus, ListChecks, UserPlus, Users, Loader2, Shield, MapPin, X as XIcon, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { auth, functions, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { cn } from '../utils/helpers';

export default function SettingsView({ 
    userProfile, 
    targetClients, onUpdateTarget, seasons, currentSeason, showToast, 
    googleToken, setGoogleToken, googleEmail, setGoogleEmail,
    onAddSeason, onEditSeason, onDeleteSeason, onExportSeason,
    checklistConfig = [], onUpdateChecklist,
    ticketMedio, onUpdateTicketMedio,
    activeSeason, onSetActiveSeason 
}) {
    const [localTarget, setLocalTarget] = useState(targetClients);
    const [localTicket, setLocalTicket] = useState(ticketMedio);
    const [newChecklistLabel, setNewChecklistLabel] = useState('');
    const [newChecklistType, setNewChecklistType] = useState('global');
    const [newSeasonInput, setNewSeasonInput] = useState('');
    const [editingSeason, setEditingSeason] = useState(null);
    const [editInput, setEditInput] = useState('');

    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [zoneInput, setZoneInput] = useState('');
    const [comercialData, setComercialData] = useState({ 
        email: '', 
        password: '', 
        zones: [],
        permissions: { canEditSeasons: false, canEditChecklist: false, canEditObjectives: false }
    });

    const [team, setTeam] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editZoneInput, setEditZoneInput] = useState('');
    const [editUserData, setEditUserData] = useState({ 
        password: '', 
        zones: [],
        permissions: { canEditSeasons: false, canEditChecklist: false, canEditObjectives: false } 
    });

    const createZoneRef = useRef(null);
    const editZoneRef = useRef(null);

    useEffect(() => {
        const initGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places && createZoneRef.current) {
                if (createZoneRef.current.hasAttribute('data-google-ready')) return;
                createZoneRef.current.setAttribute('data-google-ready', 'true');

                const autocomplete = new window.google.maps.places.Autocomplete(createZoneRef.current, { types: ['(regions)'], componentRestrictions: { country: 'es' } });
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place && place.name) {
                        setComercialData(prev => ({ ...prev, zones: prev.zones.includes(place.name) ? prev.zones : [...prev.zones, place.name] }));
                        setZoneInput(''); 
                        setTimeout(() => { if(createZoneRef.current) createZoneRef.current.value = ''; }, 10);
                    }
                });
            } else { setTimeout(initGoogle, 500); }
        };
        if (userProfile?.role === 'admin') initGoogle();
    }, [userProfile]);

    useEffect(() => {
        const initEditGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places && editZoneRef.current) {
                if (editZoneRef.current.hasAttribute('data-google-ready')) return;
                editZoneRef.current.setAttribute('data-google-ready', 'true');

                const autocomplete = new window.google.maps.places.Autocomplete(editZoneRef.current, { types: ['(regions)'], componentRestrictions: { country: 'es' } });
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place && place.name) {
                        setEditUserData(prev => ({ ...prev, zones: prev.zones.includes(place.name) ? prev.zones : [...prev.zones, place.name] }));
                        setEditZoneInput(''); 
                        setTimeout(() => { if(editZoneRef.current) editZoneRef.current.value = ''; }, 10);
                    }
                });
            } else if (editingUser) { setTimeout(initEditGoogle, 500); }
        };
        if (editingUser) initEditGoogle();
    }, [editingUser]);

    useEffect(() => {
        if (userProfile?.role === 'admin' && auth.currentUser) {
            const q = query(collection(db, 'users'), where('adminUid', '==', auth.currentUser.uid));
            const unsub = onSnapshot(q, (snapshot) => setTeam(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
            return () => unsub();
        }
    }, [userProfile]);

    const handleCalendarConnect = useGoogleLogin({ flow: 'auth-code', ux_mode: 'popup', prompt: 'select_account', scope: 'https://www.googleapis.com/auth/calendar', onSuccess: async (codeResponse) => { showToast("Procesando...", "info"); try { const res = await fetch("https://us-central1-fotoesport-crm.cloudfunctions.net/conectarCalendario", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: codeResponse.code, userId: auth.currentUser.uid }) }); if(!res.ok) throw new Error("Error del servidor"); setGoogleToken((await res.json()).accessToken); showToast("¡Calendario vinculado!", "success"); } catch (error) { showToast("Fallo al autorizar.", "error"); } }, onError: () => showToast("Error de Google.", 'error') });
    const handleSaveObjectives = () => { onUpdateTarget(localTarget); onUpdateTicketMedio(localTicket); showToast("Objetivos guardados", "success"); };
    const handleSaveEdit = (oldName) => { onEditSeason(oldName, editInput); setEditingSeason(null); };
    const handleLogout = () => { if(window.confirm('¿Seguro que deseas cerrar sesión?')) signOut(auth); };
    const handleAddChecklistItem = () => { if (!newChecklistLabel) return; onUpdateChecklist([...checklistConfig, { id: newChecklistLabel.toLowerCase().replace(/\s+/g, '_'), label: newChecklistLabel, type: newChecklistType }]); setNewChecklistLabel(''); };
    const handleDeleteChecklistItem = (id) => { if(window.confirm("¿Seguro que deseas eliminar este requisito?")) onUpdateChecklist(checklistConfig.filter(item => item.id !== id)); };

    const handleAddZone = (e, isEdit = false) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = isEdit ? editZoneInput.trim() : zoneInput.trim();
            if (val) {
                if (isEdit) { if (!editUserData.zones.includes(val)) setEditUserData({...editUserData, zones: [...editUserData.zones, val]}); setEditZoneInput(''); } 
                else { if (!comercialData.zones.includes(val)) setComercialData({...comercialData, zones: [...comercialData.zones, val]}); setZoneInput(''); }
            }
        }
    };
    const handleRemoveZone = (zoneToRemove, isEdit = false) => {
        if (isEdit) setEditUserData({...editUserData, zones: editUserData.zones.filter(z => z !== zoneToRemove)});
        else setComercialData({...comercialData, zones: comercialData.zones.filter(z => z !== zoneToRemove)});
    };

    // --- MAGIA: BOTÓN DE TODA ESPAÑA ---
    const handleAssignAllSpain = (isEdit = false) => {
        if (isEdit) {
            setEditUserData({...editUserData, zones: ['Toda España']});
            setEditZoneInput('');
        } else {
            setComercialData({...comercialData, zones: ['Toda España']});
            setZoneInput('');
        }
    };

    const handleCreateComercial = async (e) => {
        e.preventDefault(); setIsCreatingUser(true);
        try {
            await httpsCallable(functions, 'createComercialUser')({ email: comercialData.email, password: comercialData.password, allowedZones: comercialData.zones, permissions: comercialData.permissions });
            showToast("Comercial creado", "success");
            setComercialData({ email: '', password: '', zones: [], permissions: { canEditSeasons: false, canEditChecklist: false, canEditObjectives: false } });
        } catch (error) { showToast(error.message, "error"); } finally { setIsCreatingUser(false); }
    };

    const handleUpdateUser = async (e, targetUid) => {
        e.preventDefault();
        try {
            await httpsCallable(functions, 'updateComercialUser')({ targetUid, newPassword: editUserData.password, allowedZones: editUserData.zones, permissions: editUserData.permissions });
            showToast("Actualizado", "success"); setEditingUser(null);
        } catch (error) { showToast(error.message, "error"); }
    };
    const handleDeleteUser = async (targetUid) => {
        if (!window.confirm("¿Eliminar acceso?")) return;
        try { await httpsCallable(functions, 'deleteComercialUser')({ targetUid }); showToast("Eliminado", "success"); } catch (error) { showToast(error.message, "error"); }
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-8 space-y-8">
            
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <Settings className="w-7 h-7 text-emerald-500"/> Configuración del Sistema
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Gestiona integraciones, bases de datos y usuarios desde un solo lugar.</p>
                </div>
                <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200" onClick={handleLogout}>Cerrar Sesión</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-8">
                    
                    {/* GESTIÓN DE COMERCIALES */}
                    {userProfile?.role === 'admin' && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                        <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Users className="w-4 h-4"/> Gestión de Equipo (Comerciales)
                        </h3>
                        <form onSubmit={handleCreateComercial} className="space-y-5 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-indigo-900/70 dark:text-indigo-300 block mb-1 font-bold">Correo de Acceso</label>
                                    <input required type="email" value={comercialData.email} onChange={e => setComercialData({...comercialData, email: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="comercial@fotoesport.com"/>
                                </div>
                                <div>
                                    <label className="text-xs text-indigo-900/70 dark:text-indigo-300 block mb-1 font-bold">Contraseña Temporal</label>
                                    <input required type="password" value={comercialData.password} onChange={e => setComercialData({...comercialData, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Mínimo 6 caracteres"/>
                                </div>
                            </div>

                            {/* SISTEMA DE ETIQUETAS DE ZONAS */}
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-xs text-indigo-900/70 dark:text-indigo-300 font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> Zonas Permitidas</label>
                                    <button type="button" onClick={() => handleAssignAllSpain(false)} className="text-[10px] flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded shadow-sm transition-colors"><Globe className="w-3 h-3"/> Dar Todo España</button>
                                </div>
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/50 rounded-lg min-h-[42px] flex flex-wrap gap-2 items-center focus-within:border-indigo-500 transition-colors">
                                    {comercialData.zones.map(zone => (
                                        <span key={zone} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
                                            {zone === 'Toda España' && <Globe className="w-3 h-3"/>} {zone} 
                                            <button type="button" onClick={() => handleRemoveZone(zone)} className="hover:text-red-500 ml-1"><XIcon className="w-3 h-3"/></button>
                                        </span>
                                    ))}
                                    <input 
                                        ref={createZoneRef}
                                        type="text" 
                                        value={zoneInput} 
                                        onChange={e => setZoneInput(e.target.value)} 
                                        onKeyDown={e => handleAddZone(e, false)}
                                        className="flex-1 bg-transparent min-w-[120px] text-sm outline-none dark:text-white" 
                                        placeholder="Buscar zona con Google..."
                                    />
                                </div>
                            </div>

                            {/* PERMISOS GRANULARES */}
                            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30 space-y-2">
                                <label className="text-xs text-indigo-900/70 dark:text-indigo-300 block font-bold flex items-center gap-1"><Shield className="w-3 h-3"/> Permisos de Administrador</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={comercialData.permissions.canEditSeasons} onChange={e => setComercialData({...comercialData, permissions: {...comercialData.permissions, canEditSeasons: e.target.checked}})} className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"/>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">Puede crear/editar Temporadas</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={comercialData.permissions.canEditChecklist} onChange={e => setComercialData({...comercialData, permissions: {...comercialData.permissions, canEditChecklist: e.target.checked}})} className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"/>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">Puede editar Checklist de Requisitos</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={comercialData.permissions.canEditObjectives} onChange={e => setComercialData({...comercialData, permissions: {...comercialData.permissions, canEditObjectives: e.target.checked}})} className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"/>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">Puede editar Objetivos y Finanzas</span>
                                    </label>
                                </div>
                            </div>

                            <Button variant="neon" className="w-full" disabled={isCreatingUser}>
                                {isCreatingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UserPlus className="w-4 h-4 mr-2"/>}
                                Crear Cuenta Comercial
                            </Button>
                        </form>

                        {/* LISTA DE EQUIPO */}
                        {team.length > 0 && (
                            <div className="mt-6 space-y-3">
                                {team.map(member => (
                                    <div key={member.id} className="bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-xl shadow-sm">
                                        {editingUser === member.id ? (
                                            <form onSubmit={(e) => handleUpdateUser(e, member.id)} className="space-y-4">
                                                <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                                                    {member.email} <Button size="sm" variant="ghost" type="button" onClick={() => setEditingUser(null)}>Cancelar</Button>
                                                </div>
                                                <input type="password" placeholder="Nueva contraseña (opcional)" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})} className="w-full text-sm px-3 py-2 border rounded-lg outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800"/>
                                                
                                                <div className="flex justify-between items-end mb-1 mt-2">
                                                    <label className="text-xs text-indigo-900/70 dark:text-indigo-300 font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> Zonas Permitidas</label>
                                                    <button type="button" onClick={() => handleAssignAllSpain(true)} className="text-[10px] flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded shadow-sm transition-colors"><Globe className="w-3 h-3"/> Dar Todo España</button>
                                                </div>
                                                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/50 rounded-lg min-h-[42px] flex flex-wrap gap-2 items-center">
                                                    {editUserData.zones.map(zone => (
                                                        <span key={zone} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
                                                            {zone === 'Toda España' && <Globe className="w-3 h-3"/>} {zone} 
                                                            <button type="button" onClick={() => handleRemoveZone(zone, true)} className="hover:text-red-500 ml-1"><XIcon className="w-3 h-3"/></button>
                                                        </span>
                                                    ))}
                                                    <input ref={editZoneRef} type="text" value={editZoneInput} onChange={e => setEditZoneInput(e.target.value)} onKeyDown={e => handleAddZone(e, true)} className="flex-1 bg-transparent min-w-[120px] text-sm outline-none dark:text-white" placeholder="Buscar zona..."/>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editUserData.permissions?.canEditSeasons || false} onChange={e => setEditUserData({...editUserData, permissions: {...editUserData.permissions, canEditSeasons: e.target.checked}})} className="w-4 h-4"/> <span className="text-xs">Permiso: Temporadas</span></label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editUserData.permissions?.canEditChecklist || false} onChange={e => setEditUserData({...editUserData, permissions: {...editUserData.permissions, canEditChecklist: e.target.checked}})} className="w-4 h-4"/> <span className="text-xs">Permiso: Checklist</span></label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editUserData.permissions?.canEditObjectives || false} onChange={e => setEditUserData({...editUserData, permissions: {...editUserData.permissions, canEditObjectives: e.target.checked}})} className="w-4 h-4"/> <span className="text-xs">Permiso: Finanzas</span></label>
                                                </div>

                                                <Button size="sm" variant="primary" className="w-full">Guardar Cambios</Button>
                                            </form>
                                        ) : (
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-sm font-bold text-zinc-900 dark:text-white">{member.email}</div>
                                                    <div className="text-[10px] mt-2 flex flex-wrap gap-1">
                                                        {member.allowedZones?.map(z => <span key={z} className={cn("border px-1.5 py-0.5 rounded-md flex items-center gap-1", z === 'Toda España' ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800")}>{z === 'Toda España' && <Globe className="w-2.5 h-2.5"/>} {z}</span>)}
                                                    </div>
                                                    <div className="text-[10px] mt-2 text-zinc-500 flex gap-2">
                                                        {member.permissions?.canEditSeasons && <span>✓ Temporadas</span>}
                                                        {member.permissions?.canEditChecklist && <span>✓ Checklist</span>}
                                                        {member.permissions?.canEditObjectives && <span>✓ Finanzas</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setEditingUser(member.id); setEditUserData({ password: '', zones: member.allowedZones || [], permissions: member.permissions || {canEditSeasons:false, canEditChecklist:false, canEditObjectives:false} }); }} className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors bg-zinc-50 dark:bg-zinc-900 rounded-md"><Edit2 className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteUser(member.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-50 dark:bg-zinc-900 rounded-md"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    )}

                    {/* Integraciones */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">Integraciones</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div><div className="font-bold text-sm flex items-center gap-2"><Mail className="w-4 h-4"/> Perfil Google (FedCM) {googleEmail && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}</div>{googleEmail ? <div className="text-xs text-zinc-500 mt-1">Usuario: <span className="font-bold text-emerald-600">{googleEmail}</span></div> : <div className="text-xs text-zinc-500 mt-1">Identidad nativa del navegador</div>}</div>
                                {googleEmail ? <Button variant="outline" size="sm" onClick={() => setGoogleEmail(null)} className="border-red-200 text-red-600 hover:bg-red-50">Desvincular</Button> : <div className="scale-90 origin-right"><GoogleLogin onSuccess={(res) => { setGoogleEmail(jwtDecode(res.credential).email); }} prompt="select_account" auto_select={false} shape="rectangular" /></div>}
                            </div>
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div><div className="font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4"/> Calendario de Eventos {googleToken && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}</div><div className="text-xs text-zinc-500 mt-1">{googleToken ? 'Conectado para crear eventos' : 'Requerido para la agenda'}</div></div>
                                {googleToken ? <Button variant="outline" size="sm" onClick={() => setGoogleToken(null)} className="border-red-200 text-red-600 hover:bg-red-50">Revocar</Button> : <Button variant="outline" size="sm" onClick={() => handleCalendarConnect()} className="bg-white dark:bg-transparent"><RefreshCw className="w-4 h-4 mr-2 text-blue-500"/> Autorizar</Button>}
                            </div>
                        </div>
                    </div>

                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-8">
                    
                    {/* Objetivos */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                        {userProfile?.role === 'comercial' && !userProfile?.permissions?.canEditObjectives && (
                            <div className="absolute inset-0 z-10 bg-zinc-100/60 dark:bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-md text-xs font-bold text-zinc-500 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800"><Shield className="w-4 h-4"/> Sin Permisos de Edición</span>
                            </div>
                        )}
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">Objetivos y Finanzas</h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1"><label className="text-xs block mb-1 font-bold">Meta Clubes</label><input type="number" className="w-full bg-zinc-50 border rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800" value={localTarget} onChange={(e) => setLocalTarget(e.target.value)}/></div>
                            <div className="flex-1"><label className="text-xs block mb-1 font-bold">Ticket Medio (€)</label><input type="number" className="w-full bg-zinc-50 border rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800" value={localTicket} onChange={(e) => setLocalTicket(e.target.value)}/></div>
                            <Button variant="primary" onClick={handleSaveObjectives}><Save className="w-4 h-4 mr-2"/> Guardar</Button>
                        </div>
                    </div>

                    {/* Temporadas */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                        {userProfile?.role === 'comercial' && !userProfile?.permissions?.canEditSeasons && (
                            <div className="absolute inset-0 z-10 bg-zinc-100/60 dark:bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-md text-xs font-bold text-zinc-500 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800"><Shield className="w-4 h-4"/> Sin Permisos de Edición</span>
                            </div>
                        )}
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">Gestor de Temporadas</h3>
                        <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">Temporada Activa (Oficial)</h4>
                            <select 
                                value={activeSeason} 
                                onChange={(e) => onSetActiveSeason(e.target.value)} 
                                className="w-full bg-white dark:bg-zinc-950 border border-emerald-300 dark:border-emerald-500/50 rounded-lg px-3 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                            >
                                {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="border border-zinc-200 rounded-lg overflow-hidden dark:border-zinc-800">
                            <div className="max-h-48 overflow-y-auto">
                                {seasons.map(season => (
                                    <div key={season} className="flex items-center justify-between p-3 border-b last:border-0 dark:border-zinc-800">
                                        {editingSeason === season ? (
                                            <div className="flex flex-1 gap-2 mr-2">
                                                <input autoFocus value={editInput} onChange={e => setEditInput(e.target.value)} className="flex-1 text-sm px-2 py-1 border rounded" />
                                                <Button size="sm" onClick={() => handleSaveEdit(season)}>OK</Button>
                                                <Button size="sm" variant="outline" onClick={() => setEditingSeason(null)}>X</Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2"><span className="text-sm font-bold">{season}</span>{activeSeason === season && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold">Oficial</span>}</div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => onExportSeason(season)} className="p-1.5 text-zinc-500 hover:bg-blue-50 rounded-md"><Download className="w-4 h-4"/></button>
                                                    <button onClick={() => { setEditingSeason(season); setEditInput(season); }} className="p-1.5 text-zinc-500 hover:bg-amber-50 rounded-md"><Edit2 className="w-4 h-4"/></button>
                                                    <button onClick={() => onDeleteSeason(season)} className="p-1.5 text-zinc-500 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 flex gap-2">
                                <input value={newSeasonInput} onChange={e => setNewSeasonInput(e.target.value)} placeholder="Nueva (Ej: 2026-2027)" className="flex-1 text-sm px-3 py-1.5 border rounded" />
                                <Button size="sm" variant="neon" onClick={() => { onAddSeason(newSeasonInput); setNewSeasonInput(''); }}><Plus className="w-4 h-4 mr-1"/> Añadir</Button>
                            </div>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                        {userProfile?.role === 'comercial' && !userProfile?.permissions?.canEditChecklist && (
                            <div className="absolute inset-0 z-10 bg-zinc-100/60 dark:bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-md text-xs font-bold text-zinc-500 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800"><Shield className="w-4 h-4"/> Sin Permisos de Edición</span>
                            </div>
                        )}
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Checklist de Clubes</h3>
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                            <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                                {checklistConfig.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md">
                                        <div className="flex flex-col"><span className="text-sm font-bold">{item.label}</span><span className="text-[10px] uppercase font-bold text-zinc-500">{item.type === 'global' ? '🌍 Para siempre' : item.type === 'seasonal' ? '🔄 Renovable' : '📜 Contrato'}</span></div>
                                        <button onClick={() => handleDeleteChecklistItem(item.id)} className="p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-2 border-t dark:border-zinc-800">
                                <div className="flex gap-2">
                                    <input value={newChecklistLabel} onChange={e => setNewChecklistLabel(e.target.value)} placeholder="Ej: Logo..." className="flex-1 text-sm px-3 py-1.5 border rounded" />
                                    <select value={newChecklistType} onChange={e => setNewChecklistType(e.target.value)} className="text-xs px-2 border rounded">
                                        <option value="global">Para siempre</option>
                                        <option value="seasonal">Temporada</option>
                                        <option value="contract">Contrato</option>
                                    </select>
                                </div>
                                <Button size="sm" variant="outline" onClick={handleAddChecklistItem} className="w-full"><Plus className="w-4 h-4 mr-1"/> Añadir Requisito</Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </div>
    );
}