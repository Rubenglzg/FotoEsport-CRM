import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, updateDoc, writeBatch, deleteDoc, getDoc } from 'firebase/firestore';
import { Map, Users, Calendar as CalendarIcon, Sun, Moon, Settings, LogOut, Search, Bell, AlertTriangle, CheckCircle2, Target, List, ChevronDown, Sparkles, Kanban } from 'lucide-react'; // <-- Añade Kanban aquí

// --- SERVICES ---
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from './services/googleCalendar';

// --- LAYOUT ---
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// --- HOOKS ---
import { useCRMData } from './hooks/useCRMData';
import { useRouting } from './hooks/useRouting';
import { useCRMStats } from './hooks/useCRMStats';
import { useCRMActions } from './hooks/useCRMActions';

// --- UTILS ---
import { cn, exportToCSV } from './utils/helpers';
import { DEFAULT_STATUSES } from './utils/constants';

// --- PÁGINAS Y VISTAS ---
import LoginScreen from './pages/LoginScreen';
import MapView from './pages/MapView';
import DatabaseView from './pages/DatabaseView';
import CalendarView from './pages/CalendarView';
import TargetsView from './pages/TargetsView';
import OverviewView from './pages/OverviewView';
import PipelineView from './pages/PipelineView';
import SettingsView from './pages/SettingsView';

// --- COMPONENTES UI ---
import { Button } from './components/ui/Button';
import ClubDetailPanel from './components/ui/ClubDetailPanel';
import NewTaskModal from './components/ui/NewTaskModal';
import NotificationCenter from './components/ui/NotificationCenter';
import NewClubModal from './components/ui/NewClubModal';

const appId = 'fotoesport-crm';

