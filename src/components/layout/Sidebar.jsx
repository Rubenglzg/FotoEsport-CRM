// src/components/layout/Sidebar.jsx
import React from 'react';
import { Map, Calendar as CalendarIcon, Sun, Moon, Settings, LogOut, Target, List, Sparkles, Kanban } from 'lucide-react';
import { auth } from '../../lib/firebase';

function NavButton({ icon: Icon, isActive, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? "text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"}`}>
      <Icon size={20} />
    </button>
  );
}

export default function Sidebar({ currentView, setCurrentView, theme, toggleTheme, setShowSettings }) {
  return (
    <aside className="w-16 h-full border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex flex-col items-center py-6 gap-6 z-50 shadow-lg">
      <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md cursor-pointer" onClick={() => setCurrentView('map')}>S</div>
      <nav className="flex flex-col gap-3 w-full px-2 mt-4">
        <NavButton icon={Sparkles} isActive={currentView === 'overview'} onClick={() => setCurrentView('overview')} title="Asistente IA" />
        <NavButton icon={Map} isActive={currentView === 'map'} onClick={() => setCurrentView('map')} title="Mapa" />
        <NavButton icon={Kanban} isActive={currentView === 'pipeline'} onClick={() => setCurrentView('pipeline')} title="Pipeline Kanban" />
        <NavButton icon={List} isActive={currentView === 'database'} onClick={() => setCurrentView('database')} title="Base de Datos" />
        <NavButton icon={CalendarIcon} isActive={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} title="Calendario" />
        <NavButton icon={Target} isActive={currentView === 'targets'} onClick={() => setCurrentView('targets')} title="Objetivos" />
      </nav>
      <div className="mt-auto flex flex-col gap-4 mb-4">
         <button onClick={toggleTheme} className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
         </button>
         <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-colors">
            <Settings size={20} />
         </button>
          <button 
            onClick={() => {
                // 1. Borramos los tokens sensibles de la memoria del navegador
                localStorage.removeItem('fotoesport-crm_gtoken');
                localStorage.removeItem('fotoesport-crm_gemail');
                
                // 2. Cerramos la sesión en Firebase
                auth.signOut();
            }} 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
         >
            <LogOut size={20} />
         </button>
      </div>
    </aside>
  );
}