import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AIChat({ clubs, tasks, interactions }) {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: '¡Hola! Ya tengo acceso a la ficha completa de tus clubes. Pregúntame por scorings, datos de contacto, número de jugadores o a quién debemos llamar.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processQueryWithGemini = async (userMsg) => {
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // 1. Mapeamos las notas de actividad asociando cada una a su club
      const registroActividad = interactions.map(i => {
          const club = clubs.find(c => c.id === i.clubId);
          return `[Club: ${club?.name || 'Desconocido'}] - Fecha: ${i.date || 'Sin fecha'} - Nota: ${i.note}`;
      });

      // 2. AMPLIACIÓN: Preparamos la FICHA COMPLETA para Gemini
      const dataContext = {
        clubes: clubs.map(c => ({
          nombre: c.name,
          estado: c.status,
          telefono: c.phone || 'No registrado',
          email: c.email || 'No registrado',
          contacto_principal: c.contactName || c.manager || c.contact || 'No registrado',
          scoring_calificacion: c.scoring || c.score || c.rating || 'Sin calificar',
          numero_jugadores: c.players || c.playersCount || c.numberOfPlayers || 'No especificado',
          numero_equipos: c.teams || c.teamsCount || c.numberOfTeams || 'No especificado',
          ciudad: c.city || 'No especificada',
          provincia: c.province || 'No especificada'
        })),
        tareas_pendientes: tasks.filter(t => !t.completed).map(t => {
          const club = clubs.find(c => c.id === t.clubId);
          return `[Tarea para: ${club?.name || 'Sin club'}] - Tipo: ${t.type} - Detalles: ${t.title}`;
        }),
        historial_notas: registroActividad
      };

      const prompt = `
        Eres el analista de datos y asistente comercial integrado en un CRM de ventas de merchandising deportivo.
        Tu trabajo es dar respuestas MUY precisas y útiles al vendedor analizando la base de datos que te proporciono.
        
        DATOS ACTUALES DEL CRM (JSON):
        ${JSON.stringify(dataContext)}

        PREGUNTA DEL USUARIO:
        "${userMsg}"

        INSTRUCCIONES CRÍTICAS:
        1. FICHAS DE CLUB: Tienes acceso a los datos completos (scoring, contactos, teléfonos, jugadores, etc.). Si el usuario te pide datos concretos de un club, búscalos en la sección 'clubes' y dáselos. Si te pregunta "qué clubes tienen mayor scoring" o "cuántos jugadores tiene X", usa esta información.
        2. ANÁLISIS DE NOTAS: Si el usuario te pregunta "a quién debo llamar", "quién me pidió que le contacte" o intenciones, lee OBLIGATORIAMENTE el "historial_notas" y cruza esa información con los datos del club.
        3. Formato: Usa listas con guiones y resalta los nombres o datos clave en negrita (Markdown) para que sea rápido de leer.
        4. Tono: Profesional, directo y colaborador. Si un dato pone "No registrado" o "Sin calificar", díselo al usuario de forma natural (ej: "No tenemos registrado el número de jugadores").
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error en Gemini Chat:", error);
      return "Ups, ha habido un error de conexión con la IA. Revisa tu consola o intenta de nuevo en unos segundos.";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    const aiResponseText = await processQueryWithGemini(userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponseText }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
        <Sparkles className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Consultas Rápidas (Gemini)</h3>
      </div>

      {/* Historial */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-500 text-white rounded-2xl rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-2xl rounded-tl-none prose prose-sm dark:prose-invert max-w-none'
              }`}
            >
              <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 flex-row">
             <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
               <Bot size={16} />
             </div>
             <div className="bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Dime los datos de contacto del CD Castellón..."
          className="flex-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}