export default function App() {

  // --- AUTH & ESTADO GLOBAL ---
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [currentView, setCurrentView] = useState('overview');

  // --- DATOS FIRESTORE DESDE EL HOOK ---
  const {
      seasons, setSeasons, selectedSeason, setSelectedSeason, activeSeason, setActiveSeason,
      clubs, teamUsers, tasks, interactions, statuses, setStatuses, targetClients, setTargetClients,
      ticketMedio, setTicketMedio, checklistConfig, setChecklistConfig, sportsList, setSportsList
  } = useCRMData(user, userProfile, isLocked, appId);

    // --- ESTADOS DE GOOGLE CON PERSISTENCIA (src/App.jsx) ---

    // 1. Inicializamos los estados leyendo directamente del localStorage
    const [googleToken, setGoogleToken] = useState(() => 
        localStorage.getItem(`${appId}_gtoken`) || null
    );
    const [googleEmail, setGoogleEmail] = useState(() => 
        localStorage.getItem(`${appId}_gemail`) || null
    );

    // 2. Creamos un efecto que guarde el Token cada vez que cambie
    useEffect(() => {
        if (googleToken) {
            localStorage.setItem(`${appId}_gtoken`, googleToken);
        } else {
            localStorage.removeItem(`${appId}_gtoken`);
        }
    }, [googleToken]);

    // 3. Creamos un efecto que guarde el Email cada vez que cambie
    useEffect(() => {
        if (googleEmail) {
            localStorage.setItem(`${appId}_gemail`, googleEmail);
        } else {
            localStorage.removeItem(`${appId}_gemail`);
        }
    }, [googleEmail]);
  
  // --- UI STATE ---
  const [filterNeedsAttention, setFilterNeedsAttention] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  // NUEVO ESTADO PARA EL BUSCADOR:
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- MODALES Y TOASTS ---
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNewClubModal, setShowNewClubModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clearedNotifications, setClearedNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
  };

  // --- RUTAS Y MAPA DESDE EL HOOK ---
  const {
      showRadius, setShowRadius, showRoute, setShowRoute, routeStops, setRouteStops,
      savedLocations, activeOrigin, setActiveOrigin, handleOptimizeRoute,
      handleOpenGoogleMapsNav, toggleRouteStop, 
      addSavedLocation, updateSavedLocation, deleteSavedLocation 
  } = useRouting(appId, showToast, user); 

  // --- MODO CLARO / OSCURO ---
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // --- AUTENTICACIÓN FIREBASE Y PERFILES (MODO SEGURO) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // El usuario existe en la base de datos (Es Admin o Comercial) -> Le dejamos pasar
            setUser(currentUser);
            setUserProfile(userDoc.data());
            setIsLocked(false);
          } else {
            // INTRUSO DETECTADO -> No está en la base de datos. Lo expulsamos.
            console.warn("Intento de acceso bloqueado para:", currentUser.email);
            await auth.signOut(); 
            setUser(null);
            setUserProfile(null);
            setIsLocked(true);
            alert("No tienes permisos para acceder a este CRM.");
          }
        } catch (error) {
          console.error("Error al obtener el perfil:", error);
          setIsLocked(true);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsLocked(true);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

    // --- DATOS DERIVADOS (ESTADÍSTICAS Y CÁLCULOS) ---
    const { filteredClubs, stats, notifications } = useCRMStats(
        clubs, interactions, selectedSeason, filterNeedsAttention, ticketMedio, tasks, clearedNotifications
    );

    // 2. AÑADE ESTA FUNCIÓN PARA FILTRAR POR LA BÚSQUEDA
  const searchedClubs = useMemo(() => {
      if (!searchQuery.trim()) return filteredClubs;
      const query = searchQuery.toLowerCase();
      return filteredClubs.filter(club => 
          club.name?.toLowerCase().includes(query) || 
          club.city?.toLowerCase().includes(query) ||
          club.status?.toLowerCase().includes(query)
      );
  }, [filteredClubs, searchQuery]);

    // --- LÓGICA DE NEGOCIO DESDE EL HOOK ---
    const {
        handleSeedDatabase, handleCreateClub, handleUpdateClub, handleDeleteClub,
        handleUpdateChecklist, addTask, deleteTask, updateTaskPriority, addInteraction,
        handleUpdateInteraction, handleDeleteInteraction, handleUpdateStatuses,
        handleUpdateTargetClients, handleUpdateTicketMedio, handleAddSeason,
        handleEditSeason, handleSetOfficialActiveSeason, handleDeleteSeason,
        handleExportSeason, handleActiveSeasonChange
    } = useCRMActions({
        user, appId, showToast, clubs, tasks, seasons, activeSeason, selectedSeason,
        checklistConfig, setActiveSeason, setSelectedSeason, googleToken, setGoogleToken,
        setSelectedClub
    });

    const handleUpdateSports = async (newSportsArray) => {
        // 1. Actualizamos la pantalla al instante (optimista)
        setSportsList(newSportsArray); 
        
        // 2. Guardamos en Firebase para que sea persistente
        try {
            const dataUid = userProfile?.role === 'admin' ? user.uid : userProfile?.adminUid;
            const settingsRef = doc(db, 'artifacts', appId, 'users', dataUid, 'settings', 'crm');
            
            await updateDoc(settingsRef, {
                sportsList: newSportsArray
            });
        } catch (error) {
            console.error("Error guardando deportes:", error);
        }
    };

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

        case 'overview': return <OverviewView  
            clubs={searchedClubs} 
            tasks={tasks} 
            interactions={interactions}
            onNavigate={setCurrentView}
            onSelectClub={setSelectedClub}
        />;

        case 'map': return <MapView 
            clubs={searchedClubs} selectedId={selectedClub?.id} onSelect={setSelectedClub} 
            showRadius={showRadius} setShowRadius={setShowRadius} showRoute={showRoute} 
            setShowRoute={setShowRoute} tasks={tasks} 

            savedLocations={savedLocations}
            activeOrigin={activeOrigin}
            setActiveOrigin={setActiveOrigin}

            // --- LAS NUEVAS PROPS DE OFICINAS ---
            addSavedLocation={addSavedLocation}
            updateSavedLocation={updateSavedLocation}
            deleteSavedLocation={deleteSavedLocation}
            // ------------------------------------

            routeStops={routeStops} setRouteStops={setRouteStops} toggleRouteStop={toggleRouteStop}
            onOptimizeRoute={handleOptimizeRoute} onExportRoute={handleOpenGoogleMapsNav} statuses={statuses}
        />;

      case 'database': return <DatabaseView 
            clubs={searchedClubs} 
            onSelect={setSelectedClub} 
            onNewClub={() => setShowNewClubModal(true)} 
            statuses={statuses} 
            onUpdateStatuses={handleUpdateStatuses} 
        />;

        case 'pipeline': return <PipelineView 
            clubs={searchedClubs} 
            statuses={statuses} 
            onUpdateClub={handleUpdateClub} 
            onSelect={setSelectedClub} 
            selectedSeason={selectedSeason} 
        />;

      case 'calendar': return <CalendarView tasks={tasks} clubs={clubs} onUpdateTaskPriority={updateTaskPriority} onOpenNewTask={() => setShowTaskModal(true)} onDeleteTask={deleteTask} onEditTask={(task) => setTaskToEdit(task)} />;
      case 'targets': return <TargetsView stats={stats} targetClients={targetClients} ticketMedio={ticketMedio} clubs={clubs} />;

      // --- NUEVA VISTA DE CONFIGURACIÓN ---
        case 'settings': return <SettingsView 
                userProfile={userProfile}
                activeSeason={activeSeason}
                onSetActiveSeason={handleSetOfficialActiveSeason}
                targetClients={targetClients} 
                onUpdateTarget={handleUpdateTargetClients} 
                seasons={seasons} 
                currentSeason={selectedSeason} 
                showToast={showToast}
                googleToken={googleToken}
                setGoogleToken={setGoogleToken}
                googleEmail={googleEmail}
                setGoogleEmail={setGoogleEmail}
                onAddSeason={handleAddSeason}
                onEditSeason={handleEditSeason}
                onDeleteSeason={handleDeleteSeason}
                onExportSeason={handleExportSeason}
                checklistConfig={checklistConfig}
                onUpdateChecklist={handleUpdateChecklist}
                ticketMedio={ticketMedio}
                onUpdateTicketMedio={handleUpdateTicketMedio}
                sportsList={sportsList}
                onUpdateSports={handleUpdateSports}
            />;

      default: return <MapView clubs={filteredClubs} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR LADO IZQUIERDO */}
      <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          theme={theme} 
          toggleTheme={toggleTheme} 
      />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 relative bg-white dark:bg-zinc-900 flex flex-col transition-colors duration-300 md:shadow-inner md:rounded-l-2xl overflow-hidden md:my-2 md:mr-2 border-0 md:border border-zinc-200 dark:border-zinc-800 pb-20 md:pb-0">
        
        {/* HEADER SUPERIOR */}
        <Header 
            currentView={currentView}
            seasons={seasons}
            selectedSeason={selectedSeason}
            activeSeason={activeSeason}
            onActiveSeasonChange={handleActiveSeasonChange}
            filterNeedsAttention={filterNeedsAttention}
            setFilterNeedsAttention={setFilterNeedsAttention}
            notifications={notifications}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
        />

        {renderMainContent()}
        {showNotifications && <NotificationCenter notifications={notifications} onClose={() => setShowNotifications(false)} onClearAll={() => setClearedNotifications(true)} />}
      </main>

      {/* MODAL FICHA DEL CLUB EN GRANDE (Centro de la pantalla en PC) */}
      {selectedClub && (
          <div 
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
              onClick={() => setSelectedClub(null)} // Cierra el modal si haces clic fuera de la tarjeta
          >
              <div 
                  className="bg-white dark:bg-zinc-950 w-full h-full md:w-[90vw] md:max-w-6xl md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative border border-transparent md:border-zinc-200 md:dark:border-zinc-800"
                  onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic dentro de la tarjeta
              >
                  <ClubDetailPanel 
                      club={selectedClub} 
                      teamUsers={teamUsers}
                      onUpdateClub={handleUpdateClub} 
                      onClose={() => setSelectedClub(null)} 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                      onAddTask={addTask}
                      interactions={interactions.filter(i => i.clubId === selectedClub.id)}
                      onAddInteraction={addInteraction}
                      currentSeason={selectedSeason}
                      onDeleteClub={() => handleDeleteClub(selectedClub.id)}
                      onUpdateInteraction={handleUpdateInteraction}
                      onDeleteInteraction={handleDeleteInteraction}
                      statuses={statuses}
                      checklistConfig={checklistConfig}
                      seasons={seasons} 
                      userProfile={userProfile}
                      sportsList={sportsList}
                  />
              </div>
          </div>
      )}

      {/* MODALES FLOTANTES */}

        {showNewClubModal && (
          <NewClubModal 
              userProfile={userProfile} 
              onClose={() => setShowNewClubModal(false)} 
              onSave={handleCreateClub} 
              teamUsers={teamUsers}
              sportsList={sportsList}
          />
      )}
      
        {(showTaskModal || taskToEdit) && (
          <NewTaskModal 
              clubs={clubs}
              taskToEdit={taskToEdit}
              onClose={() => { setShowTaskModal(false); setTaskToEdit(null); }} 
              onSave={async (t) => { 
                  if (taskToEdit) {
                      // 1. Actualizamos el evento en el Calendario de Google (si hay token y tiene evento previo)
                      if (googleToken && t.googleEventId) {
                          await updateGoogleCalendarEvent(t, googleToken, clubs);
                      }
                      
                      // 2. Actualizamos en Firebase
                      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', t.id.toString()), t);
                      showToast("Tarea actualizada", "success");
                  } else {
                      // Si es nueva, la creamos (aquí ya llamaba a createGoogleCalendarEvent por dentro)
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