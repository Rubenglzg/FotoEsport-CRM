import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { Map, Users, Calendar as CalendarIcon, Sun, Moon, Settings, LogOut, Search, Bell, AlertTriangle, CheckCircle2, Target, List } from 'lucide-react';

// --- UTILIDADES ---
import { cn, exportToCSV } from './utils/helpers';
import { INITIAL_SEASONS, SEED_CLUBS, INITIAL_TASKS, INITIAL_TIMELINE } from './utils/constants';

// --- PÁGINAS Y VISTAS ---
import LoginScreen from './pages/LoginScreen';
import MapView from './pages/MapView';
import DatabaseView from './pages/DatabaseView';
import CalendarView from './pages/CalendarView';
import TargetsView from './pages/TargetsView';

// --- COMPONENTES UI ---
import { Button } from './components/ui/Button';
import ClubDetailPanel from './components/ui/ClubDetailPanel';
import SettingsModal from './components/ui/SettingsModal';
import NewTaskModal from './components/ui/NewTaskModal';
import NotificationCenter from './components/ui/NotificationCenter';

const appId = 'fotoesport-crm';

export default function App() {
  // --- AUTH & ESTADO GLOBAL ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [currentView, setCurrentView] = useState('map');
  
  // --- DATOS FIRESTORE ---
  const [seasons, setSeasons] = useState(INITIAL_SEASONS);
  const [selectedSeason, setSelectedSeason] = useState('2024-2025');
  const [clubs, setClubs] = useState([]); 
  const [tasks, setTasks] = useState([]);
  const [interactions, setInteractions] = useState([]);

  // --- ESTADOS DE GOOGLE ---
  const [googleToken, setGoogleToken] = useState(null);
  const [googleEmail, setGoogleEmail] = useState(null);
  
  // --- UI STATE ---
  const [targetClients, setTargetClients] = useState(50);
  const [filterNeedsAttention, setFilterNeedsAttention] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showRadius, setShowRadius] = useState(false);
  const [showRoute, setShowRoute] = useState(false); 
  const [routeStops, setRouteStops] = useState([]); 
  const [origin] = useState({ lat: 39.9864, lng: -0.0513, label: "Oficina" });
  
  // --- MODALES Y TOASTS ---
  const [showSettings, setShowSettings] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clearedNotifications, setClearedNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
  };

  // --- MODO CLARO / OSCURO ---
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // --- AUTENTICACIÓN FIREBASE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setIsLocked(false);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- SUSCRIPCIONES A FIRESTORE ---
  useEffect(() => {
    if (!user || isLocked) return;
    
    const clubsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'clubs');
    const unsubClubs = onSnapshot(clubsRef, (snapshot) => {
        setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const intRef = collection(db, 'artifacts', appId, 'users', user.uid, 'interactions');
    const unsubInt = onSnapshot(intRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInteractions(data.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => { unsubClubs(); unsubTasks(); unsubInt(); };
  }, [user, isLocked]);

  // --- LOGICA DE GOOGLE CALENDAR ---
  const createGoogleCalendarEvent = async (taskDetails, token) => {
    if (!token) return;

    let start, end;

    if (taskDetails.isAllDay) {
        // Para eventos de todo el día, Google pide formato "YYYY-MM-DD" en la propiedad 'date'
        start = { date: taskDetails.due };
        
        // En Google Calendar, la fecha de fin de un evento de todo el día debe ser el día siguiente
        const endDate = new Date(taskDetails.due);
        endDate.setDate(endDate.getDate() + 1);
        end = { date: endDate.toISOString().split('T')[0] };
    } else {
        // Si tiene horas específicas, usamos la hora que marcaste o por defecto 09:00 - 10:00
        const timeStr = taskDetails.time || '09:00';
        const endTimeStr = taskDetails.endTime || '10:00';
        const startDateTime = new Date(`${taskDetails.due}T${timeStr}:00`).toISOString();
        const endDateTime = new Date(`${taskDetails.due}T${endTimeStr}:00`).toISOString();
        
        start = { dateTime: startDateTime, timeZone: 'Europe/Madrid' };
        end = { dateTime: endDateTime, timeZone: 'Europe/Madrid' };
    }

    const event = {
      summary: taskDetails.task,
      description: `Generado desde CRM Sooner.\nClub: ${taskDetails.clubId || 'Ninguno'}\nDetalles: ${taskDetails.description || ''}`,
      start: start,
      end: end,
      colorId: taskDetails.priority === 'high' ? '11' : '9',
    };

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error("Error creando evento");
      const data = await response.json();
      return data.id; 
    } catch (error) {
      console.error("Error API Google Calendar:", error);
    }
  };

  // --- LOGICA DE NEGOCIO ---
  const handleSeedDatabase = async () => {
      if(!user) return;
      try {
          const batch = writeBatch(db);
          SEED_CLUBS.forEach(c => batch.set(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', c.id), c));
          INITIAL_TASKS.forEach(t => batch.set(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', t.id.toString()), t));
          INITIAL_TIMELINE.forEach(i => batch.set(doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', i.id.toString()), { ...i, createdAt: Date.now() - (i.id * 1000) }));
          await batch.commit();
          showToast("Base de datos inicializada con éxito.");
      } catch (e) { console.error(e); }
  };

  const addTask = async (newTask) => {
      if(!user) return;
      let googleEventId = null;
      if (googleToken) {
         googleEventId = await createGoogleCalendarEvent(newTask, googleToken);
      }
      const taskToSave = { ...newTask, googleEventId: googleEventId || null };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', newTask.id.toString()), taskToSave);
  };

  const deleteTask = async (taskId) => {
      if(!user) return;
      if (window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
          try {
              await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId.toString()));
              showToast("Tarea eliminada", "success");
          } catch (error) {
              console.error("Error al eliminar la tarea:", error);
              showToast("Error al eliminar", "error");
          }
      }
  };

  const addInteraction = async (interaction) => {
      if(!user) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', interaction.id.toString()), { ...interaction, createdAt: Date.now() });
  };

  const updateTaskPriority = async (taskId) => {
      if(!user) return;
      const task = tasks.find(t => t.id === taskId);
      if(task) {
          const newPriority = task.priority === 'high' ? 'medium' : 'high';
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), { priority: newPriority });
      }
  };

  const handleUpdateClub = async (updatedClub) => {
      if(!user) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', updatedClub.id), updatedClub);
      if(selectedClub?.id === updatedClub.id) setSelectedClub(updatedClub);
  };

  const handleSeasonRollover = async (nextSeasonName) => {
      if(!user) return;
      exportToCSV(clubs, selectedSeason);
      const batch = writeBatch(db);
      clubs.forEach(club => {
          let newStatus = club.status === 'signed' ? 'renewal_pending' : club.status === 'negotiation' ? 'lead' : 'lead';
          batch.update(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', club.id), {
              status: newStatus, lastInteraction: 'Reset', nextContact: null, assets: { hasLogo: false, hasRoster: false, contractSigned: false }, sessionDate: null
          });
      });
      await batch.commit();
      setSeasons([...seasons, nextSeasonName]);
      setSelectedSeason(nextSeasonName);
      setShowSettings(false);
      showToast(`¡Temporada ${nextSeasonName} iniciada!`);
  };

  // --- DATOS DERIVADOS ---
  const filteredClubs = useMemo(() => filterNeedsAttention ? clubs.filter(c => c.lastInteraction === "Never" || c.lastInteraction === "30d") : clubs, [clubs, filterNeedsAttention]);
  const stats = useMemo(() => ({ total: clubs.length, signed: clubs.filter(c => c.status === 'signed').length, negotiation: clubs.filter(c => c.status === 'negotiation').length }), [clubs]);
  const notifications = useMemo(() => {
      if (clearedNotifications) return [];
      const alerts = [];
      const staleClubs = clubs.filter(c => c.lastInteraction === "Never" || c.lastInteraction === "30d");
      if (staleClubs.length > 0) alerts.push({ type: 'alert', title: 'Leads en Enfriamiento', message: `Hay ${staleClubs.length} clubes sin contacto reciente.` });
      const highPriorityTasks = tasks.filter(t => t.priority === 'high');
      if (highPriorityTasks.length > 0) alerts.push({ type: 'info', title: 'Agenda Prioritaria', message: `Tienes ${highPriorityTasks.length} tareas de Alta Prioridad hoy.` });
      return alerts;
  }, [clubs, tasks, clearedNotifications]);

  // --- RENDERIZADOS CONDICIONALES PANTALLAS PRINCIPALES ---
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  if (!user || isLocked) return <LoginScreen onLogin={() => setIsLocked(false)} />;

  const renderMainContent = () => {
    if (clubs.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-900">
                <Target className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">CRM Inicializado</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md">Tu base de datos está conectada de forma segura a Firebase pero actualmente no hay clubes registrados.</p>
                <Button variant="neon" onClick={handleSeedDatabase}>Cargar Datos de Prueba</Button>
            </div>
        );
    }
    switch (currentView) {
      case 'map': return <MapView clubs={filteredClubs} selectedId={selectedClub?.id} onSelect={setSelectedClub} showRadius={showRadius} setShowRadius={setShowRadius} showRoute={showRoute} setShowRoute={setShowRoute} tasks={tasks} origin={origin} routeStops={routeStops} setRouteStops={setRouteStops} onOptimizeRoute={() => showToast("Ruta optimizada", "success")} />;
      case 'database': return <DatabaseView clubs={filteredClubs} onSelect={setSelectedClub} />;
      case 'calendar': return <CalendarView tasks={tasks} clubs={clubs} onUpdateTaskPriority={updateTaskPriority} onOpenNewTask={() => setShowTaskModal(true)} onDeleteTask={deleteTask} onEditTask={(task) => setTaskToEdit(task)} />;
      case 'targets': return <TargetsView stats={stats} targetClients={targetClients} />;
      default: return <MapView clubs={filteredClubs} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR LADO IZQUIERDO */}
      <aside className="w-16 h-full border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex flex-col items-center py-6 gap-6 z-50 shadow-lg">
        <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md cursor-pointer" onClick={() => setCurrentView('map')}>S</div>
        <nav className="flex flex-col gap-3 w-full px-2 mt-4">
          <NavButton icon={Map} isActive={currentView === 'map'} onClick={() => setCurrentView('map')} title="Mapa" />
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
           <button onClick={() => auth.signOut()} className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
              <LogOut size={20} />
           </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 relative bg-white dark:bg-zinc-900 flex flex-col transition-colors duration-300 shadow-inner rounded-l-2xl overflow-hidden my-2 mr-2 border border-zinc-200 dark:border-zinc-800">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-between px-6 z-40">
           <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold uppercase tracking-wide text-zinc-800 dark:text-white">
                {currentView === 'map' && 'Mapa Táctico'}
                {currentView === 'database' && 'Directorio'}
                {currentView === 'calendar' && 'Planificación'}
                {currentView === 'targets' && 'Cuadro de Mando'}
             </h1>
             <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700"></div>
             <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 pr-3 shadow-sm">
                <span className="bg-white dark:bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-600 dark:text-zinc-400 uppercase font-bold tracking-wider border border-zinc-200 dark:border-zinc-700">TEMP</span>
                <select className="bg-transparent text-sm font-semibold outline-none text-zinc-900 dark:text-white cursor-pointer" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <button onClick={() => setFilterNeedsAttention(!filterNeedsAttention)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm", filterNeedsAttention ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500 dark:text-red-400" : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400")}>
                <AlertTriangle className="w-3 h-3" />{filterNeedsAttention ? "Viendo Prioritarios" : "Filtrar Alertas"}
             </button>
           </div>
           
           <div className="flex items-center gap-4">
                {(currentView === 'map' || currentView === 'database') && (
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                        <input type="text" placeholder="Buscar Club..." className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 w-64 transition-all text-zinc-900 dark:text-white" />
                    </div>
                )}
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-colors">
                    <Bell className="w-4 h-4" />{notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm"></span>}
                </button>
           </div>
        </header>

        {renderMainContent()}
        {showNotifications && <NotificationCenter notifications={notifications} onClose={() => setShowNotifications(false)} onClearAll={() => setClearedNotifications(true)} />}
      </main>

      {/* SIDEBAR PANEL LATERAL DERECHO (Detalle del Club) */}
      <aside className={cn("bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-50 transition-all duration-300 shadow-xl overflow-hidden relative", (currentView === 'map' || currentView === 'database') && selectedClub ? "w-[400px]" : "w-0 border-l-0")}>
        {selectedClub && 
            <ClubDetailPanel 
                club={selectedClub} 
                onUpdateClub={handleUpdateClub} 
                onClose={() => setSelectedClub(null)} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onAddTask={addTask}
                interactions={interactions.filter(i => i.clubId === selectedClub.id)}
                onAddInteraction={addInteraction}
                currentSeason={selectedSeason}
            />
        }
      </aside>

      {/* MODALES FLOTANTES */}
      {showSettings && (
          <SettingsModal 
              onClose={() => setShowSettings(false)} 
              targetClients={targetClients} 
              setTargetClients={setTargetClients} 
              onRollover={handleSeasonRollover} 
              seasons={seasons} 
              currentSeason={selectedSeason} 
              showToast={showToast}
              setGoogleToken={setGoogleToken}
              googleEmail={googleEmail}
              setGoogleEmail={setGoogleEmail}
          />
      )}
      
      {(showTaskModal || taskToEdit) && (
          <NewTaskModal 
              clubs={clubs}
              taskToEdit={taskToEdit}
              onClose={() => { setShowTaskModal(false); setTaskToEdit(null); }} 
              onSave={async (t) => { 
                  if (taskToEdit) {
                      // Si estábamos editando, actualizamos en Firebase
                      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', t.id.toString()), t);
                      showToast("Tarea actualizada", "success");
                  } else {
                      // Si es nueva, la creamos
                      addTask(t); 
                  }
                  setShowTaskModal(false); 
                  setTaskToEdit(null);
              }} 
          />
      )}
      
      {/* TOAST FLOTANTE */}
      {toast && (
          <div className={cn("fixed top-6 right-6 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl border z-[100] animate-in slide-in-from-top-8 fade-in duration-300", toast.type === 'success' ? "bg-white text-emerald-600 border-emerald-200 dark:bg-zinc-900 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-white text-red-600 border-red-200 dark:bg-zinc-900 dark:text-red-400 dark:border-red-500/20")}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
              <span className="text-sm font-bold whitespace-nowrap">{toast.message}</span>
          </div>
      )}

    </div>
  );
}

// Subcomponente de botón del menú lateral
function NavButton({ icon: Icon, isActive, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? "text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"}`}>
      <Icon size={20} />
    </button>
  );
}