import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export default function NewTaskModal({ onClose, onSave }) {
    const [task, setTask] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
    const [priority, setPriority] = useState("medium");

    const handleSubmit = () => {
        if (!task) return;
        onSave({ id: Math.random().toString(), clubId: 'Manual', task, priority, due: date, time: "09:00" });
    };

    return (
        <div className="absolute inset-0 z-[60] bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-xl p-6 shadow-2xl">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Nueva Tarea Manual</h3>
                     <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white"/></button>
                 </div>
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs text-zinc-500 block mb-1">Descripción</label>
                         <input autoFocus className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 outline-none" value={task} onChange={e => setTask(e.target.value)} placeholder="Ej: Comprar material oficina"/>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs text-zinc-500 block mb-1">Fecha</label>
                             <input type="date" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-xs text-zinc-900 dark:text-white outline-none" value={date} onChange={e => setDate(e.target.value)}/>
                         </div>
                         <div>
                             <label className="text-xs text-zinc-500 block mb-1">Prioridad</label>
                             <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-xs text-zinc-900 dark:text-white outline-none" value={priority} onChange={e => setPriority(e.target.value)}>
                                 <option value="low">Baja</option>
                                 <option value="medium">Normal</option>
                                 <option value="high">Alta</option>
                             </select>
                         </div>
                     </div>
                     <div className="pt-2">
                         <Button variant="primary" className="w-full" onClick={handleSubmit}>Guardar Tarea</Button>
                     </div>
                 </div>
             </div>
        </div>
    );
}