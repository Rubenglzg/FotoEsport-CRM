import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft } from 'lucide-react';
import { Button } from './Button';

export default function NewTaskModal({ onClose, onSave, clubs, taskToEdit }) {
    // Si viene taskToEdit, rellenamos los datos. Si no, ponemos los valores por defecto (tarea nueva)
    const [title, setTitle] = useState(taskToEdit?.task || "");
    const [date, setDate] = useState(taskToEdit?.due || new Date().toISOString().split('T')[0]); 
    const [isAllDay, setIsAllDay] = useState(taskToEdit?.isAllDay || false);
    const [startTime, setStartTime] = useState(taskToEdit?.time || "09:00");
    const [endTime, setEndTime] = useState(taskToEdit?.endTime || "10:00");
    const [priority, setPriority] = useState(taskToEdit?.priority || "medium");
    const [clubId, setClubId] = useState(taskToEdit?.clubId || "");
    const [customLocation, setCustomLocation] = useState(taskToEdit?.location || "");
    const [description, setDescription] = useState(taskToEdit?.description || "");

    const handleSubmit = () => {
        if (!title) return;
        
        onSave({ 
            id: taskToEdit ? taskToEdit.id : Math.random().toString(),
            googleEventId: taskToEdit?.googleEventId,
            task: title, 
            priority, 
            due: date, 
            isAllDay,
            time: isAllDay ? null : startTime,
            endTime: isAllDay ? null : endTime,
            clubId: clubId || null,
            location: clubId ? '' : customLocation,
            description
        });
    };

    return (
        <div className="absolute inset-0 z-[60] bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                     <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                         {taskToEdit ? "Editar Tarea" : "Nueva Tarea"}
                     </h3>
                     <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white"/></button>
                 </div>
                 
                 <div className="space-y-4">
                     {/* Título */}
                     <div>
                         <label className="text-xs font-bold text-zinc-500 block mb-1">Título de la tarea *</label>
                         <input autoFocus className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-sm text-zinc-900 dark:text-white focus:border-emerald-500 outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Visita comercial, Llamada..."/>
                     </div>

                     {/* Fecha y Horario */}
                     <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
                         <div className="flex items-center justify-between">
                            <label className="text-xs text-zinc-500 font-bold flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Fecha</label>
                            <input type="date" className="bg-transparent text-sm text-zinc-900 dark:text-white outline-none" value={date} onChange={e => setDate(e.target.value)}/>
                         </div>
                         
                         <div className="flex items-center gap-2">
                             <input type="checkbox" id="allDay" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="accent-emerald-500" />
                             <label htmlFor="allDay" className="text-xs text-zinc-600 dark:text-zinc-300">Dura todo el día</label>
                         </div>

                         {!isAllDay && (
                             <div className="flex gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                 <div className="flex-1">
                                     <label className="text-[10px] text-zinc-500 block mb-1">Hora Inicio</label>
                                     <input type="time" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs text-zinc-900 dark:text-white outline-none" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                 </div>
                                 <div className="flex-1">
                                     <label className="text-[10px] text-zinc-500 block mb-1">Hora Fin</label>
                                     <input type="time" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs text-zinc-900 dark:text-white outline-none" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                 </div>
                             </div>
                         )}
                     </div>

                     {/* Ubicación / Club */}
                     <div className="space-y-2">
                        <label className="text-xs text-zinc-500 font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> Ubicación o Club (Opcional)</label>
                        <select className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white outline-none" value={clubId} onChange={(e) => { setClubId(e.target.value); setCustomLocation(''); }}>
                            <option value="">-- Sin club asignado --</option>
                            {clubs?.map(club => (
                                <option key={club.id} value={club.id}>{club.name}</option>
                            ))}
                        </select>
                        {!clubId && (
                            <input type="text" placeholder="Ubicación manual (ej: Oficina, Cafetería...)" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-900 dark:text-white outline-none" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} />
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div className="col-span-2">
                             <label className="text-xs text-zinc-500 font-bold flex items-center gap-1 mb-1"><AlignLeft className="w-3 h-3"/> Descripción</label>
                             <textarea rows="2" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-xs text-zinc-900 dark:text-white outline-none resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Notas adicionales..." />
                         </div>
                         <div className="col-span-2">
                             <label className="text-xs text-zinc-500 block mb-1 font-bold">Prioridad</label>
                             <select className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-2 text-xs text-zinc-900 dark:text-white outline-none" value={priority} onChange={e => setPriority(e.target.value)}>
                                 <option value="low">Baja</option>
                                 <option value="medium">Normal</option>
                                 <option value="high">Alta</option>
                             </select>
                         </div>
                     </div>
                     <div className="pt-4 flex gap-2">
                         <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                         <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={!title}>Guardar</Button>
                     </div>
                 </div>
             </div>
        </div>
    );
}