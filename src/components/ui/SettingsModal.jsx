import React, { useState } from 'react';
import { X, Settings, CheckCircle2, RefreshCw, Save, Mail, Calendar, Edit2, Trash2, Download, Plus, ListChecks } from 'lucide-react';
import { Button } from './Button';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

export default function SettingsModal({ 
    onClose, targetClients, onUpdateTarget, seasons, currentSeason, showToast, 
    googleToken, setGoogleToken, googleEmail, setGoogleEmail,
    onAddSeason, onEditSeason, onDeleteSeason, onExportSeason,
    checklistConfig = [],
    onUpdateChecklist 
}) {
    const [localTarget, setLocalTarget] = useState(targetClients);

    // Estados para el creador de Checklist
    const [newChecklistLabel, setNewChecklistLabel] = useState('');
    const [newChecklistType, setNewChecklistType] = useState('global');
    
    // Estados para el gestor de temporadas
    const [newSeasonInput, setNewSeasonInput] = useState('');
    const [editingSeason, setEditingSeason] = useState(null);
    const [editInput, setEditInput] = useState('');

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
                console.error(error);
                showToast("Fallo al autorizar con el servidor.", "error");
            }
        },
        onError: (error) => {
            console.error('Error Calendario:', error);
            showToast("Error al abrir la ventana de Google.", 'error');
        },
    });

    const handleSaveObjectives = () => { 
        onUpdateTarget(localTarget); 
    };

    const handleSaveEdit = (oldName) => {
        onEditSeason(oldName, editInput);
        setEditingSeason(null);
    };

    const handleLogout = () => {
        if(window.confirm('¿Seguro que deseas cerrar sesión?')) signOut(auth);
    };

    const handleAddChecklistItem = () => {
        if (!newChecklistLabel) return;
        const newItem = {
            id: newChecklistLabel.toLowerCase().replace(/\s+/g, '_'),
            label: newChecklistLabel,
            type: newChecklistType
        };
        onUpdateChecklist([...checklistConfig, newItem]);
        setNewChecklistLabel('');
    };

    const handleDeleteChecklistItem = (id) => {
        if(window.confirm("Si eliminas este campo, dejará de aparecer en las fichas de los clubes. ¿Seguro?")) {
            onUpdateChecklist(checklistConfig.filter(item => item.id !== id));
        }
    };

    return (
      <div className="absolute inset-0 z-[60] bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
           
           {/* HEADER */}
           <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5"/> Configuración</h2>
              <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white"/></button>
           </div>
           
           {/* BODY SCROLLABLE */}
           <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* --- INTEGRACIONES --- */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Integraciones</h3>
                 <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-zinc-900 dark:text-white font-bold text-sm flex items-center gap-2"><Mail className="w-4 h-4"/> Perfil Google (FedCM) {googleEmail && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}</div>
                            {googleEmail ? <div className="text-xs text-zinc-500 mt-1">Usuario: <span className="font-bold text-emerald-600 dark:text-emerald-400">{googleEmail}</span></div> : <div className="text-xs text-zinc-500 mt-1">Identidad nativa del navegador</div>}
                        </div>
                        {googleEmail ? (
                            <Button variant="outline" size="sm" onClick={() => setGoogleEmail(null)} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10">Desvincular</Button>
                        ) : (
                            <div className="scale-90 origin-right">
                                <GoogleLogin onSuccess={(res) => { const decoded = jwtDecode(res.credential); setGoogleEmail(decoded.email); showToast(`Bienvenido: ${decoded.email}`, 'success'); }} onError={() => showToast("Error al conectar FedCM.", 'error')} useOneTap shape="rectangular" />
                            </div>
                        )}
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-zinc-900 dark:text-white font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4"/> Permisos Calendario {googleToken && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}</div>
                            <div className="text-xs text-zinc-500 mt-1">{googleToken ? 'Conectado para crear eventos' : 'Requerido para la agenda'}</div>
                        </div>
                        {googleToken ? (
                            <Button variant="outline" size="sm" onClick={() => setGoogleToken(null)} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10">Revocar</Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => handleCalendarConnect()} className="bg-white dark:bg-transparent"><RefreshCw className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400"/> Autorizar</Button>
                        )}
                    </div>
                 </div>
              </div>

              {/* --- OBJETIVOS --- */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Objetivos</h3>
                 <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-xs text-zinc-500 block mb-1">Meta de Clubes (Clientes Cerrados)</label>
                        <input type="number" className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-emerald-500" value={localTarget} onChange={(e) => setLocalTarget(e.target.value)}/>
                    </div>
                    <Button variant="primary" onClick={handleSaveObjectives}><Save className="w-4 h-4 mr-2"/> Guardar</Button>
                 </div>
              </div>

              {/* --- GESTOR DE TEMPORADAS Y EXPORTACIÓN --- */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Gestor de Temporadas y Datos</h3>
                 <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
                    
                    <div className="max-h-48 overflow-y-auto">
                        {seasons.map(season => (
                            <div key={season} className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                                {editingSeason === season ? (
                                    <div className="flex flex-1 gap-2 mr-2">
                                        <input autoFocus value={editInput} onChange={e => setEditInput(e.target.value)} className="flex-1 text-sm px-2 py-1 border border-zinc-300 rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white outline-none focus:border-emerald-500" />
                                        <Button size="sm" onClick={() => handleSaveEdit(season)}>OK</Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingSeason(null)}>X</Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{season}</span>
                                            {currentSeason === season && <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Activa</span>}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => onExportSeason(season)} title="Exportar Excel" className="p-1.5 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Download className="w-4 h-4"/></button>
                                            <button onClick={() => { setEditingSeason(season); setEditInput(season); }} title="Editar Nombre" className="p-1.5 text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 rounded-md hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => onDeleteSeason(season)} title="Eliminar Temporada" className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-zinc-100 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
                        <input value={newSeasonInput} onChange={e => setNewSeasonInput(e.target.value)} placeholder="Nueva (Ej: 2026-2027)" className="flex-1 text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 dark:text-white outline-none focus:border-emerald-500" />
                        <Button size="sm" variant="neon" onClick={() => { onAddSeason(newSeasonInput); setNewSeasonInput(''); }}><Plus className="w-4 h-4 mr-1"/> Añadir</Button>
                    </div>
                 </div>
                 <p className="text-[10px] text-zinc-500 mt-2 leading-tight">Nota: Al exportar, se descargará el estado actual del directorio bajo la etiqueta de la temporada seleccionada.</p>
              </div>

              {/* --- GESTOR DE CHECKLIST (NUEVO) --- */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" /> Checklist de Clubes (Requisitos)
                 </h3>
                 <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
                    
                    <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                        {checklistConfig.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                                        {item.type === 'global' && '🌍 Una sola vez (Para siempre)'}
                                        {item.type === 'seasonal' && '🔄 Renovable cada temporada'}
                                        {item.type === 'contract' && '📜 Contrato (Multi-Temporada)'}
                                    </span>
                                </div>
                                <button onClick={() => handleDeleteChecklistItem(item.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-zinc-100 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 flex-col">
                        <div className="flex gap-2">
                            <input 
                                value={newChecklistLabel} 
                                onChange={e => setNewChecklistLabel(e.target.value)} 
                                placeholder="Ej: Logo Patrocinador..." 
                                className="flex-1 text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 dark:text-white outline-none focus:border-emerald-500" 
                            />
                            <select 
                                value={newChecklistType}
                                onChange={e => setNewChecklistType(e.target.value)}
                                className="text-xs px-2 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 dark:text-white outline-none focus:border-emerald-500"
                            >
                                <option value="global">Para siempre</option>
                                <option value="seasonal">Por Temporada</option>
                                <option value="contract">Contrato Especial</option>
                            </select>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleAddChecklistItem} className="w-full">
                            <Plus className="w-4 h-4 mr-1"/> Añadir Requisito al CRM
                        </Button>
                    </div>
                 </div>
              </div>

           </div>

           {/* FOOTER */}
           <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                <Button variant="outline" className="w-full text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-900/50" onClick={handleLogout}>
                    Cerrar Sesión
                </Button>
           </div>
        </div>
      </div>
    );
}