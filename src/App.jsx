import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { Map, Users, Calendar as CalendarIcon, Sun, Moon, Settings, LogOut } from 'lucide-react';

// IMPORTANTE: Estos componentes debes crearlos en las carpetas mencionadas arriba
// import LoginScreen from './views/LoginScreen';
// import MapView from './views/MapView';
// import DatabaseView from './views/DatabaseView';
// import CalendarView from './views/CalendarView';
// import SettingsView from './views/SettingsView';

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [currentView, setCurrentView] = useState('map');
  const [clubs, setClubs] = useState([]);

  // --- MODO CLARO / OSCURO ---
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // --- AUTENTICACIÓN FIREBASE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- CARGA DE DATOS (FIRESTORE) ---
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const clubsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClubs(clubsData);
    });
    return () => unsubscribe();
  }, [user]);

  // --- RENDERIZADO CONDICIONAL DE VISTAS ---
  const renderView = () => {
    switch (currentView) {
      case 'map': return <div className="p-6 text-zinc-900 dark:text-white">Vista de Mapa (Reemplazar por componente MapView)</div>;
      case 'database': return <div className="p-6 text-zinc-900 dark:text-white">Vista de Base de Datos (Reemplazar por componente DatabaseView)</div>;
      case 'calendar': return <div className="p-6 text-zinc-900 dark:text-white">Vista de Calendario (Reemplazar por componente CalendarView)</div>;
      case 'settings': return <div className="p-6 text-zinc-900 dark:text-white">Configuración (Reemplazar por componente SettingsView)</div>;
      default: return <div className="p-6">Vista no encontrada</div>;
    }
  };

  // --- PANTALLA DE CARGA ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // --- PANTALLA DE LOGIN ---
  if (!user) {
    // Si tienes el componente LoginScreen, úsalo aquí: return <LoginScreen />
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <h2>Por favor, inicia sesión.</h2>
      </div>
    );
  }

  // --- LAYOUT PRINCIPAL DEL CRM ---
  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR (Lo ideal es sacarlo a src/components/layout/Sidebar.jsx) */}
      <aside className="w-16 h-full border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/50 backdrop-blur-md flex flex-col items-center py-6 gap-6 z-50 shadow-lg transition-colors duration-300">
        
        {/* LOGO */}
        <div 
          className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          onClick={() => setCurrentView('map')}
          title="Sooner / FotoEsport CRM"
        >
          S
        </div>
        
        {/* NAVEGACIÓN */}
        <nav className="flex flex-col gap-3 w-full px-2 mt-4">
          <NavButton icon={Map} isActive={currentView === 'map'} onClick={() => setCurrentView('map')} title="Mapa" />
          <NavButton icon={Users} isActive={currentView === 'database'} onClick={() => setCurrentView('database')} title="Base de Datos" />
          <NavButton icon={CalendarIcon} isActive={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} title="Calendario" />
        </nav>

        {/* CONTROLES INFERIORES */}
        <div className="mt-auto flex flex-col gap-4 mb-4">
           {/* BOTÓN MODO CLARO/OSCURO */}
           <button 
             onClick={toggleTheme} 
             className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-colors"
             title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
           >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           
           <button 
             onClick={() => setCurrentView('settings')} 
             className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${currentView === 'settings' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'}`}
             title="Configuración"
           >
              <Settings size={20} />
           </button>

           <button 
             onClick={() => auth.signOut()} 
             className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
             title="Cerrar Sesión"
           >
              <LogOut size={20} />
           </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 relative bg-white dark:bg-zinc-900 flex flex-col transition-colors duration-300 shadow-inner rounded-l-2xl overflow-hidden my-2 mr-2 border border-zinc-200 dark:border-zinc-800">
        
        {/* HEADER SUPERIOR (Lo ideal es sacarlo a src/components/layout/Header.jsx) */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-between px-6 z-40">
           <div>
             <h1 className="text-xl font-bold capitalize text-zinc-800 dark:text-zinc-100">
               {currentView === 'map' ? 'Mapa de Clubes' : currentView === 'database' ? 'Base de Datos' : currentView === 'calendar' ? 'Calendario' : 'Configuración'}
             </h1>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {user.email}
              </span>
           </div>
        </header>

        {/* CONTENIDO DE LA VISTA */}
        <div className="flex-1 overflow-auto bg-zinc-50/50 dark:bg-zinc-900">
          {renderView()}
        </div>

      </main>
    </div>
  );
}

// Componente auxiliar local (se puede mover a UI Components)
function NavButton({ icon: Icon, isActive, onClick, title }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 
        ${isActive 
          ? "text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
    >
      <Icon size={20} />
    </button>
  );
}