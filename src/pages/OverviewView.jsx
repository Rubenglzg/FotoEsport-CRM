import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, PhoneCall, Clock, AlertCircle, CheckCircle2, ChevronRight, Target, Loader2, RefreshCw, Briefcase } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const OverviewView = ({ clubs, tasks, interactions, onNavigate, onSelectClub }) => {
  const [activeMode, setActiveMode] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingAI, setLoadingAI] = useState(true);

  // Extraemos las tareas urgentes reales de tu base de datos
  const urgentTasks = tasks
    .filter(t => t.priority === 'high' || new Date(t.due) <= new Date())
    .slice(0, 3);

  // 1. LLAMADA A GEMINI (Caché + Nuevo Prompt de Secretario Estratégico)
  const fetchAIRecommendation = useCallback(async (forceRefresh = false) => {
    try {
      const today = new Date().toLocaleDateString(); 
      const cachedRec = localStorage.getItem('ai_rec_data');
      const cachedDate = localStorage.getItem('ai_rec_date');
      
      // Control de caché para no saturar la API
      if (!forceRefresh && cachedRec && cachedDate === today) {
          setAiRecommendation(JSON.parse(cachedRec));
          setLoadingAI(false);
          return; 
      }

      setLoadingAI(true);
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const activeClubs = clubs
          .filter(c => c.status !== 'rejected')
          .map(c => ({ id: c.id, nombre: c.name, estado: c.status, interaccion: c.lastInteraction }));
          
      const recentInteractions = interactions.slice(0, 8).map(i => {
          const clubInfo = clubs.find(c => c.id === i.clubId);
          return `Club: ${clubInfo?.name || 'Desconocido'} | Nota: ${i.note}`;
      });
      
      const prompt = `
        Eres el director comercial y secretario estratégico de un CRM de ventas de merchandising para clubes deportivos.
        Tu objetivo es analizar la agenda y el historial para crear el "Plan de Vuelo" del día para el vendedor.
        
        Datos actuales:
        - Tareas pendientes: ${JSON.stringify(tasks.slice(0, 8))}
        - HISTORIAL RECIENTE (¡CLAVE PARA SABER EL CONTEXTO!): ${JSON.stringify(recentInteractions)}
        - Estado de clubes: ${JSON.stringify(activeClubs.slice(0, 15))}
        
        Instrucciones:
        1. Actúa como un jefe/consejero: directo, claro, motivador y enfocado a facturar y no olvidar deadlines.
        2. Analiza las tareas y notas, y ordénalas según: 1º Cierres de venta (dinero rápido), 2º Deadlines urgentes, 3º Seguimientos importantes.
        3. Genera un breve resumen ejecutivo y un plan de acción con las 3 o 4 tareas más críticas que NO se le pueden olvidar hoy.
        
        Devuelve estrictamente un JSON con esta estructura (nada de markdown, solo JSON):
        {
          "executiveSummary": "Mensaje motivacional o de advertencia de 1-2 líneas (ej: 'Hoy es día de cierres, el presupuesto del club X está caliente. Estas son tus prioridades:')",
          "actionPlan": [
            {
              "title": "Título de la misión (Ej: Enviar Presupuesto a C.D. Castellón)",
              "reason": "Por qué va primero (Ej: Prometiste enviarlo hoy y están a punto de firmar)",
              "action": "Texto del botón (Ej: Redactar ahora, Ver Ficha, Llamar)",
              "clubId": "ID del club afectado o null"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      let textResult = result.response.text();
      textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedRecommendation = JSON.parse(textResult);
      
      localStorage.setItem('ai_rec_data', JSON.stringify(parsedRecommendation));
      localStorage.setItem('ai_rec_date', today);

      setAiRecommendation(parsedRecommendation);
    } catch (error) {
      console.error("Error al consultar a Gemini:", error);
      // Fallback en caso de error 503
      setAiRecommendation({
        executiveSummary: "Servidores de IA ocupados ahora mismo. Aquí tienes tu respaldo manual:",
        actionPlan: [
            {
                title: "Revisar pipeline general",
                reason: "Como no he podido analizar tus notas, te sugiero mirar los clubes en fase de 'Lead'.",
                action: "Ir a Directorio",
                clubId: null
            }
        ]
      });
    } finally {
      setLoadingAI(false);
    }
  }, [clubs, tasks, interactions]);

  useEffect(() => {
    if (clubs.length > 0) {
        fetchAIRecommendation(false);
    } else {
        setLoadingAI(false);
    }
  }, [clubs, tasks, fetchAIRecommendation]);

  const focusModes = [
    { id: 'cold-calls', title: "Ruta de Prospección", desc: "Llamar a clubes que aún no has contactado.", icon: PhoneCall, color: "bg-emerald-100 text-emerald-700" },
    { id: 'follow-ups', title: "Rescatar Indecisos", desc: "Contactar a clubes en negociación o leads fríos.", icon: Clock, color: "bg-orange-100 text-orange-700" },
    { id: 'urgent', title: "Apagar Fuegos", desc: "Completar las tareas marcadas como urgentes.", icon: AlertCircle, color: "bg-red-100 text-red-700" }
  ];

  // Nueva función adaptada para recibir el clubId de la lista de tareas
  const handleActionClick = (clubId) => {
    if (clubId) {
        const club = clubs.find(c => c.id === clubId);
        if (club) {
            onSelectClub(club);
            onNavigate('database'); 
        }
    } else {
        onNavigate('database');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hola, ¿qué hacemos hoy?</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Tu asistente inteligente ha revisado tu agenda y notas para organizarte el día.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* TARJETA DEL PLAN DE VUELO (Secretario AI) */}
          <div className="bg-gradient-to-br from-emerald-700 to-slate-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sparkles size={150} />
            </div>
            
            {loadingAI ? (
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-emerald-100 space-y-4 py-12">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-medium animate-pulse">Tu secretario virtual está organizando las prioridades de hoy...</p>
                </div>
            ) : (
                <div className="relative z-10">
                  {/* CABECERA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-white/20 pb-4 gap-4">
                      <div className="flex items-center space-x-2 text-emerald-300 font-bold tracking-wide uppercase text-sm">
                          <Briefcase size={18} />
                          <span>Briefing Diario</span>
                      </div>
                      <button 
                          onClick={() => fetchAIRecommendation(true)}
                          disabled={loadingAI}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border border-white/10 backdrop-blur-sm self-start sm:self-auto"
                          title="Volver a analizar la base de datos"
                      >
                          <RefreshCw size={14} className={loadingAI ? "animate-spin" : ""} />
                          Recalcular Plan
                      </button>
                  </div>

                  {/* MENSAJE EJECUTIVO */}
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-snug">
                      "{aiRecommendation?.executiveSummary || 'Aquí tienes las misiones ordenadas por prioridad para hoy.'}"
                  </h2>
                  
                  {/* LISTA DE ACCIONES (El Plan de Vuelo) */}
                  <div className="space-y-3">
                      {aiRecommendation?.actionPlan?.map((plan, index) => (
                          <div key={index} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md transition-all">
                              <div className="flex-1">
                                  <h3 className="font-bold text-white text-base flex items-start gap-3">
                                      <span className="bg-emerald-500 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                          {index + 1}
                                      </span>
                                      {plan.title}
                                  </h3>
                                  <p className="text-emerald-100/70 text-sm mt-1 ml-9">{plan.reason}</p>
                              </div>
                              <button 
                                  onClick={() => handleActionClick(plan.clubId)}
                                  className="bg-emerald-500 text-slate-900 text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap flex-shrink-0 md:ml-4 shadow-sm"
                              >
                                  {plan.action}
                              </button>
                          </div>
                      ))}
                  </div>

                </div>
            )}
          </div>

          {/* Modos de Trabajo (Atajos rápidos) */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <Target size={20} className="mr-2 text-slate-400" />
              Bloques de Enfoque Rápido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {focusModes.map((mode) => (
                <div 
                  key={mode.id} 
                  onClick={() => {
                      if(mode.id === 'cold-calls' || mode.id === 'follow-ups') onNavigate('database');
                      if(mode.id === 'urgent') onNavigate('calendar');
                  }}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 hover:border-emerald-500 cursor-pointer transition-all group shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${mode.color}`}>
                    <mode.icon size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-500 transition-colors">{mode.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{mode.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tareas del día (Sidebar derecho) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex justify-between items-center">
              Vencen pronto
              <span className="bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-2 py-0.5 rounded text-xs">
                  {urgentTasks.length}
              </span>
          </h3>
          
          <div className="space-y-4">
            {urgentTasks.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No tienes tareas atrasadas o para hoy. ¡Todo bajo control!</p>
            ) : (
                urgentTasks.map(task => (
                <div key={task.id} className="flex items-start p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-800">
                    <div className="mt-0.5 mr-3 text-slate-400 hover:text-emerald-600 cursor-pointer">
                    <CheckCircle2 size={20} />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{task.task}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.due} {task.time}</p>
                    </div>
                </div>
                ))
            )}
          </div>
          
          <button 
            onClick={() => onNavigate('calendar')}
            className="w-full mt-6 text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 py-2.5 rounded-lg transition-colors"
          >
            Ver Calendario Completo
          </button>
        </div>

      </div>
    </div>
  );
};

export default OverviewView;