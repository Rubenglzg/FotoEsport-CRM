// src/components/layout/Sidebar.jsx
import React from 'react';
import { Map, Calendar as CalendarIcon, Sun, Moon, Settings, LogOut, Target, List, Sparkles, Kanban } from 'lucide-react';
import { auth } from '../../lib/firebase';

function NavButton({ icon: Icon, isActive, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`w-10 h-10 flex-shrink-0 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? "text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"}`}>
      <Icon size={20} />
    </button>
  );
}

export default function Sidebar({ currentView, setCurrentView, theme, toggleTheme, setShowSettings }) {
  return (
    <aside className="fixed bottom-0 left-0 w-full h-16 md:relative md:w-16 md:h-full border-t md:border-t-0 md:border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex flex-row md:flex-col items-center justify-between md:justify-start md:py-6 px-2 md:px-0 z-[60] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-lg">
      
      {/* LOGO MODIFICADO (Oculto en móvil) */}
      <img 
          src="/logo192.png" 
          alt="Logo" 
          onClick={() => setCurrentView('map')}
          className="hidden md:flex w-10 h-10 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] object-cover bg-white flex-shrink-0 cursor-pointer mb-4" 
      />
      
      <nav className="flex flex-row md:flex-col gap-2 md:gap-3 w-full md:px-2 overflow-x-auto no-scrollbar items-center justify-around">
        <NavButton icon={Sparkles} isActive={currentView === 'overview'} onClick={() => setCurrentView('overview')} title="Asistente IA" />
        <NavButton icon={Map} isActive={currentView === 'map'} onClick={() => setCurrentView('map')} title="Mapa" />
        <NavButton icon={Kanban} isActive={currentView === 'pipeline'} onClick={() => setCurrentView('pipeline')} title="Pipeline Kanban" />
        <NavButton icon={List} isActive={currentView === 'database'} onClick={() => setCurrentView('database')} title="Base de Datos" />
        <NavButton icon={CalendarIcon} isActive={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} title="Calendario" />
        <NavButton icon={Target} isActive={currentView === 'targets'} onClick={() => setCurrentView('targets')} title="Objetivos" />
      </nav>

      <div className="flex flex-row md:flex-col gap-2 md:gap-4 md:mt-auto md:mb-4 ml-auto md:ml-0 pl-2 md:pl-0 border-l md:border-l-0 md:border-t border-zinc-200 dark:border-zinc-800 md:pt-4">
         <button onClick={toggleTheme} className="hidden md:flex w-10 h-10 rounded-lg items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
         </button>
         <button 
              onClick={() => setCurrentView('settings')} 
              className={`w-10 h-10 md:w-full md:p-3 md:mb-2 rounded-xl flex flex-shrink-0 items-center justify-center transition-colors ${currentView === 'settings' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg' : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <Settings size={20} />
         </button>
      </div>
    </aside>
  );
}