import React, { useState } from 'react';
import { Settings, CheckCircle2, RefreshCw, Save, Mail, Calendar, Edit2, Trash2, Download, Plus, ListChecks, UserPlus, Users, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { auth, functions } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

export default function SettingsView({ 
    userProfile, // <-- NUEVO: Para saber si es admin
    targetClients, onUpdateTarget, seasons, currentSeason, showToast, 
    googleToken, setGoogleToken, googleEmail, setGoogleEmail,
    onAddSeason, onEditSeason, onDeleteSeason, onExportSeason,
    checklistConfig = [], onUpdateChecklist,
    ticketMedio, onUpdateTicketMedio,
    activeSeason, onSetActiveSeason 
}) {
    // Estados generales
    const [localTarget, setLocalTarget] = useState(targetClients);
    const [localTicket, setLocalTicket] = useState(ticketMedio);
    const [newChecklistLabel, setNewChecklistLabel] = useState('');
    const [newChecklistType, setNewChecklistType] = useState('global');
    const [newSeasonInput, setNewSeasonInput] = useState('');
    const [editingSeason, setEditingSeason] = useState(null);
    const [editInput, setEditInput] = useState('');

    // Estados para el Creador de Comerciales
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [comercialData, setComercialData] = useState({ email: '', password: '', zones: '' });

    const handleCalendarConnect = useGoogleLogin({
        flow: 'auth-code', 
        ux_mode: 'popup', 
        scope: 'https://www.googleapis.com/auth/calendar',
        onSuccess: async (codeResponse) => {
            showToast("Procesando seguridad en el servidor...", "info");
            try {
                const res = await fetch("https://us-central1-fotoesport-crm.cloudfunctions.net/conectarCalendario", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: codeResponse.code, userId: auth.currentUser.uid })
                });
                if(!res.ok) throw new Error("Error del servidor");
                const data = await res.json();
                setGoogleToken(data.accessToken);
                showToast("¡Calendario vinculado con máxima seguridad!", "success");
            } catch (error) {
                showToast("Fallo al autorizar con el servidor.", "error");
            }
        },
        onError: () => showToast("Error al abrir la ventana de Google.", 'error'),
    });

    const handleSaveObjectives = () => { onUpdateTarget(localTarget); onUpdateTicketMedio(localTicket); showToast("Objetivos guardados", "success"); };
    const handleSaveEdit = (oldName) => { onEditSeason(oldName, editInput); setEditingSeason(null); };
    const handleLogout = () => { if(window.confirm('¿Seguro que deseas cerrar sesión?')) signOut(auth); };

    const handleAddChecklistItem = () => {
        if (!newChecklistLabel) return;
        const newItem = { id: newChecklistLabel.toLowerCase().replace(/\s+/g, '_'), label: newChecklistLabel, type: newChecklistType };
        onUpdateChecklist([...checklistConfig, newItem]);
        setNewChecklistLabel('');
    };

    const handleDeleteChecklistItem = (id) => {
        if(window.confirm("Si eliminas este campo, dejará de aparecer en las fichas de los clubes. ¿Seguro?")) {
            onUpdateChecklist(checklistConfig.filter(item => item.id !== id));
        }
    };

    // --- FUNCIÓN PARA CREAR COMERCIAL ---
    const handleCreateComercial = async (e) => {
        e.preventDefault();
        setIsCreatingUser(true);
        try {
            const createComercialFn = httpsCallable(functions, 'createComercialUser');
            // Convertimos las zonas separadas por comas en un array limpio
            const zonesArray = comercialData.zones.split(',').map(z => z.trim()).filter(z => z.length > 0);
            
            await createComercialFn({
                email: comercialData.email,
                password: comercialData.password,
                allowedZones: zonesArray
            });
            
            showToast("Comercial creado exitosamente", "success");
            setComercialData({ email: '', password: '', zones: '' }); // Limpiar
        } catch (error) {
            console.error(error);
            showToast(error.message || "Error al crear el usuario", "error");
        } finally {
            setIsCreatingUser(false);
        }
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-8 space-y-8">
            
            {/* Header de la Vista */}
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <Settings className="w-7 h-7 text-emerald-500"/> Configuración del Sistema
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Gestiona integraciones, bases de datos y usuarios desde un solo lugar.</p>
                </div>
                <Button variant="outline" className="text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-900/50" onClick={handleLogout}>
                    Cerrar Sesión
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-8">
                    {/* Integraciones */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">Integraciones</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <div className="text-zinc-900 dark:text-white font-bold text-sm flex items-center gap-2"><Mail className="w-4 h-4"/> Perfil Google (FedCM) {googleEmail && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}</div>
                                    {googleEmail ? <div className="text-xs text-zinc-500 mt-1">Usuario: <span className="font-bold text-emerald-600">{googleEmail}</span></div> : <div className="text-xs text-zinc-500 mt-1">Identidad nativa del navegador</div>}
                                </div>
                                {googleEmail ? (
                                    <Button variant="outline" size="sm" onClick={() => setGoogleEmail(null)} className="border-red-200 text-red-600 hover:bg-red-50">Desvincular</Button>
                                ) : (
                                    <div className="scale-90 origin-right"><GoogleLogin onSuccess={(res) => { const decoded = jwtDecode(res.credential); setGoogleEmail(decoded.email); showToast(`Bienvenido: ${decoded.email}`, 'success'); }} onError={() => showToast("Error al conectar FedCM.", 'error')} useOneTap shape="rectangular" /></div>
                                )}
                            </div>
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <div className="text-zinc-900 dark:text-white font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4"/> Calendario de Eventos {googleToken && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}</div>
                                    <div className="text-xs text-zinc-500 mt-1">{googleToken ? 'Conectado para crear eventos' : 'Requerido para la agenda'}</div>
                                </div>
                                {googleToken ? (
                                    <Button variant="outline" size="sm" onClick={() => setGoogleToken(null)} className="border-red-200 text-red-600 hover:bg-red-50">Revocar</Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => handleCalendarConnect()} className="bg-white dark:bg-transparent"><RefreshCw className="w-4 h-4 mr-2 text-blue-500"/> Autorizar</Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Objetivos */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">Objetivos y Finanzas</h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 block mb-1 font-bold">Meta Clubes</label>
                                <input type="number" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-emerald-500" value={localTarget} onChange={(e) => setLocalTarget(e.target.value)}/>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 block mb-1 font-bold">Ticket Medio (€)</label>
                                <input type="number" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-emerald-500" value={localTicket} onChange={(e) => setLocalTicket(e.target.value)}/>
                            </div>
                            <Button variant="primary" onClick={handleSaveObjectives}><Save className="w-4 h-4 mr-2"/> Guardar</Button>
                        </div>
                    </div>

                    {/* GESTIÓN DE COMERCIALES (SOLO ADMIN) */}
                    {userProfile?.role === 'admin' && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                        <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Users className="w-4 h-4"/> Gestión de Comerciales
                        </h3>
                        <form onSubmit={handleCreateComercial} className="space-y-4">
                            <div>
                                <label className="text-xs text-indigo-900/70 dark:text-indigo-300 block mb-1 font-bold">Correo de Acceso</label>
                                <input required type="email" value={comercialData.email} onChange={e => setComercialData({...comercialData, email: e.target.value})} className="w-full bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-800/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="comercial@fotoesport.com"/>
                            </div>
                            <div>
                                <label className="text-xs text-indigo-900/70 dark:text-indigo-300 block mb-1 font-bold">Contraseña Temporal</label>
                                <input required type="password" value={comercialData.password} onChange={e => setComercialData({...comercialData, password: e.target.value})} className="w-full bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-800/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Mínimo 6 caracteres"/>
                            </div>
                            <div>
                                <label className="text-xs text-indigo-900/70 dark:text-indigo-300 block mb-1 font-bold">Zonas Asignadas (Provincias)</label>
                                <input value={comercialData.zones} onChange={e => setComercialData({...comercialData, zones: e.target.value})} className="w-full bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-800/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej: Tarragona, Barcelona, Murcia"/>
                                <p className="text-[10px] mt-1 text-indigo-600/70 dark:text-indigo-400/70">Separadas por comas. El comercial solo verá clubes de estas zonas.</p>
                            </div>
                            <Button variant="neon" className="w-full mt-2" disabled={isCreatingUser}>
                                {isCreatingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UserPlus className="w-4 h-4 mr-2"/>}
                                Crear Cuenta Comercial
                            </Button>
                        </form>
                    </div>
                    )}

                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-8">
                    
                    {/* Temporadas */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">Gestor de Temporadas</h3>
                        <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">Temporada Activa (Oficial)</h4>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mb-3">Se usa para vigencia de contratos y estadísticas.</p>
                            <select value={activeSeason} onChange={(e) => onSetActiveSeason(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-emerald-300 dark:border-emerald-500/50 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500">
                                {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                            <div className="max-h-48 overflow-y-auto">
                                {seasons.map(season => (
                                    <div key={season} className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        {editingSeason === season ? (
                                            <div className="flex flex-1 gap-2 mr-2">
                                                <input autoFocus value={editInput} onChange={e => setEditInput(e.target.value)} className="flex-1 text-sm px-2 py-1 border border-zinc-300 rounded outline-none focus:border-emerald-500" />
                                                <Button size="sm" onClick={() => handleSaveEdit(season)}>OK</Button>
                                                <Button size="sm" variant="outline" onClick={() => setEditingSeason(null)}>X</Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold">{season}</span>
                                                    {activeSeason === season && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Oficial</span>}
                                                </div>
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
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 flex gap-2">
                                <input value={newSeasonInput} onChange={e => setNewSeasonInput(e.target.value)} placeholder="Nueva (Ej: 2026-2027)" className="flex-1 text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white outline-none focus:border-emerald-500" />
                                <Button size="sm" variant="neon" onClick={() => { onAddSeason(newSeasonInput); setNewSeasonInput(''); }}><Plus className="w-4 h-4 mr-1"/> Añadir</Button>
                            </div>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Checklist de Clubes</h3>
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                            <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                                {checklistConfig.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{item.label}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                                                {item.type === 'global' ? '🌍 Para siempre' : item.type === 'seasonal' ? '🔄 Renovable' : '📜 Contrato'}
                                            </span>
                                        </div>
                                        <button onClick={() => handleDeleteChecklistItem(item.id)} className="p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col gap-2 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="flex gap-2">
                                    <input value={newChecklistLabel} onChange={e => setNewChecklistLabel(e.target.value)} placeholder="Ej: Logo..." className="flex-1 text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-emerald-500" />
                                    <select value={newChecklistType} onChange={e => setNewChecklistType(e.target.value)} className="text-xs px-2 border border-zinc-300 rounded outline-none">
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