import React, { useState } from 'react';
import { X, Settings, CheckCircle2, RefreshCw, Save, FileSpreadsheet, Mail, Calendar } from 'lucide-react';
import { Button } from './Button';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

export default function SettingsModal({ onClose, targetClients, setTargetClients, onRollover, seasons, currentSeason, showToast, googleToken, setGoogleToken, googleEmail, setGoogleEmail }) {
    const [localTarget, setLocalTarget] = useState(targetClients);
    const [nextSeasonName, setNextSeasonName] = useState(() => {
        const last = seasons[seasons.length - 1];
        if(!last) return "2025-2026";
        const [start, end] = last.split('-').map(Number);
        return `${start + 1}-${end + 1}`;
    });

    // Esta función ahora SOLO pide permisos de Calendario (Modo Redirección)
    const handleCalendarConnect = useGoogleLogin({
        flow: 'auth-code', // <--- VITAL: Pedimos un código seguro, no un token directo
        ux_mode: 'popup', 
        scope: 'https://www.googleapis.com/auth/calendar',
        onSuccess: async (codeResponse) => {
            showToast("Procesando seguridad en el servidor...", "info");
            try {
                // Mandamos el código a nuestra nueva Cloud Function
                const res = await fetch("https://us-central1-fotoesport-crm.cloudfunctions.net/conectarCalendario", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: codeResponse.code,
                        userId: auth.currentUser.uid // Identificamos al usuario
                    })
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
        setTargetClients(Number(localTarget)); 
        showToast("Objetivos actualizados correctamente.", 'success');
    };

    const handleLogout = () => {
        if(window.confirm('¿Seguro que deseas cerrar sesión?')) signOut(auth);
    };

    return (
      <div className="absolute inset-0 z-[60] bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
           <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5"/> Configuración</h2>
              <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white"/></button>
           </div>
           
           <div className="p-6 space-y-6">
              
              {/* --- BLOQUE INTEGRACIONES GOOGLE (ACTUALIZADO PARA FEDCM) --- */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Integraciones de Sistema</h3>
                 <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
                    
                    {/* 1. SECCIÓN FEDCM (IDENTIDAD) */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-zinc-900 dark:text-white font-bold text-sm flex items-center gap-2">
                               <Mail className="w-4 h-4"/> Perfil Google (FedCM)
                               {googleEmail && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </div>
                            {googleEmail ? (
                               <div className="text-xs text-zinc-500 mt-1">Usuario: <span className="font-bold text-emerald-600 dark:text-emerald-400">{googleEmail}</span></div>
                            ) : (
                               <div className="text-xs text-zinc-500 mt-1">Identidad nativa del navegador</div>
                            )}
                        </div>
                        
                        {googleEmail ? (
                            <Button variant="outline" size="sm" onClick={() => setGoogleEmail(null)} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10">
                                Desvincular
                            </Button>
                        ) : (
                            <div className="scale-90 origin-right">
                                <GoogleLogin
                                    onSuccess={(credentialResponse) => {
                                        const decoded = jwtDecode(credentialResponse.credential);
                                        setGoogleEmail(decoded.email);
                                        showToast(`Bienvenido: ${decoded.email}`, 'success');
                                    }}
                                    onError={() => showToast("Error al conectar FedCM.", 'error')}
                                    useOneTap
                                    shape="rectangular"
                                />
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full"></div>

                    {/* 2. SECCIÓN OAUTH (CALENDARIO) */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-zinc-900 dark:text-white font-bold text-sm flex items-center gap-2">
                               <Calendar className="w-4 h-4"/> Permisos Calendario
                               {googleToken && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                                {googleToken ? 'Conectado para crear eventos' : 'Requerido para la agenda'}
                            </div>
                        </div>
                        
                        {googleToken ? (
                            <Button variant="outline" size="sm" onClick={() => setGoogleToken(null)} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10">
                                Revocar
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => handleCalendarConnect()} className="bg-white dark:bg-transparent">
                                <RefreshCw className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400"/> Autorizar
                            </Button>
                        )}
                    </div>

                 </div>
              </div>
              {/* ----------------------------------- */}

              <div>
                 <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Objetivos de Temporada</h3>
                 <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <label className="text-xs text-zinc-500 block mb-1">Meta de Clubes (Clientes Cerrados)</label>
                    <div className="flex gap-2">
                        <input type="number" className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-emerald-500" value={localTarget} onChange={(e) => setLocalTarget(e.target.value)}/>
                        <Button variant="primary" size="sm" onClick={handleSaveObjectives}><Save className="w-4 h-4 mr-2"/> Guardar</Button>
                    </div>
                 </div>
              </div>

              <div>
                 <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Ciclo de Vida</h3>
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-white font-bold"><RefreshCw className="w-4 h-4 text-emerald-500"/>Migración de Temporada</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                        Esta acción exportará los datos de <b>{currentSeason}</b> a Excel y preparará la base de datos para <b>{nextSeasonName}</b>.
                    </div>
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Nombre Próxima Temporada</label>
                        <div className="flex gap-2 mt-1">
                            <input value={nextSeasonName} onChange={(e) => setNextSeasonName(e.target.value)} className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 text-zinc-900 dark:text-white font-mono text-xs focus:border-emerald-500 outline-none"/>
                            <Button variant="neon" size="sm" className="whitespace-nowrap" onClick={() => onRollover(nextSeasonName)}><FileSpreadsheet className="w-4 h-4 mr-2"/> Migrar</Button>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
           <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <Button variant="outline" className="w-full text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-900/50" onClick={handleLogout}>
                    Cerrar Sesión
                </Button>
           </div>
        </div>
      </div>
    );
}