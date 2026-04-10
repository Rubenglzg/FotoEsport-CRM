import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
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

// --- COMPONENTES UI ---
import { Button } from './components/ui/Button';
import ClubDetailPanel from './components/ui/ClubDetailPanel';
import SettingsModal from './components/ui/SettingsModal';
import NewTaskModal from './components/ui/NewTaskModal';
import NotificationCenter from './components/ui/NotificationCenter';
import NewClubModal from './components/ui/NewClubModal';

const appId = 'fotoesport-crm';

export default function App() {

  // --- AUTH & ESTADO GLOBAL ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [currentView, setCurrentView] = useState('overview');

  // --- DATOS FIRESTORE DESDE EL HOOK ---
  const {
      seasons, setSeasons, selectedSeason, setSelectedSeason, activeSeason, setActiveSeason,
      clubs, tasks, interactions, statuses, setStatuses, targetClients, setTargetClients,
      ticketMedio, setTicketMedio, checklistConfig, setChecklistConfig
  } = useCRMData(user, isLocked, appId);

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
  
  // --- MODALES Y TOASTS ---
  const [showSettings, setShowSettings] = useState(false);
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
      handleOpenGoogleMapsNav, toggleRouteStop, addNewLocation
  } = useRouting(appId, showToast);

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

  const handleCreateClub = async (newClubData) => {
      if(!user) return;
      try {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', newClubData.id), newClubData);
          showToast("Club añadido exitosamente", "success");
          setShowNewClubModal(false);
      } catch (error) {
          console.error("Error al crear club:", error);
          showToast("Error al crear el club", "error");
      }
  };

  const handleUpdateChecklist = async (newChecklist) => {
    if(!user) return;
    try {
        // Guardamos la configuración en el documento de settings del usuario
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), 
            { checklistConfig: newChecklist }, 
            { merge: true }
        );
        showToast("Configuración de requisitos actualizada", "success");
    } catch (error) {
        console.error("Error al actualizar checklist:", error);
        showToast("Error al guardar la configuración", "error");
    }
};

    const addTask = async (newTask) => {
      if(!user) return;
      let googleEventId = null;
      if (googleToken) {
         googleEventId = await createGoogleCalendarEvent(newTask, googleToken, clubs); // <-- Añadido clubs
      }
      const taskToSave = { ...newTask, googleEventId: googleEventId || null };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', newTask.id.toString()), taskToSave);
  };

  const deleteTask = async (taskId) => {
      if(!user) return;
      if (window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
          try {
              // 1. Buscamos la tarea exacta para recuperar su ID de Google Calendar
              const taskToDelete = tasks.find(t => t.id.toString() === taskId.toString());
              
              // 2. Si tiene ID y tenemos token, mandamos la orden de borrar a tu móvil
                if (taskToDelete && taskToDelete.googleEventId && googleToken) {
                    await deleteGoogleCalendarEvent(taskToDelete.googleEventId, googleToken, () => {
                        setGoogleToken(null); 
                        showToast("La sesión del Calendario ha caducado. Vuelve a autorizar en Ajustes.", "error");
                    });
                }

              // 3. Borramos definitivamente de la base de datos de Firebase
              await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId.toString()));
              showToast("Tarea eliminada del CRM y del Calendario", "success");
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

  const handleUpdateStatuses = async (newStatuses) => {
      if(!user) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { statuses: newStatuses }, { merge: true });
      showToast("Estados actualizados", "success");
  };


  // NUEVA FUNCIÓN: Guardar la Meta en Firebase
  const handleUpdateTargetClients = async (newTarget) => {
      if(!user) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { targetClients: Number(newTarget) }, { merge: true });
      showToast("Objetivos actualizados y guardados en la nube", "success");
  };

  const handleUpdateTicketMedio = async (newTicket) => {
      if(!user) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { ticketMedio: Number(newTicket) }, { merge: true });
      showToast("Ticket medio actualizado", "success");
  };

  const handleAddSeason = async (newSeasonName) => {
      if (!newSeasonName || seasons.includes(newSeasonName)) {
          showToast("Nombre inválido o la temporada ya existe", "error");
          return;
      }

      const updatedSeasons = [...seasons, newSeasonName];
      const previousSeason = activeSeason; // Usamos la que era oficial hasta ahora
      
      showToast("Creando temporada y calculando estados...", "info");

      try {
          // Usamos un Batch para actualizar todos los clubes a la vez sin saturar Firebase
          const batch = writeBatch(db);

          clubs.forEach(club => {
              // 1. Vemos qué estado tenía el club en el año anterior
              const prevStatus = club.seasonStatuses?.[previousSeason] || club.status || 'to_contact';
              let newStatus = 'to_contact';

              // 2. APLICAMOS TU LÓGICA DE DEGRADACIÓN
              if (prevStatus === 'rejected') { 
                  newStatus = 'rejected'; // No interesa -> No interesa
                  
              } else if (prevStatus === 'to_contact') {
                  newStatus = 'to_contact'; // Por contactar -> Por contactar
                  
              } else if (prevStatus === 'prospect') {
                  newStatus = 'to_contact'; // Posible cliente -> Por contactar (Se enfrió)
                  
              } else if (prevStatus === 'lead' || prevStatus === 'negotiation') {
                  newStatus = 'prospect'; // Lead -> Posible cliente
                  
              } else if (prevStatus === 'signed') {
                  // CLIENTE: Aquí viene la magia del contrato
                  let isContractValid = false;
                  
                  // Buscamos si hay algún requisito tipo contrato en la config
                  const contractItem = checklistConfig.find(item => item.type === 'contract');
                  
                  if (contractItem && club.assets?.[contractItem.id]) {
                      const duration = club.assets[`${contractItem.id}_duration`] || 1;
                      const startSeason = club.assets[`${contractItem.id}_startSeason`] || previousSeason;
                      
                      // Buscamos en qué posición están las temporadas en la lista
                      const startIndex = updatedSeasons.indexOf(startSeason);
                      const newSeasonIndex = updatedSeasons.indexOf(newSeasonName);
                      
                      // Si la diferencia de años es menor a lo que dura el contrato, sigue vigente
                      if (startIndex !== -1 && newSeasonIndex !== -1 && (newSeasonIndex - startIndex) < duration) {
                          isContractValid = true;
                      }
                  }

                  // Si el contrato sigue vivo, se mantiene Cliente. Si caducó, baja a Lead.
                  newStatus = isContractValid ? 'signed' : 'lead';
              }

              // 3. Preparamos la actualización del estado para este club en la nueva temporada
              const clubRef = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', club.id);
              batch.update(clubRef, {
                  [`seasonStatuses.${newSeasonName}`]: newStatus
              });
          });

          // 4. Actualizamos la lista global de temporadas y pasamos a la nueva
          const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm');
          batch.update(settingsRef, { 
              seasons: updatedSeasons,
              activeSeason: newSeasonName // Opcional: auto-activa la nueva temporada
          });

          await batch.commit(); // Ejecutamos todas las escrituras a la vez
          
          setActiveSeason(newSeasonName);
          setSelectedSeason(newSeasonName); // Cambiamos la vista automáticamente
          showToast(`Temporada ${newSeasonName} lista. Estados actualizados.`, "success");

      } catch (error) {
          console.error("Error calculando nueva temporada:", error);
          showToast("Error al procesar los clubes", "error");
      }
  };

  const handleEditSeason = async (oldName, newName) => {
      if (!newName || (seasons.includes(newName) && oldName !== newName)) {
          showToast("Nombre inválido o ya existe", "error");
          return;
      }
      const updatedSeasons = seasons.map(s => s === oldName ? newName : s);
      const updates = { seasons: updatedSeasons };
      
      // Si estamos editando la temporada activa actualmente, la actualizamos también
      if (selectedSeason === oldName) {
          updates.currentSeason = newName;
          setSelectedSeason(newName);
      }
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), updates, { merge: true });
      showToast("Temporada actualizada", "success");
  };

  const handleSetOfficialActiveSeason = async (seasonName) => {
      if(!user) return;
      setActiveSeason(seasonName);
      // Lo guardamos en Firebase explícitamente como "activeSeason"
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { activeSeason: seasonName }, { merge: true });
      showToast(`Temporada ${seasonName} establecida como Oficial`, "success");
  };

  const handleDeleteSeason = async (seasonName) => {
      if (!window.confirm(`⚠️ ADVERTENCIA: Estás a punto de eliminar la temporada "${seasonName}". Si esta temporada tiene datos o resúmenes asociados, se perderán de la lista. Debes confirmar para proceder.`)) return;
      
      const updatedSeasons = seasons.filter(s => s !== seasonName);
      if (updatedSeasons.length === 0) {
          showToast("Debe quedar al menos una temporada en el CRM", "error");
          return;
      }
      
      const updates = { seasons: updatedSeasons };
      
      // Si justo has borrado la temporada OFICIAL, nombramos oficial a la primera que quede
      if (activeSeason === seasonName) {
          updates.activeSeason = updatedSeasons[0];
          setActiveSeason(updatedSeasons[0]);
      }
      
      // Si estabas VIENDO la temporada que acabas de borrar, cambiamos tu vista
      if (selectedSeason === seasonName) {
          setSelectedSeason(updatedSeasons[0]);
      }
      
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), updates, { merge: true });
      showToast("Temporada eliminada", "success");
  };

  const handleExportSeason = (seasonName) => {
      exportToCSV(clubs, seasonName);
      showToast(`Resumen de ${seasonName} exportado con éxito`, "success");
  };

  // NUEVO: Cambiar la temporada activa desde el menú y guardarlo
  const handleActiveSeasonChange = async (newSeason) => {
      setSelectedSeason(newSeason);
      if (user) {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'crm'), { currentSeason: newSeason }, { merge: true });
      }
  };

  // --- NUEVAS FUNCIONES DE GESTIÓN EN App.jsx ---

    // 1. Borrar un club y sus datos asociados
    const handleDeleteClub = async (clubId) => {
        if (!window.confirm("¿Estás seguro de eliminar este club? Se perderán todos sus datos.")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', clubId));
            setSelectedClub(null);
            showToast("Club eliminado", "success");
        } catch (e) { console.error(e); }
    };

    // 2. Modificar una interacción existente
    const handleUpdateInteraction = async (interactionId, newNote) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', interactionId), {
                note: newNote,
                updatedAt: Date.now()
            });
            showToast("Actividad actualizada", "success");
        } catch (e) { console.error(e); }
    };

    // 3. Eliminar una interacción
    const handleDeleteInteraction = async (interactionId) => {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', interactionId));
            showToast("Actividad eliminada", "success");
        } catch (e) { console.error(e); }
    };

    // --- DATOS DERIVADOS (ESTADÍSTICAS Y CÁLCULOS) ---
    const { filteredClubs, stats, notifications } = useCRMStats(
        clubs, interactions, selectedSeason, filterNeedsAttention, ticketMedio, tasks, clearedNotifications
    );

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
            clubs={filteredClubs} 
            tasks={tasks} 
            interactions={interactions}
            onNavigate={setCurrentView}
            onSelectClub={setSelectedClub}
        />;

      case 'map': return <MapView 
            clubs={filteredClubs} 
            selectedId={selectedClub?.id} 
            onSelect={setSelectedClub} 
            showRadius={showRadius} 
            setShowRadius={setShowRadius} 
            showRoute={showRoute} 
            setShowRoute={setShowRoute} 
            tasks={tasks} 
            
            // --- NUEVAS PROPS DEL GESTOR ---
            savedLocations={savedLocations}
            activeOrigin={activeOrigin}
            setActiveOrigin={setActiveOrigin}
            addNewLocation={addNewLocation}
            routeStops={routeStops} 
            setRouteStops={setRouteStops} 
            toggleRouteStop={toggleRouteStop}
            onOptimizeRoute={handleOptimizeRoute} 
            onExportRoute={handleOpenGoogleMapsNav}
            statuses={statuses}
        />;

      case 'database': return <DatabaseView 
            clubs={filteredClubs} 
            onSelect={setSelectedClub} 
            onNewClub={() => setShowNewClubModal(true)} 
            statuses={statuses} 
            onUpdateStatuses={handleUpdateStatuses} 
        />;

        case 'pipeline': return <PipelineView 
            clubs={filteredClubs} 
            statuses={statuses} 
            onUpdateClub={handleUpdateClub} 
            onSelect={setSelectedClub} 
            selectedSeason={selectedSeason} 
        />;

      case 'calendar': return <CalendarView tasks={tasks} clubs={clubs} onUpdateTaskPriority={updateTaskPriority} onOpenNewTask={() => setShowTaskModal(true)} onDeleteTask={deleteTask} onEditTask={(task) => setTaskToEdit(task)} />;
      case 'targets': return <TargetsView stats={stats} targetClients={targetClients} ticketMedio={ticketMedio} clubs={clubs} />;
      default: return <MapView clubs={filteredClubs} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR LADO IZQUIERDO */}
      <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          setShowSettings={setShowSettings} 
      />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 relative bg-white dark:bg-zinc-900 flex flex-col transition-colors duration-300 shadow-inner rounded-l-2xl overflow-hidden my-2 mr-2 border border-zinc-200 dark:border-zinc-800">
        
        {/* HEADER SUPERIOR */}
        <Header 
            currentView={currentView}
            seasons={seasons}
            selectedSeason={selectedSeason}
            onActiveSeasonChange={handleActiveSeasonChange}
            filterNeedsAttention={filterNeedsAttention}
            setFilterNeedsAttention={setFilterNeedsAttention}
            notifications={notifications}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
        />

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
                onDeleteClub={() => handleDeleteClub(selectedClub.id)}
                onUpdateInteraction={handleUpdateInteraction}
                onDeleteInteraction={handleDeleteInteraction}
                statuses={statuses}
                checklistConfig={checklistConfig}
                seasons={seasons} 
            />
        }
      </aside>

      {/* MODALES FLOTANTES */}

      {showNewClubModal && (
          <NewClubModal 
              onClose={() => setShowNewClubModal(false)} 
              onSave={handleCreateClub} 
          />
      )}
        
        {showSettings && (
          <SettingsModal 
              onClose={() => setShowSettings(false)} 
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

// Subcomponente de botón del menú lateral
function NavButton({ icon: Icon, isActive, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? "text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"}`}>
      <Icon size={20} />
    </button>
  );
}

// Subcomponente de Menú Desplegable para Temporadas
function SeasonSelector({ seasons, selectedSeason, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative group">
            {/* Botón que ves por defecto */}
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer"
            >
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400">
                    <CalendarIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold pl-2 pr-6 text-zinc-900 dark:text-white select-none">
                    {selectedSeason}
                </span>
                <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : 'group-hover:text-emerald-500'}`} />
            </div>

            {/* Menú Flotante que se despliega */}
            {isOpen && (
                <>
                    {/* Esta capa invisible hace que el menú se cierre si haces clic fuera de él */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {seasons.map(s => (
                            <div 
                                key={s} 
                                onClick={() => { onSelect(s); setIsOpen(false); }}
                                className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 
                                ${selectedSeason === s 
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                }`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}