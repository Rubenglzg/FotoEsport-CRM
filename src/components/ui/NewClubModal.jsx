import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Mail, Phone, Building2 } from 'lucide-react';
import { Button } from './Button';

export default function NewClubModal({ onClose, onSave }) {
 const [formData, setFormData] = useState({
    name: '',
    category: 'Fútbol',
    estimatedPlayers: '',
    totalTeams: '', // NUEVO
    baseTeams: '',  // NUEVO
    genericEmail: '',
    genericPhone: '',
    contacts: [{ name: '', role: '', phone: '', email: '', isDecisionMaker: true }]
  });

  const addContactField = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { name: '', role: '', phone: '', email: '', isDecisionMaker: false }]
    });
  };

  const removeContact = (index) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter((_, i) => i !== index)
    });
  };

  const updateContact = (index, field, value) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, contacts: newContacts });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo Club Deportivo</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4"/></Button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Datos Generales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Nombre del Club</label>
              <input className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" 
                     value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Fichas Aprox.</label>
              <input type="number" className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" 
                     value={formData.estimatedPlayers} onChange={e => setFormData({...formData, estimatedPlayers: Number(e.target.value)})} placeholder="Ej: 350" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Total de Equipos</label>
              <input type="number" className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" 
                     value={formData.totalTeams} onChange={e => setFormData({...formData, totalTeams: Number(e.target.value)})} placeholder="Ej: 15" />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Fútbol Base (Cantidad de Equipos)</label>
              <input type="number" className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" 
                     value={formData.baseTeams} onChange={e => setFormData({...formData, baseTeams: Number(e.target.value)})} placeholder="Ej: 12" />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Teléfono Genérico</label>
              <input className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2" 
                     value={formData.genericPhone} onChange={e => setFormData({...formData, genericPhone: e.target.value})} />
            </div>
          </div>

          {/* Listado de Contactos */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-emerald-600">Contactos Específicos</h3>
              <Button variant="outline" size="sm" onClick={addContactField}><Plus className="w-3 h-3 mr-1"/> Añadir</Button>
            </div>
            {formData.contacts.map((contact, index) => (
              <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 relative">
                {index > 0 && <button onClick={() => removeContact(index)} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>}
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Nombre" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                         value={contact.name} onChange={e => updateContact(index, 'name', e.target.value)} />
                  <input placeholder="Cargo" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                         value={contact.role} onChange={e => updateContact(index, 'role', e.target.value)} />
                  <input placeholder="Teléfono" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                         value={contact.phone} onChange={e => updateContact(index, 'phone', e.target.value)} />
                  <input placeholder="Email" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                         value={contact.email} onChange={e => updateContact(index, 'email', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="neon" onClick={() => onSave(formData)}><Save className="w-4 h-4 mr-2"/> Guardar Club</Button>
        </div>
      </div>
    </div>
  );
}