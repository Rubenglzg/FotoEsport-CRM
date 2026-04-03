import React, { useState, useEffect, useMemo } from 'react';
import { 
  Map, Users, Phone, Calendar as CalendarIcon, Search, Filter, Menu, 
  CheckCircle2, XCircle, Clock, Bell, Settings, 
  ChevronRight, MoreHorizontal, Target, ArrowUpRight,
  MessageSquare, Briefcase, Zap, Plus, X, ChevronDown, 
  LayoutGrid, List, Download, UserPlus, Send, CalendarDays, Smartphone,
  Save, FileSpreadsheet, RefreshCw, AlertTriangle, Trash2, Navigation, Flag,
  BookOpen, Copy, FileText, ExternalLink, Camera, FileSignature, CheckSquare, Upload,
  MapPin, Clock3, RotateCcw, Lock, Loader2, Mail
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from './lib/firebase.js';

import { useGoogleLogin } from '@react-oauth/google';

const appId = 'fotoesport-crm';

/**
 * --- DESIGN TOKENS & UTILS ---
 */
const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * --- UTILS GENERACIÓN DOCUMENTOS (MOTOR PDF) ---
 */
const generateContractFile = (clubName, season) => {
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <title>Contrato ${clubName} - ${season}</title>
        <style>
          @page { size: A4; margin: 1.5cm; }
          body { font-family: 'Times New Roman', serif; line-height: 1.2; color: #000; max-width: 100%; margin: 0 auto; padding: 0; background: white; font-size: 10pt; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 8px; }
          .logo { font-size: 18px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
          .title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
          .subtitle { font-size: 11px; font-style: italic; color: #444; }
          .parties { margin-bottom: 15px; background: #f8f9fa; padding: 8px 15px; border: 1px solid #ddd; font-size: 9.5pt; }
          .parties p { margin: 3px 0; }
          .clause { margin-bottom: 8px; text-align: justify; font-size: 10pt; }
          .clause-title { font-weight: bold; text-transform: uppercase; font-size: 10pt; margin-right: 5px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 100px; page-break-inside: avoid; }
          .signature-box { width: 45%; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 9pt; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 7pt; color: #888; border-top: 1px solid #eee; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">FOTOESPORT MERCH</div>
          <div class="title">Contrato de Colaboración y Cesión de Derechos</div>
          <div class="subtitle">Temporada Oficial ${season}</div>
        </div>
        <div class="parties">
          <p>En Castellón, a <strong>${today}</strong>.</p>
          <p><strong>REUNIDOS:</strong></p>
          <p>De una parte, <strong>FOTOESPORT MERCH</strong> (en adelante, "El Proveedor").</p>
          <p>De otra parte, <strong>${clubName.toUpperCase()}</strong> (en adelante, "El Club").</p>
          <p>Ambas partes se reconocen mutuamente la capacidad legal necesaria para la firma del presente contrato.</p>
        </div>
        <div class="clause">
          <span class="clause-title">I. OBJETO.</span>
          El presente acuerdo regula la colaboración para la realización de la sesión fotográfica oficial de la temporada y la posterior gestión, producción y venta de productos de merchandising personalizados.
        </div>
        <div class="clause">
          <span class="clause-title">II. CESIÓN DE DERECHOS DE IMAGEN.</span>
          El Club garantiza poseer las autorizaciones de los jugadores (o tutores legales) y <strong>CEDE AL PROVEEDOR</strong> el derecho no exclusivo a utilizar y explotar comercialmente dichas imágenes. Esta cesión se limita <strong>EXCLUSIVAMENTE</strong> a la elaboración y venta de los productos de merchandising objeto de este acuerdo, quedando prohibido cualquier otro uso ajeno a este fin.
        </div>
        <div class="clause">
          <span class="clause-title">III. PROTECCIÓN DE DATOS.</span>
          El Proveedor tratará las imágenes conforme al RGPD, actuando como Encargado del Tratamiento. Se garantiza que los datos no serán cedidos a terceros ni utilizados para fines distintos a la ejecución de este contrato.
        </div>
        <div class="clause">
          <span class="clause-title">IV. PROPIEDAD INTELECTUAL.</span>
          Los derechos sobre las fotografías pertenecen al Proveedor. El Club podrá usar las fotos de equipo para comunicaciones institucionales citando la autoría.
        </div>
        <div class="clause">
          <span class="clause-title">V. VIGENCIA.</span>
          Este acuerdo tendrá validez durante la temporada ${season}, prorrogándose tácitamente salvo comunicación en contra con 30 días de antelación.
        </div>
        <div class="clause">
          <span class="clause-title">VI. JURISDICCIÓN.</span>
          Para cualquier discrepancia, ambas partes se someten a los Juzgados de Castellón.
        </div>
        <div class="signatures">
          <div class="signature-box">
            <strong>POR FOTOESPORT MERCH</strong><br/><span style="font-size: 7pt; color: #666;">(Firma y Sello)</span><br/><br/><br/>Fdo: Dirección Comercial
          </div>
          <div class="signature-box">
            <strong>POR ${clubName.toUpperCase()}</strong><br/><span style="font-size: 7pt; color: #666;">(Firma y Sello)</span><br/><br/><br/>Fdo: El Presidente / Responsable
          </div>
        </div>
        <div class="footer">Documento generado digitalmente por FotoEsport Season Manager - Válido a efectos administrativos.</div>
        <script>setTimeout(() => { window.print(); }, 800);</script>
      </body>
      </html>
    `;

    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        alert("Por favor, permite las ventanas emergentes para generar el contrato PDF.");
    }
};

const exportToCSV = (clubs, seasonName) => {
    const headers = ["ID", "Club", "Categoria", "Estado", "Ultima Interaccion", "Contacto Principal"];
    const rows = clubs.map(club => {
        const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || {};
        return [
            club.id, `"${club.name}"`, club.category, club.status, club.lastInteraction, `"${mainContact?.name || ''}"`
        ];
    });
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FotoEsport_Export_${seasonName.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Guiones de Venta
const SALES_SCRIPTS = {
    cold_call: { title: "Llamada en Frío (Apertura)", text: "Hola [Nombre], soy [TuNombre] de FotoEsport. Trabajamos con clubes como el Villarreal o el Castellón..." },
    closing_contract: { title: "Cierre: Envío de Contrato", text: "Genial. Para formalizarlo y poder agendar el día de la sesión, te envío ahora mismo el contrato..." },
    objection_rights: { title: "Objeción: 'Derechos de Imagen'", text: "Es un trámite estándar. Nosotros nos encargamos de la custodia de las imágenes..." },
    whatsapp_intro: { title: "WhatsApp: Primer Contacto", text: "Hola [Nombre] 👋, soy [TuNombre] de FotoEsport. Te escribo rápido..." }
};

// Datos semilla (Por si la base de datos está vacía)
const SEED_CLUBS = [
  { id: '1', name: "C.D. Castellón Base", status: "signed", lat: 50, lng: 50, category: "Fútbol", lastInteraction: "2d", assets: { hasLogo: true, hasRoster: true, contractSigned: true }, sessionDate: "2025-11-15T16:00", contacts: [{ name: "Carlos", role: "Coordinador", phone: "600000000", email: "carlos@cdcastellon.com", isDecisionMaker: true }] },
  { id: '2', name: "Atlético Vivero", status: "lead", lat: 45, lng: 55, category: "Fútbol", lastInteraction: "Never", assets: { hasLogo: false, hasRoster: false, contractSigned: false }, contacts: [{ name: "Roberto", role: "Presidente", phone: "611111111", email: "presi@atleticovivero.com", isDecisionMaker: true }] }
];

// 🟢 AÑADE ESTO JUSTO DEBAJO:
const INITIAL_SEASONS = ['2024-2025'];

const INITIAL_TASKS = [
  { id: 1, clubId: '1', task: 'Confirmar hora de la sesión fotográfica', priority: 'high', due: '2025-10-22', time: '10:00' },
  { id: 2, clubId: '2', task: 'Enviar propuesta de merchandising', priority: 'medium', due: '2025-10-24', time: '12:00' }
];

const INITIAL_TIMELINE = [
  { id: 1, clubId: '1', type: 'call', user: 'Tú', note: 'Llamada inicial de presentación', date: '01/10/2025' }
];

/**
 * --- COMPONENTES UI (ATOMIC) ---
 */
const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    outline: "border-zinc-700 text-zinc-400 bg-transparent",
    renewal: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse",
  };
  return <span className={cn("px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border", variants[variant], className)}>{children}</span>;
};

const Button = ({ children, variant = 'primary', size = 'md', className, onClick, disabled, title, isLoading }) => {
  const variants = {
    primary: "bg-zinc-100 text-black hover:bg-white border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)]",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800",
    outline: "bg-transparent border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900",
    neon: "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
    whatsapp: "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
  };
  const sizes = { xs: "h-6 px-2 text-[10px]", sm: "h-7 px-2 text-xs", md: "h-9 px-4 text-sm", icon: "h-9 w-9 p-0 grid place-items-center" };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled || isLoading} 
      title={title} 
      className={cn(
        "rounded-lg font-medium transition-all duration-200 flex items-center justify-center border", 
        (disabled || isLoading) ? "opacity-50 cursor-not-allowed" : "active:scale-95",
        variants[variant], 
        sizes[size], 
        className
      )}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
      {children}
    </button>
  );
};

/**
 * --- PANTALLA DE LOGIN SEGURA CON FIREBASE ---
 */
const LoginScreen = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLogin();
        } catch (err) {
            console.error("Error logging in:", err);
            setError(true);
            setTimeout(() => setError(false), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-zinc-950 items-center justify-center font-sans">
            <div className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-black font-bold text-3xl shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-6">
                    F
                </div>
                <h1 className="text-xl font-bold text-white mb-2">FotoEsport CRM</h1>
                <p className="text-zinc-500 text-xs mb-8 text-center">Acceso restringido. Por favor, introduce tus credenciales de administrador.</p>
                
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div>
                        <div className="relative mb-4">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="email" 
                                placeholder="Correo corporativo"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="password" 
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={cn(
                                    "w-full bg-zinc-950 border rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors",
                                    error ? "border-red-500 focus:border-red-500" : "border-zinc-700 focus:border-emerald-500"
                                )}
                            />
                        </div>
                        {error && <p className="text-red-500 text-[10px] mt-2 font-bold text-center">Credenciales incorrectas o usuario no encontrado.</p>}
                    </div>
                    <Button variant="neon" className="w-full py-6 text-base font-bold tracking-wide mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Acceder al Sistema"}
                    </Button>
                </form>
                <p className="text-[9px] text-zinc-600 mt-8 text-center uppercase tracking-widest">Grupo Avantia © 2026</p>
            </div>
        </div>
    );
};

/**
 * --- VISTAS DEL SISTEMA ---
 */

// 1. VISTA MAPA
const TacticalMap = ({ clubs, selectedId, onSelect, showRadius, setShowRadius, showRoute, setShowRoute, tasks, origin, routeStops, setRouteStops, onOptimizeRoute }) => {
  const [zoom, setZoom] = useState(1);
  const routePoints = useMemo(() => {
      if (!showRoute) return [];
      const clubsWithTasks = clubs.filter(c => tasks.some(t => t.clubId === c.id));
      return clubsWithTasks.sort((a, b) => b.lat - a.lat);
  }, [showRoute, clubs, tasks]);

  return (
    <div className="flex-1 relative bg-[#09090b] overflow-hidden group">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: `linear-gradient(#3f3f46 1px, transparent 1px), linear-gradient(90deg, #3f3f46 1px, transparent 1px)`, backgroundSize: '40px 40px', transform: `scale(${zoom})` }} />
      <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
        {/* Lógica de dibujado de ruta y pines (reducida por legibilidad) */}
        {showRoute && routePoints.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.4" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.9" /></linearGradient>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                </defs>
                <polyline points={routePoints.map(p => `${p.lng}%,${p.lat}%`).join(' ')} fill="none" stroke="url(#routeGradient)" strokeWidth="0.8" strokeDasharray="2, 2" markerMid="url(#arrow)" markerEnd="url(#arrow)" className="animate-pulse" />
            </svg>
        )}
        {showRoute && (
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center" style={{ top: `${origin.lat}%`, left: `${origin.lng}%` }}>
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce"><MapPin className="w-3 h-3 text-white fill-current" /></div>
                <span className="bg-black/70 text-white text-[9px] px-1.5 rounded mt-1 backdrop-blur-sm border border-zinc-700">OFICINA</span>
            </div>
        )}
        {clubs.map((club) => {
          const isSelected = selectedId === club.id;
          let pinColor = "bg-zinc-600 border-zinc-400";
          if (club.status === 'signed') pinColor = "bg-emerald-500 border-white shadow-[0_0_20px_rgba(16,185,129,0.6)]";
          if (club.status === 'negotiation') pinColor = "bg-amber-500 border-amber-200";
          if (club.status === 'rejected') pinColor = "bg-red-900 border-red-700 opacity-50";
          if (club.status === 'renewal_pending') pinColor = "bg-blue-500 border-blue-300 animate-pulse";
          const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
          const routeIndex = routeStops.findIndex(s => s.id === club.id);
          const isInRoute = showRoute && routeIndex !== -1;

          return (
            <div key={club.id} onClick={(e) => { e.stopPropagation(); onSelect(club); }} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 hover:z-50 group/pin" style={{ top: `${club.lat}%`, left: `${club.lng}%` }}>
              {isSelected && showRadius && club.status === 'signed' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-pulse pointer-events-none flex items-center justify-center">
                   <div className="absolute top-2 right-1/2 translate-x-1/2 text-[10px] text-emerald-500 font-mono bg-black/50 px-1 rounded">RADIO 5KM</div>
                </div>
              )}
              <div className={cn("w-3 h-3 rounded-full border-2 relative transition-transform group-hover/pin:scale-150", pinColor, isInRoute && "ring-4 ring-emerald-500/50 scale-125 bg-emerald-400 border-white")}>
                {isSelected && <div className="absolute -inset-2 rounded-full border border-white/50 animate-ping" />}
                {needsAttention && !isSelected && <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full border border-black font-bold">!</div>}
                {isInRoute && <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold text-[9px] px-1.5 rounded-full border border-emerald-400 shadow-md z-30">{routeIndex + 1}</div>}
              </div>
              {(isSelected || club.status === 'signed' || club.status === 'renewal_pending') && (
                <div className={cn("absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border border-zinc-800 whitespace-nowrap pointer-events-none", isSelected ? "bg-white text-black z-50" : "bg-black/60 text-zinc-400")}>{club.name}</div>
              )}
            </div>
          );
        })}
      </div>

      {showRoute && (
          <div className="absolute top-4 left-4 z-40 w-72 bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[80%] animate-in slide-in-from-left-4 duration-300">
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Navigation className="w-4 h-4 text-emerald-500"/> Planificador</h3>
                  <button onClick={() => setShowRoute(false)}><X className="w-4 h-4 text-zinc-500 hover:text-white"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-blue-900/30 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                      <div><span className="text-xs font-bold text-white block">Oficina Central</span><span className="text-[10px] text-zinc-500">Punto de Partida</span></div>
                  </div>
                  <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase px-1 mt-2 mb-1">Selecciona Paradas</p>
                      {clubs.map(club => {
                          const isSelected = routeStops.some(s => s.id === club.id);
                          const stopData = routeStops.find(s => s.id === club.id) || {};
                          return (
                              <div key={club.id} className={cn("border rounded-lg transition-all", isSelected ? "bg-zinc-900 border-emerald-500/50" : "border-transparent hover:bg-zinc-900")}>
                                  <div className="flex items-center gap-3 p-2 cursor-pointer" onClick={() => { isSelected ? setRouteStops(routeStops.filter(s => s.id !== club.id)) : setRouteStops([...routeStops, { id: club.id, openTime: "17:00", closeTime: "20:00" }]); }}>
                                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isSelected ? "bg-emerald-500 border-emerald-500" : "border-zinc-600")}>{isSelected && <CheckCircle2 className="w-3 h-3 text-black"/>}</div>
                                      <span className={cn("text-xs font-medium truncate flex-1", isSelected ? "text-white" : "text-zinc-400")}>{club.name}</span>
                                  </div>
                                  {isSelected && (
                                      <div className="px-2 pb-2 pt-0 flex items-center gap-2 animate-in slide-in-from-top-1">
                                          <Clock3 className="w-3 h-3 text-zinc-500"/>
                                          <input type="time" className="bg-zinc-950 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white w-14 focus:border-emerald-500 outline-none" value={stopData.openTime} onChange={(e) => setRouteStops(routeStops.map(s => s.id === club.id ? { ...s, openTime: e.target.value } : s))} />
                                          <span className="text-zinc-600 text-[10px]">-</span>
                                          <input type="time" className="bg-zinc-950 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white w-14 focus:border-emerald-500 outline-none" value={stopData.closeTime} onChange={(e) => setRouteStops(routeStops.map(s => s.id === club.id ? { ...s, closeTime: e.target.value } : s))} />
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
              <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 rounded-b-xl space-y-2">
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => setRouteStops([])}><RotateCcw className="w-3 h-3 mr-1"/> Limpiar</Button>
                      <Button variant="neon" size="sm" className="flex-[2] text-[10px]" onClick={onOptimizeRoute}><Zap className="w-3 h-3 mr-1"/> Calcular Óptima</Button>
                  </div>
              </div>
          </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
         {selectedId && clubs.find(c => c.id === selectedId)?.status === 'signed' && (
           <button onClick={() => setShowRadius(!showRadius)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRadius ? "bg-emerald-500 text-black border-emerald-400" : "bg-zinc-900 text-white border-zinc-700")}>
             <Target className={cn("w-4 h-4", showRadius && "animate-spin-slow")} />
             {showRadius ? "RADAR: ON" : "RADAR"}
           </button>
         )}
         <button onClick={() => setShowRoute(!showRoute)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-xl", showRoute ? "bg-white text-black border-white" : "bg-zinc-900 text-white border-zinc-700")}>
            <Navigation className="w-4 h-4" />
            {showRoute ? "OCULTAR RUTA" : "RUTA DE VISITA"}
         </button>
      </div>
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}><Plus className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}><X className="w-4 h-4 rotate-45" /></Button>
      </div>
    </div>
  );
};

// 2. VISTA DATABASE
const DatabaseView = ({ clubs, onSelect }) => {
  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Cartera de Clubes</h2>
          <p className="text-zinc-400 text-sm">Gestiona contactos y estados.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Exportar CSV</Button>
           <Button variant="neon"><Plus className="w-4 h-4 mr-2"/> Nuevo Club</Button>
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex-1">
        <div className="grid grid-cols-12 bg-zinc-950/50 border-b border-zinc-800 p-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
           <div className="col-span-5">Club / Categoría</div>
           <div className="col-span-2">Estado</div>
           <div className="col-span-3">Contacto Principal</div>
           <div className="col-span-1 text-right">Prox. Contacto</div>
           <div className="col-span-1 text-right">Acción</div>
        </div>
        <div className="overflow-y-auto h-full pb-10">
           {clubs.map(club => {
             const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || {};
             const needsAttention = club.lastInteraction === "Never" || club.lastInteraction === "30d";
             return (
               <div key={club.id} onClick={() => onSelect(club)} className="grid grid-cols-12 items-center p-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  <div className="col-span-5 flex items-center gap-2">
                     {needsAttention && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Requiere Atención"></div>}
                     <div>
                        <div className="font-bold text-zinc-200 group-hover:text-white">{club.name}</div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3"/> {club.category}</div>
                     </div>
                  </div>
                  <div className="col-span-2"><StatusBadge status={club.status} /></div>
                  <div className="col-span-3">
                     <div className="text-sm text-zinc-300">{mainContact?.name || 'Sin contacto'}</div>
                     <div className="text-xs text-zinc-500">{mainContact?.role || '-'}</div>
                  </div>
                  <div className="col-span-1 text-right text-xs font-mono text-zinc-400">{club.nextContact || '-'}</div>
                  <div className="col-span-1 flex justify-end"><Button variant="ghost" size="icon"><ChevronRight className="w-4 h-4"/></Button></div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

// 3. VISTA CALENDARIO CON PRIORIDADES
const CalendarView = ({ tasks, onUpdateTaskPriority, onOpenNewTask }) => {
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const dateMap = { '2025-10-22': 2, '2025-10-24': 4 }; // Simulación de fechas a columnas

  const sortTasks = (taskList) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return [...taskList].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white">Agenda de Seguimiento</h2>
            <p className="text-sm text-zinc-400">Las tareas de Alta Prioridad aparecen primero.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline"><ChevronDown className="w-4 h-4 mr-2"/> Octubre 2025</Button>
           <Button variant="primary" onClick={onOpenNewTask}><Plus className="w-4 h-4 mr-2"/> Tarea Manual</Button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4 h-[600px]">
         {weekDays.map((day, i) => (
           <div key={day} className="bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col">
              <div className="p-3 border-b border-zinc-800 text-center">
                 <span className="text-sm font-bold text-zinc-400 uppercase">{day}</span>
                 <div className={cn("text-2xl font-bold mt-1", i === 1 ? "text-emerald-400" : "text-zinc-600")}>{20 + i}</div>
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
};

const TaskCard = ({ task, onTogglePriority }) => (
  <div className={cn("p-3 rounded border text-left group relative transition-all", task.priority === 'high' ? "bg-amber-900/10 border-amber-500/30 hover:border-amber-500/50" : "bg-zinc-800 border-zinc-700 hover:border-zinc-500")}>
     <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {task.time}</span>
        <button onClick={(e) => { e.stopPropagation(); onTogglePriority(); }} title={`Prioridad: ${task.priority === 'high' ? 'Alta' : 'Normal'} - Click para cambiar`} className={cn("p-1 rounded transition-colors", task.priority === 'high' ? "text-amber-500 hover:bg-amber-500/20" : "text-zinc-600 hover:text-white hover:bg-zinc-700")}>
            <Flag className="w-3 h-3" fill={task.priority === 'high' ? "currentColor" : "none"}/>
        </button>
     </div>
     <p className="text-xs font-bold text-zinc-200 leading-tight mb-1">{task.task}</p>
     <p className="text-[10px] text-zinc-500 truncate">Club ID: {task.clubId || 'Manual'}</p>
     {task.priority === 'high' && <span className="absolute bottom-1 right-2 text-[8px] font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">PRIORITARIO</span>}
  </div>
);

// 4. VISTA OBJETIVOS
const TargetsView = ({ stats, targetClients }) => {
  return (
    <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
       <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-bold text-white">Rendimiento Comercial</h2>
           <div className="text-right">
               <p className="text-[10px] font-bold uppercase text-zinc-500">Objetivo Temporada</p>
               <p className="text-xl font-mono text-emerald-400">{targetClients} Clubes</p>
           </div>
       </div>
       <div className="grid grid-cols-3 gap-6 mb-8">
          <MetricCard title="Clubes Activos (Clientes)" value={stats.signed} change="+3" trend="up" icon={<CheckCircle2 className="w-5 h-5"/>} />
          <MetricCard title="Conversión de Leads" value={`${stats.total > 0 ? (stats.signed / stats.total * 100).toFixed(0) : 0}%`} change="+5%" trend="up" icon={<Zap className="w-5 h-5"/>} />
          <MetricCard title="En Negociación" value={stats.negotiation} change="-2" trend="down" icon={<Users className="w-5 h-5"/>} />
       </div>
       <div className="grid grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
             <h3 className="text-lg font-bold text-white mb-4">Estado de la Cartera</h3>
             <div className="space-y-4">
                <FunnelStep label="Total Base de Datos" count={stats.total} color="bg-zinc-700" width="100%" />
                <FunnelStep label="En Negociación" count={stats.negotiation} color="bg-amber-500" width="40%" />
                <FunnelStep label="Clientes Cerrados" count={stats.signed} color="bg-emerald-500" width="25%" />
             </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center items-center text-center">
             <div className="w-32 h-32 rounded-full border-4 border-zinc-800 border-t-emerald-500 flex items-center justify-center mb-4 relative">
                <div className="text-center z-10"><span className="text-3xl font-bold text-white">{stats.signed}</span><span className="text-xs text-zinc-500 block">/ {targetClients}</span></div>
             </div>
             <h3 className="text-lg font-bold text-white">Progreso Objetivo</h3>
             <p className="text-sm text-zinc-400">Te faltan {Math.max(0, targetClients - stats.signed)} clubes.</p>
          </div>
       </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, trend, icon }) => (
   <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
         <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">{icon}</div>
         <span className={cn("text-xs font-bold px-2 py-1 rounded", trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>{change}</span>
      </div>
      <h3 className="text-zinc-500 text-sm font-bold uppercase">{title}</h3>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
   </div>
);

const FunnelStep = ({ label, count, color, width }) => (
   <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-zinc-400">{label}</span><span className="text-white font-bold">{count}</span></div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className={cn("h-full rounded-full", color)} style={{ width }}></div></div>
   </div>
);

// 5. NOTIFICATION CENTER
const NotificationCenter = ({ notifications, onClose, onClearAll }) => {
    return (
        <div className="absolute top-16 right-6 w-80 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-[55] animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-500"/> Notificaciones</h3>
                <button onClick={onClose}><X className="w-4 h-4 text-zinc-500 hover:text-white"/></button>
            </div>
            <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 flex flex-col items-center"><CheckCircle2 className="w-6 h-6 mb-2 opacity-20"/>Todo al día, capitán.</div>
                ) : (
                    notifications.map((notif, i) => (
                        <div key={i} className="p-3 border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors flex gap-3">
                            <div className="mt-1">{notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-500"/>}{notif.type === 'info' && <Bell className="w-4 h-4 text-zinc-500"/>}</div>
                            <div><p className="text-xs font-bold text-zinc-200">{notif.title}</p><p className="text-[10px] text-zinc-500 mt-1">{notif.message}</p></div>
                        </div>
                    ))
                )}
            </div>
            {notifications.length > 0 && (
                <div className="p-2 bg-zinc-900/50 text-center border-t border-zinc-800">
                    <button onClick={onClearAll} className="text-[10px] text-zinc-500 hover:text-emerald-400 uppercase font-bold tracking-wider transition-colors">Marcar todas como leídas</button>
                </div>
            )}
        </div>
    );
};

// 6. SETTINGS MODAL
const SettingsModal = ({ onClose, targetClients, setTargetClients, onRollover, seasons, currentSeason, setGoogleToken }) => {
    const [localTarget, setLocalTarget] = useState(targetClients);
    const [nextSeasonName, setNextSeasonName] = useState(() => {
        const last = seasons[seasons.length - 1];
        if(!last) return "2025-2026";
        const [start, end] = last.split('-').map(Number);
        return `${start + 1}-${end + 1}`;
    });

    // --- NUEVO CÓDIGO DE GOOGLE ---
    const handleGoogleConnect = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            console.log("¡Conexión exitosa! Token:", tokenResponse.access_token);
            // Guardamos el token en el estado global
            setGoogleToken(tokenResponse.access_token);
            alert("Cuenta de Google vinculada correctamente al CRM.");
        },
        onError: (error) => {
            console.error('Error conectando con Google:', error);
            alert("Hubo un error al conectar con Google.");
        },
        // Pedimos permiso para leer/escribir en el calendario y leer correos
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
    });
    // ------------------------------

    const handleSaveObjectives = () => { setTargetClients(Number(localTarget)); alert("Objetivos actualizados correctamente."); };

    const handleLogout = () => {
        if(window.confirm('¿Seguro que deseas cerrar sesión?')) {
            signOut(auth);
        }
    };

    return (
      <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
           <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5"/> Configuración</h2>
              <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white"/></button>
           </div>
           <div className="p-6 space-y-6">
            {/* --- NUEVO BLOQUE INTEGRACIONES --- */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Integraciones de Sistema</h3>
                 <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex items-center justify-between">
                    <div>
                        <div className="text-white font-bold text-sm">Google Workspace</div>
                        <div className="text-xs text-zinc-500 mt-1">Conectar Calendario y Gmail para IA</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleGoogleConnect()}>
                        <RefreshCw className="w-4 h-4 mr-2 text-blue-400"/> Vincular Cuenta
                    </Button>
                 </div>
              </div>
              {/* ----------------------------------- */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Objetivos de Temporada</h3>
                 <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                    <label className="text-xs text-zinc-500 block mb-1">Meta de Clubes (Clientes Cerrados)</label>
                    <div className="flex gap-2">
                        <input type="number" className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-emerald-500" value={localTarget} onChange={(e) => setLocalTarget(e.target.value)}/>
                        <Button variant="primary" size="sm" onClick={handleSaveObjectives}><Save className="w-4 h-4 mr-2"/> Guardar</Button>
                    </div>
                 </div>
              </div>
              <div>
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Ciclo de Vida</h3>
                 <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-white font-bold"><RefreshCw className="w-4 h-4 text-emerald-500"/>Migración de Temporada</div>
                    <div className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        Esta acción exportará los datos de <b>{currentSeason}</b> a Excel y preparará la base de datos para <b>{nextSeasonName}</b>.
                        <br/><br/>
                        <span className="text-emerald-400 font-bold">Nota Importante:</span> Los clubes NO se borran. Se migrarán automáticamente:
                        <ul className="list-disc list-inside mt-1 ml-1 text-zinc-500">
                            <li>Clientes actuales → <span className="text-blue-400">Renovación Pendiente</span></li>
                            <li>Resto → <span className="text-zinc-400">Leads</span></li>
                        </ul>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 mt-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Nombre Próxima Temporada</label>
                        <div className="flex gap-2 mt-1">
                            <input value={nextSeasonName} onChange={(e) => setNextSeasonName(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"/>
                            <Button variant="neon" size="sm" className="whitespace-nowrap" onClick={() => onRollover(nextSeasonName)}><FileSpreadsheet className="w-4 h-4 mr-2"/> Exportar y Migrar</Button>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
           <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                <Button variant="outline" className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50" onClick={handleLogout}>
                    Cerrar Sesión
                </Button>
           </div>
        </div>
      </div>
    );
};

// 7. NEW TASK MODAL
const NewTaskModal = ({ onClose, onSave }) => {
    const [task, setTask] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
    const [priority, setPriority] = useState("medium");

    const handleSubmit = () => {
        if (!task) return;
        onSave({ id: Math.random().toString(), clubId: 'Manual', task, priority, due: date, time: "09:00" });
    };

    return (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-xl p-6 shadow-2xl">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-white">Nueva Tarea Manual</h3>
                     <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white"/></button>
                 </div>
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs text-zinc-500 block mb-1">Descripción</label>
                         <input autoFocus className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" value={task} onChange={e => setTask(e.target.value)} placeholder="Ej: Comprar material oficina"/>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs text-zinc-500 block mb-1">Fecha</label>
                             <input type="date" className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white outline-none" value={date} onChange={e => setDate(e.target.value)}/>
                         </div>
                         <div>
                             <label className="text-xs text-zinc-500 block mb-1">Prioridad</label>
                             <select className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white outline-none" value={priority} onChange={e => setPriority(e.target.value)}>
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
};

// 8. SALES SCRIPT DRAWER
const ScriptsDrawer = ({ onClose }) => {
    const [copied, setCopied] = useState(null);

    const handleCopy = (key, text) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="absolute inset-y-0 right-0 w-[400px] bg-zinc-950 border-l border-zinc-800 z-[70] shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-500"/> Librería de Guiones</h2>
                <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white"/></button>
             </div>
             <p className="text-xs text-zinc-400 mb-6">Respuestas probadas para las situaciones más comunes. Copia y pega.</p>
             
             <div className="space-y-6">
                 {Object.entries(SALES_SCRIPTS).map(([key, script]) => (
                     <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 group hover:border-zinc-600 transition-colors">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-sm font-bold text-white">{script.title}</h3>
                             <button onClick={() => handleCopy(key, script.text)} className={cn("text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors", copied === key ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-500 bg-zinc-950 border border-zinc-800 group-hover:text-white")}>
                                 {copied === key ? <CheckCircle2 className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                                 {copied === key ? "Copiado" : "Copiar"}
                             </button>
                         </div>
                         <div className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-950/50 p-3 rounded border border-zinc-800/50">"{script.text}"</div>
                     </div>
                 ))}
             </div>
        </div>
    );
};

/**
 * --- COMPONENTE PANEL DE DETALLE (CLUB) ---
 */
function ClubDetailPanel({ club, onUpdateClub, onClose, activeTab, setActiveTab, onAddTask, interactions, onAddInteraction, currentSeason }) {
    const [note, setNote] = useState("");
    const [interactionType, setInteractionType] = useState('call');
    const [nextDate, setNextDate] = useState("");
    const [showScripts, setShowScripts] = useState(false);
    
    // 1. Añadimos el estado de carga
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 2. Modificamos la función para que sea asíncrona y use el estado de carga
    const handleAddInteraction = async (customNote = null, customType = null) => {
        const finalText = customNote || note;
        const finalType = customType || interactionType;
        if(!finalText) return;
        
        setIsSubmitting(true); // Encendemos el loader
        
        try {
            // Usamos await para esperar a que Firebase y Google terminen
            await onAddInteraction({ id: Math.random().toString(), clubId: club.id, type: finalType, user: "Tú", note: finalText, date: new Date().toLocaleDateString() });
            
            if(nextDate) {
                await onAddTask({ id: Math.random().toString(), clubId: club.id, task: `Seguimiento: ${finalType === 'call' ? 'Llamada' : 'Contacto'}`, priority: 'medium', due: nextDate, time: '09:00' });
            }
            
            setNote("");
            setNextDate("");
        } catch (error) {
            console.error("Error guardando datos:", error);
            alert("Hubo un error al guardar.");
        } finally {
            setIsSubmitting(false); // Apagamos el loader
        }
    };

    const toggleAsset = (assetKey) => {
        const updatedAssets = { ...club.assets, [assetKey]: !club.assets[assetKey] };
        onUpdateClub({ ...club, assets: updatedAssets });
    };

    const handleGenerateContract = () => {
        generateContractFile(club.name, currentSeason);
        handleAddInteraction(`Generado y descargado contrato de temporada ${currentSeason} (Merchandising + Cesión Derechos de Imagen).`, 'email');
    };

    const handleSessionDateChange = (e) => {
        const newDate = e.target.value;
        onUpdateClub({ ...club, sessionDate: newDate });
        if(newDate) {
             onAddTask({ id: Math.random().toString(), clubId: club.id, task: `📸 SESIÓN DE FOTOS: ${club.name}`, priority: 'high', due: newDate.split('T')[0], time: newDate.split('T')[1] });
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-[400px]">
              <div className="p-6 border-b border-zinc-800 relative bg-zinc-900/50">
                 <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                 <div className="flex items-start gap-4 mb-4">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold border", club.status === 'signed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700")}>
                      {club.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-tight">{club.name}</h2>
                      <p className="text-zinc-400 text-sm mt-1 flex items-center gap-2"><Users className="w-3 h-3" /> {club.category}</p>
                    </div>
                 </div>
                 <div className="flex gap-2 mb-2 items-center">
                    <StatusBadge status={club.status} />
                    <button onClick={() => setShowScripts(true)} className="ml-auto text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors">
                        <BookOpen className="w-4 h-4"/> Ver Guiones
                    </button>
                 </div>
              </div>

              <div className="flex border-b border-zinc-800">
                 <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Gestión</TabButton>
                 <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')}>Actividad</TabButton>
              </div>

              <div className="flex-1 overflow-y-auto bg-zinc-950/50 p-6">
                 {activeTab === 'details' ? (
                   <div className="space-y-8">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <Section title="Contactos" />
                            <Button variant="ghost" size="sm" className="h-6"><UserPlus className="w-3 h-3 mr-1"/> Añadir</Button>
                        </div>
                        {club.contacts && club.contacts.map((contact, idx) => (
                            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-700 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-zinc-200 text-sm">{contact.name}</span>
                                    {contact.isDecisionMaker && <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold">DECISOR</span>}
                                </div>
                                <div className="text-xs text-zinc-500 mb-2">{contact.role}</div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-xs text-zinc-400 gap-2"><Phone className="w-3 h-3"/> {contact.phone}</div>
                                        <a href={`https://wa.me/34${contact.phone}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:bg-[#25D366]/10 p-1 rounded transition-colors" title="Abrir WhatsApp">
                                            <MessageSquare className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <div className="flex items-center text-xs text-zinc-400 gap-2"><MessageSquare className="w-3 h-3"/> {contact.email}</div>
                                </div>
                            </div>
                        ))}
                      </div>

                      <div>
                          <Section title="Gestión Contractual" />
                          <button onClick={handleGenerateContract} className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-zinc-200 border border-zinc-700 p-3 rounded-lg transition-all group">
                              <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400 group-hover:scale-110 transition-transform"><FileSignature className="w-4 h-4" /></div>
                              <div className="text-left"><span className="block text-xs font-bold text-white">Generar Contrato & Derechos</span><span className="block text-[10px] text-zinc-500">Descargar PDF para firmar</span></div>
                              <ExternalLink className="w-3 h-3 ml-auto text-zinc-500"/>
                          </button>
                      </div>

                      <div>
                          <Section title="Planificación Sesión Fotos" />
                          <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg mt-2">
                              <div className="flex items-center gap-2 mb-3">
                                  <Camera className="w-4 h-4 text-emerald-500"/>
                                  <span className="text-xs font-bold text-white">Agendar "Día de la Foto"</span>
                              </div>
                              <input type="datetime-local" className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none" value={club.sessionDate || ""} onChange={handleSessionDateChange} />
                              {club.sessionDate && <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Sesión confirmada y añadida al calendario.</p>}
                          </div>
                      </div>

                      <div>
                          <Section title="Requisitos Técnicos (Assets)" />
                          <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg mt-2 space-y-2">
                              <AssetCheckbox label="Escudo Vectorial (.SVG/.AI)" checked={club.assets?.hasLogo} onChange={() => toggleAsset('hasLogo')} icon={<Upload className="w-3 h-3"/>} />
                              <AssetCheckbox label="Listado Jugadores (Excel)" checked={club.assets?.hasRoster} onChange={() => toggleAsset('hasRoster')} icon={<List className="w-3 h-3"/>} />
                              <AssetCheckbox label="Consentimientos Firmados" checked={club.assets?.contractSigned} onChange={() => toggleAsset('contractSigned')} icon={<FileSignature className="w-3 h-3"/>} />
                          </div>
                      </div>

                      <Section title="Ubicación">
                         <InfoRow label="Coordenadas" value={`${club.lat}, ${club.lng}`} icon={<Map className="w-4 h-4"/>} />
                      </Section>
                   </div>
                 ) : (
                   <div className="space-y-6">
                     <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg space-y-3">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Registrar Nueva Interacción</label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant={interactionType === 'call' ? 'neon' : 'outline'} size="sm" onClick={() => setInteractionType('call')}><Phone className="w-3 h-3 mr-1"/> Llamada</Button>
                            <Button variant={interactionType === 'email' ? 'neon' : 'outline'} size="sm" onClick={() => setInteractionType('email')}><MessageSquare className="w-3 h-3 mr-1"/> Email</Button>
                            <Button variant={interactionType === 'whatsapp' ? 'whatsapp' : 'outline'} size="sm" onClick={() => setInteractionType('whatsapp')}><Smartphone className="w-3 h-3 mr-1"/> WhatsApp</Button>
                        </div>
                        <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 resize-none" rows={2} placeholder={`Notas sobre el ${interactionType}...`} value={note} onChange={(e) => setNote(e.target.value)} />
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                             <div className="flex-1">
                                <label className="text-[10px] text-zinc-500 block mb-1">Agendar Seguimiento:</label>
                                <input type="date" className="bg-zinc-950 text-white text-xs border border-zinc-800 rounded px-2 py-1 w-full outline-none focus:border-emerald-500" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
                             </div>
                             <div className="flex items-end">
                                <Button variant="primary" size="sm" onClick={() => handleAddInteraction()} disabled={!note}><Send className="w-3 h-3 mr-1"/> Guardar</Button>
                             </div>
                        </div>
                     </div>
                     <div className="space-y-6 border-l border-zinc-800 ml-2">
                     {/* TIMELINE REAL PERSISTENTE */}
                     {interactions.map(event => (
                       <div key={event.id} className="relative pl-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className={cn("absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border", event.type === 'call' ? 'bg-blue-500/20 border-blue-500' : event.type === 'whatsapp' ? 'bg-[#25D366]/20 border-[#25D366]' : 'bg-zinc-800 border-zinc-600')}></div>
                          <div className="flex justify-between items-baseline mb-1">
                             <span className="text-sm font-bold text-zinc-200 capitalize flex items-center gap-1">
                                {event.type === 'whatsapp' && <Smartphone className="w-3 h-3 text-[#25D366]"/>}
                                {event.type === 'call' && <Phone className="w-3 h-3 text-blue-400"/>}
                                {event.type === 'email' && <MessageSquare className="w-3 h-3 text-zinc-400"/>}
                                {event.type === 'status' && <RefreshCw className="w-3 h-3 text-amber-400"/>}
                                {event.type}
                             </span>
                             <span className="text-[10px] text-zinc-500">{event.date}</span>
                          </div>
                          <p className="text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded border border-zinc-800/50">{event.note}</p>
                       </div>
                     ))}
                   </div>
                   </div>
                 )}
              </div>
              {showScripts && <ScriptsDrawer onClose={() => setShowScripts(false)} />}
           </div>
    );
}

function AssetCheckbox({ label, checked, onChange, icon }) {
    return (
        <div onClick={onChange} className={cn("flex items-center gap-3 p-2 rounded cursor-pointer border transition-all select-none", checked ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-950 border-zinc-800 hover:border-zinc-600")}>
            <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", checked ? "bg-emerald-500 border-emerald-500 text-black" : "bg-zinc-900 border-zinc-600")}>
                {checked && <CheckCircle2 className="w-3 h-3"/>}
            </div>
            <div className={cn("text-xs font-medium flex items-center gap-2", checked ? "text-emerald-400" : "text-zinc-400")}>{icon} {label}</div>
        </div>
    );
}

function NavItem({ icon, active, tooltip, onClick }) {
  return (
    <button onClick={onClick} title={tooltip} className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative", active ? "text-emerald-400 bg-emerald-400/10 border border-emerald-500/20" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900")}>
      {React.cloneElement(icon, { size: 20 })}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full" />}
    </button>
  );
}

function StatusBadge({ status }) {
  const configs = { 
      signed: { label: 'CLIENTE', variant: 'success' }, 
      negotiation: { label: 'NEGOCIANDO', variant: 'warning' }, 
      lead: { label: 'LEAD', variant: 'default' }, 
      rejected: { label: 'RECHAZADO', variant: 'danger' },
      renewal_pending: { label: 'RENOVAR', variant: 'renewal' }
  };
  const config = configs[status] || configs.lead;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function TabButton({ active, children, onClick }) {
  return <button onClick={onClick} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", active ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900")}>{children}</button>;
}

function InfoRow({ label, value, icon }) {
   return <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"><span className="text-zinc-500 text-sm flex items-center gap-2">{icon} {label}</span><span className="text-zinc-200 text-sm font-medium">{value}</span></div>;
}

function Section({ title, children }) {
   return <div><h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest">{title}</h4>{children}</div>;
}

/**
 * --- APP PRINCIPAL (CON LOGICA DE FIREBASE Y LOGIN) ---
 */
export default function SeasonManagerApp() {
  const [user, setUser] = useState(null);
  const [isLocked, setIsLocked] = useState(true); // Controla el Login
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [currentView, setCurrentView] = useState('map'); 
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Data State (Ahora vendrá de Firestore)
  const [seasons, setSeasons] = useState(INITIAL_SEASONS);
  const [selectedSeason, setSelectedSeason] = useState('2024-2025');
  const [clubs, setClubs] = useState([]); 
  const [tasks, setTasks] = useState([]);
  const [interactions, setInteractions] = useState([]);
  
  // UI State
  const [targetClients, setTargetClients] = useState(50);
  const [filterNeedsAttention, setFilterNeedsAttention] = useState(false);
  const [clearedNotifications, setClearedNotifications] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showRadius, setShowRadius] = useState(false);
  const [showRoute, setShowRoute] = useState(false); 
  const [activeTab, setActiveTab] = useState('details');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [routeStops, setRouteStops] = useState([]); 
  const [origin] = useState({ lat: 39.9864, lng: -0.0513, label: "Oficina" });

  // 1. Inicializar Auth de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setIsLocked(false);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Suscripciones a Firestore (Datos Reales)
  useEffect(() => {
    if (!user || isLocked) return;

    // Suscripción a Clubes
    const clubsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'clubs');
    const unsubClubs = onSnapshot(clubsRef, (snapshot) => {
        if (snapshot.empty && clubs.length === 0) {
            // Si está vacío, no hacemos nada, mostraremos un botón para poblar la BD
        } else {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClubs(data);
        }
    }, (err) => console.error("Error fetching clubs:", err));

    // Suscripción a Tareas
    const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(data);
    }, (err) => console.error("Error fetching tasks:", err));

    // Suscripción a Interacciones
    const intRef = collection(db, 'artifacts', appId, 'users', user.uid, 'interactions');
    const unsubInt = onSnapshot(intRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Ordenar por fecha descendente (simulado ya que no podemos usar orderBy)
        const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
        setInteractions(sorted);
    }, (err) => console.error("Error fetching interactions:", err));

    return () => { unsubClubs(); unsubTasks(); unsubInt(); };
  }, [user, isLocked]);

  // Función para llenar la base de datos vacía por primera vez
  const handleSeedDatabase = async () => {
      if(!user) return;
      try {
          const batch = writeBatch(db);
          // Seed Clubs
          SEED_CLUBS.forEach(c => {
             const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', c.id);
             batch.set(ref, c);
          });
          // Seed Tasks
          INITIAL_TASKS.forEach(t => {
             const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', t.id.toString());
             batch.set(ref, t);
          });
          // Seed Interactions
          INITIAL_TIMELINE.forEach(i => {
             const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', i.id.toString());
             batch.set(ref, { ...i, createdAt: Date.now() - (i.id * 1000) });
          });
          await batch.commit();
          alert("Base de datos inicializada con éxito.");
      } catch (e) {
          console.error(e);
      }
  };

  // Modificamos la función addTask existente
  const addTask = async (newTask) => {
      if(!user) return;
      
      // 1. Intentamos crear el evento en Google Calendar si tenemos el token
      let googleEventId = null;
      if (googleToken) {
         googleEventId = await createGoogleCalendarEvent(newTask, googleToken);
      }

      // 2. Guardamos en Firebase (ahora incluyendo el ID de Google si existe)
      const taskToSave = { ...newTask, googleEventId: googleEventId || null };
      const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', newTask.id.toString());
      await setDoc(ref, taskToSave);
  };
  // ---------------------------------------------

  const addInteraction = async (interaction) => {
      if(!user) return;
      const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'interactions', interaction.id.toString());
      await setDoc(ref, { ...interaction, createdAt: Date.now() });
  };

  const updateTaskPriority = async (taskId) => {
      if(!user) return;
      const task = tasks.find(t => t.id === taskId);
      if(task) {
          const newPriority = task.priority === 'high' ? 'medium' : 'high';
          const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId);
          await updateDoc(ref, { priority: newPriority });
      }
  };

  const handleUpdateClub = async (updatedClub) => {
      if(!user) return;
      const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', updatedClub.id);
      await setDoc(ref, updatedClub);
      if(selectedClub?.id === updatedClub.id) {
          setSelectedClub(updatedClub);
      }
  };

  // Guardamos el token en el estado cuando el usuario se conecta
  const [googleToken, setGoogleToken] = useState(null);

  // Función para crear el evento en la API de Google
  const createGoogleCalendarEvent = async (taskDetails, token) => {
    if (!token) {
        console.warn("No hay token de Google disponible. La tarea se guardará solo localmente.");
        return;
    }

    // Preparamos las fechas. Asumimos que la tarea dura 1 hora por defecto.
    const startDateTime = new Date(`${taskDetails.due}T${taskDetails.time}:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

    const event = {
      summary: taskDetails.task,
      description: `Generado desde CRM FotoEsport.\nClub ID: ${taskDetails.clubId}`,
      start: { dateTime: startDateTime, timeZone: 'Europe/Madrid' },
      end: { dateTime: endDateTime, timeZone: 'Europe/Madrid' },
      colorId: taskDetails.priority === 'high' ? '11' : '9', // 11=Rojo (Alta), 9=Azul oscuro
    };

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) throw new Error("Error creando evento en Google");
      const data = await response.json();
      console.log("Evento creado en Google Calendar:", data.htmlLink);
      return data.id; // Retornamos el ID de google por si luego queremos borrarlo
    } catch (error) {
      console.error("Error en createGoogleCalendarEvent:", error);
    }
  };



  const handleCreateManualTask = async (newTask) => {
      await addTask(newTask);
      setShowTaskModal(false);
  };

  const handleSeasonRollover = async (nextSeasonName) => {
      if(!user) return;
      exportToCSV(clubs, selectedSeason);
      
      const batch = writeBatch(db);
      clubs.forEach(club => {
          let newStatus = 'lead';
          if (club.status === 'signed') newStatus = 'renewal_pending';
          if (club.status === 'negotiation') newStatus = 'lead';
          
          const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'clubs', club.id);
          batch.update(ref, {
              status: newStatus,
              lastInteraction: 'Reset',
              nextContact: null,
              assets: { hasLogo: false, hasRoster: false, contractSigned: false },
              sessionDate: null
          });
      });
      await batch.commit();
      
      setSeasons([...seasons, nextSeasonName]);
      setSelectedSeason(nextSeasonName);
      setShowSettings(false);
      setTimeout(() => alert(`¡Temporada ${nextSeasonName} iniciada! Base de datos actualizada.`), 500);
  };

  // Derived State
  const notifications = useMemo(() => {
      if (clearedNotifications) return [];
      const alerts = [];
      const staleClubs = clubs.filter(c => c.lastInteraction === "Never" || c.lastInteraction === "30d");
      if (staleClubs.length > 0) alerts.push({ type: 'alert', title: 'Leads en Enfriamiento', message: `Hay ${staleClubs.length} clubes sin contacto reciente.` });
      const highPriorityTasks = tasks.filter(t => t.priority === 'high');
      if (highPriorityTasks.length > 0) alerts.push({ type: 'info', title: 'Agenda Prioritaria', message: `Tienes ${highPriorityTasks.length} tareas de Alta Prioridad hoy.` });
      return alerts;
  }, [clubs, tasks, clearedNotifications]);

  const filteredClubs = useMemo(() => {
      if (!filterNeedsAttention) return clubs;
      return clubs.filter(c => c.lastInteraction === "Never" || c.lastInteraction === "30d");
  }, [clubs, filterNeedsAttention]);

  const stats = useMemo(() => ({
    total: clubs.length,
    signed: clubs.filter(c => c.status === 'signed').length,
    negotiation: clubs.filter(c => c.status === 'negotiation').length,
  }), [clubs]);

  // Pantallas de Bloqueo / Carga
  if (isLoadingAuth) {
      return <div className="flex h-screen w-full bg-zinc-950 items-center justify-center text-emerald-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  
  if (isLocked) {
      return <LoginScreen onLogin={() => setIsLocked(false)} />;
  }

  const renderMainContent = () => {
    // Si la BD está vacía (primer uso), mostrar botón para poblarla
    if (clubs.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Target className="w-16 h-16 text-zinc-700 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">CRM Inicializado</h2>
                <p className="text-zinc-400 mb-6 max-w-md">Tu base de datos está conectada de forma segura a Firebase pero actualmente no hay clubes registrados.</p>
                <Button variant="neon" onClick={handleSeedDatabase}>Cargar Datos de Prueba</Button>
            </div>
        );
    }

    switch (currentView) {
      case 'map': return <TacticalMap clubs={filteredClubs} selectedId={selectedClub?.id} onSelect={setSelectedClub} showRadius={showRadius} setShowRadius={setShowRadius} showRoute={showRoute} setShowRoute={setShowRoute} tasks={tasks} origin={origin} routeStops={routeStops} setRouteStops={setRouteStops} onOptimizeRoute={() => { if(routeStops.length>1){ const sorted = [...routeStops].sort((a, b) => parseInt(a.openTime.replace(':','')) - parseInt(b.openTime.replace(':',''))); setRouteStops(sorted); alert("Ruta optimizada"); } }} />;
      case 'db': return <DatabaseView clubs={filteredClubs} onSelect={setSelectedClub} />;
      case 'calendar': return <CalendarView tasks={tasks} onUpdateTaskPriority={updateTaskPriority} onOpenNewTask={() => setShowTaskModal(true)} />;
      case 'targets': return <TargetsView stats={stats} targetClients={targetClients} />;
      default: return <TacticalMap />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
      <aside className="w-16 h-full border-r border-zinc-800 flex flex-col items-center py-6 gap-6 z-50 bg-zinc-950 shadow-2xl">
        <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer" onClick={() => setCurrentView('map')}>F</div>
        <nav className="flex flex-col gap-3 w-full px-2">
          <NavItem icon={<Map />} active={currentView === 'map'} onClick={() => setCurrentView('map')} tooltip="Mapa" />
          <NavItem icon={<List />} active={currentView === 'db'} onClick={() => setCurrentView('db')} tooltip="Base de Datos" />
          <NavItem icon={<CalendarIcon />} active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} tooltip="Agenda" />
          <NavItem icon={<Target />} active={currentView === 'targets'} onClick={() => setCurrentView('targets')} tooltip="Objetivos" />
        </nav>
        <div className="mt-auto flex flex-col gap-4 mb-4">
           <NavItem icon={<Settings />} onClick={() => setShowSettings(true)} active={showSettings} />
           <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">JD</div>
        </div>
      </aside>

      <main className="flex-1 relative bg-zinc-900 flex flex-col">
        <header className="h-16 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-between px-6 z-40">
           <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold text-white uppercase tracking-wide">
                {currentView === 'map' && 'Mapa Táctico'}
                {currentView === 'db' && 'Directorio'}
                {currentView === 'calendar' && 'Planificación'}
                {currentView === 'targets' && 'Cuadro de Mando'}
             </h1>
             <div className="h-4 w-[1px] bg-zinc-800"></div>
             <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1 pr-3">
                <span className="bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-400 uppercase font-bold tracking-wider">TEMP</span>
                <select className="bg-transparent text-sm font-semibold outline-none text-white cursor-pointer" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <button onClick={() => setFilterNeedsAttention(!filterNeedsAttention)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all", filterNeedsAttention ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300")}>
                <AlertTriangle className="w-3 h-3" />{filterNeedsAttention ? "Viendo Prioritarios" : "Filtrar Alertas"}
             </button>
           </div>
           
           <div className="flex items-center gap-4">
                {(currentView === 'map' || currentView === 'db') && (
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input type="text" placeholder="Buscar Club..." className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-600 w-64 transition-all" />
                    </div>
                )}
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                    <Bell className="w-4 h-4" />{notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>}
                </button>
           </div>
        </header>

        {renderMainContent()}
        {showNotifications && <NotificationCenter notifications={notifications} onClose={() => setShowNotifications(false)} onClearAll={() => setClearedNotifications(true)} />}
      </main>

      <aside className={cn("bg-zinc-950 border-l border-zinc-800 flex flex-col z-50 transition-all duration-300 shadow-xl overflow-hidden relative", (currentView === 'map' || currentView === 'db') && selectedClub ? "w-[400px]" : "w-0 border-l-0")}>
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

      {showSettings && (
        <SettingsModal 
            onClose={() => setShowSettings(false)} 
            targetClients={targetClients} 
            setTargetClients={setTargetClients} 
            onRollover={handleSeasonRollover} 
            seasons={seasons} 
            currentSeason={selectedSeason} 
            setGoogleToken={setGoogleToken} // <-- Añade esta línea
        />
      )}
      {showTaskModal && <NewTaskModal onClose={() => setShowTaskModal(false)} onSave={handleCreateManualTask} />}
    </div>
  );
}