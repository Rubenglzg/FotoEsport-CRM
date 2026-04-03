import React from 'react';
import { ChevronDown, Plus, Clock, Flag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/helpers';

export default function CalendarView({ tasks, onUpdateTaskPriority, onOpenNewTask }) {
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const dateMap = { '2025-10-22': 2, '2025-10-24': 4 };

  const sortTasks = (taskList) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return [...taskList].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Agenda de Seguimiento</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Las tareas de Alta Prioridad aparecen primero.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline"><ChevronDown className="w-4 h-4 mr-2"/> Octubre</Button>
           <Button variant="primary" onClick={onOpenNewTask}><Plus className="w-4 h-4 mr-2"/> Tarea Manual</Button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4 h-[600px]">
         {weekDays.map((day, i) => (
           <div key={day} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col shadow-sm">
              <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 text-center bg-zinc-50 dark:bg-transparent rounded-t-xl">
                 <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase">{day}</span>
                 <div className={cn("text-2xl font-bold mt-1", i === 1 ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-600")}>{20 + i}</div>
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                 {sortTasks(tasks.filter(t => dateMap[t.due] === i)).map(task => (
                     <TaskCard key={task.id} task={task} onTogglePriority={() => onUpdateTaskPriority(task.id)} />
                 ))}
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}

const TaskCard = ({ task, onTogglePriority }) => (
  <div className={cn("p-3 rounded-lg border text-left group relative transition-all shadow-sm", task.priority === 'high' ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50" : "bg-white border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-500")}>
     <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {task.time}</span>
        <button onClick={(e) => { e.stopPropagation(); onTogglePriority(); }} title={`Prioridad: ${task.priority === 'high' ? 'Alta' : 'Normal'}`} className={cn("p-1 rounded transition-colors", task.priority === 'high' ? "text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:text-white dark:hover:bg-zinc-700")}>
            <Flag className="w-3 h-3" fill={task.priority === 'high' ? "currentColor" : "none"}/>
        </button>
     </div>
     <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight mb-1">{task.task}</p>
     <p className="text-[10px] text-zinc-500 truncate">Club ID: {task.clubId || 'Manual'}</p>
  </div>
);