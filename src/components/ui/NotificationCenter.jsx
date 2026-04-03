import React from 'react';
import { Bell, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/helpers';

export default function NotificationCenter({ notifications, onClose, onClearAll }) {
    return (
        <div className="absolute top-16 right-6 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-[55] animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-500"/> Notificaciones</h3>
                <button onClick={onClose}><X className="w-4 h-4 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white"/></button>
            </div>
            <div className="max-h-64 overflow-y-auto bg-zinc-50/50 dark:bg-transparent">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 flex flex-col items-center"><CheckCircle2 className="w-6 h-6 mb-2 opacity-20"/>Todo al día.</div>
                ) : (
                    notifications.map((notif, i) => (
                        <div key={i} className="p-3 border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex gap-3">
                            <div className="mt-1">{notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-500"/>}{notif.type === 'info' && <Bell className="w-4 h-4 text-zinc-500"/>}</div>
                            <div>
                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{notif.title}</p>
                                <p className="text-[10px] text-zinc-600 dark:text-zinc-500 mt-1">{notif.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {notifications.length > 0 && (
                <div className="p-2 bg-zinc-50 dark:bg-zinc-900/50 text-center border-t border-zinc-200 dark:border-zinc-800 rounded-b-xl">
                    <button onClick={onClearAll} className="text-[10px] text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 uppercase font-bold tracking-wider transition-colors">Marcar todas como leídas</button>
                </div>
            )}
        </div>
    );
}