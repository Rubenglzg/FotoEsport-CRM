import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Flag, Calendar as CalendarIcon, Trash2, MapPin, AlignLeft, Edit } from 'lucide-react';
import { format, addDays, startOfWeek, subWeeks, addWeeks, isToday } from 'date-fns';
import { es } from 'date-fns/locale'; // Para poner los meses y días en español
import { Button } from '../components/ui/Button';
import { cn } from '../utils/helpers';

export default function CalendarView({ tasks, clubs, onUpdateTaskPriority, onOpenNewTask, onDeleteTask, onEditTask }) {
  // Estado para controlar en qué semana estamos (por defecto, la actual)
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Calculamos el Lunes de la semana seleccionada
  const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); 

  // Generamos un array con los 7 días de la semana (Lunes a Domingo)
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Funciones para navegar entre semanas
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  // Función para ordenar las tareas (Alta prioridad primero)
  const sortTasks = (taskList) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return [...taskList].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  // Obtenemos el nombre del mes actual para el título (ej: "Octubre 2026")
  const currentMonthName = format(startDate, 'MMMM yyyy', { locale: es });

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white capitalize">{currentMonthName}</h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Las tareas de Alta Prioridad aparecen primero.</p>
        </div>
        
        {/* Controles de navegación y nueva tarea */}
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end items-center">
           <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm">
              <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400"/>
              </Button>
              <Button variant="ghost" onClick={goToToday} className="h-8 px-3 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Hoy
              </Button>
              <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400"/>
              </Button>
           </div>
           <Button variant="primary" onClick={onOpenNewTask}>
              <Plus className="w-4 h-4 md:mr-2"/> 
              <span className="hidden md:inline">Tarea Manual</span>
              <span className="md:hidden">Nueva</span>
           </Button>
        </div>
      </div>

      {/* grid-cols-1 en móvil, grid-cols-7 en PC. En PC le damos altura fija, en móvil que fluya. */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:h-[650px] pb-24 md:pb-0">
         {weekDays.map((day) => {
           const dateString = format(day, 'yyyy-MM-dd');
           const dayTasks = sortTasks(tasks.filter(t => t.due === dateString));
           const isCurrentDay = isToday(day);
           const isWeekend = day.getDay() === 0 || day.getDay() === 6;

           return (
             <div key={dateString} className={cn("bg-white dark:bg-zinc-900/50 border rounded-xl flex flex-col shadow-sm transition-colors min-h-[120px] md:min-h-0", 
                  isCurrentDay ? "border-emerald-500 ring-1 ring-emerald-500/20 dark:border-emerald-500/50" : "border-zinc-200 dark:border-zinc-800",
                  isWeekend && !isCurrentDay && "bg-zinc-50/80 dark:bg-zinc-950/50"
               )}>
                
                {/* Cabecera del día adaptada: Horizontal en móvil, Centrada en PC */}
                <div className={cn("p-3 border-b flex md:block justify-between items-center md:text-center rounded-t-xl shrink-0", isCurrentDay ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "bg-zinc-50 border-zinc-100 dark:bg-transparent dark:border-zinc-800")}>
                   <span className={cn("text-xs md:text-sm font-bold uppercase", isCurrentDay ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400")}>
                      {format(day, 'EEEE', { locale: es })}
                   </span>
                   <div className={cn("text-lg md:text-2xl font-bold md:mt-1", isCurrentDay ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300")}>
                      {format(day, 'd')}
                   </div>
                </div>
                
                <div className="p-2 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                   {dayTasks.length > 0 ? (
                       dayTasks.map(task => (
                           <TaskCard key={task.id} task={task} clubs={clubs} onTogglePriority={() => onUpdateTaskPriority(task.id)} onDeleteTask={() => onDeleteTask(task.id)} onEditTask={() => onEditTask(task)} />
                       ))
                   ) : (
                       <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 opacity-50">
                          <CalendarIcon className="w-8 h-8 mb-2 stroke-[1.5]" />
                          <span className="text-xs font-medium">Sin tareas</span>
                       </div>
                   )}
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
}

const TaskCard = ({ task, clubs, onTogglePriority, onDeleteTask, onEditTask }) => {
  const clubName = task.clubId ? clubs?.find(c => c.id === task.clubId)?.name : null;

  return (
    <div className={cn("p-3 rounded-lg border text-left group relative transition-all shadow-sm", task.priority === 'high' ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50" : "bg-white border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-500")}>
       <div className="flex justify-between items-start mb-1.5">
          <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded">
             <Clock className="w-3 h-3"/> 
             {task.isAllDay ? 'Todo el día' : `${task.time} ${task.endTime ? `- ${task.endTime}` : ''}`}
          </span>
          <div className="flex gap-1">
             {/* --- NUEVO BOTÓN DE EDITAR --- */}
             <button onClick={(e) => { e.stopPropagation(); onEditTask(); }} title="Editar" className="p-1 rounded text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                 <Edit className="w-3 h-3" />
             </button>
             {/* ----------------------------- */}
             
             <button onClick={(e) => { e.stopPropagation(); onTogglePriority(); }} title="Cambiar Prioridad" className={cn("p-1 rounded transition-colors", task.priority === 'high' ? "text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:text-white dark:hover:bg-zinc-700")}>
                 <Flag className="w-3 h-3" fill={task.priority === 'high' ? "currentColor" : "none"}/>
             </button>
             <button onClick={(e) => { e.stopPropagation(); onDeleteTask(); }} title="Eliminar" className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                 <Trash2 className="w-3 h-3" />
             </button>
          </div>
       </div>
       
       <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight mb-2">{task.task}</p>
       
       {(clubName || task.location) && (
         <div className="flex items-center gap-1 text-[9px] text-zinc-500 mb-1">
            <MapPin className="w-3 h-3 text-emerald-500" />
            <span className="truncate font-medium">{clubName || task.location}</span>
         </div>
       )}

       {task.description && (
         <div className="flex items-start gap-1 text-[9px] text-zinc-400 mt-1.5 border-t border-zinc-100 dark:border-zinc-700/50 pt-1.5">
            <AlignLeft className="w-3 h-3 min-w-[12px]" />
            <span className="line-clamp-2 leading-relaxed">{task.description}</span>
         </div>
       )}
    </div>
  );
};