// src/utils/constants.js

export const DEFAULT_STATUSES = [
    { id: 'to_contact', label: 'POR CONTACTAR', color: '#64748b' }, 
    { id: 'contacted_no_reply', label: 'SIN RESPUESTA', color: '#f59e0b' }, 
    { id: 'prospect', label: 'POS. CLIENTE', color: '#06b6d4' }, 
    { id: 'lead', label: 'LEAD', color: '#3b82f6' }, 
    { id: 'client', label: 'CLIENTE', color: '#10b981' }, 
    { id: 'not_interested', label: 'NO INTERESA', color: '#ef4444' } 
];

export const SALES_SCRIPTS = {
    cold_call: { title: "Llamada en Frío (Apertura)", text: "Hola [Nombre], soy [TuNombre] de FotoEsport. Trabajamos con clubes como el Villarreal o el Castellón..." },
    closing_contract: { title: "Cierre: Envío de Contrato", text: "Genial. Para formalizarlo y poder agendar el día de la sesión, te envío ahora mismo el contrato..." },
    objection_rights: { title: "Objeción: 'Derechos de Imagen'", text: "Es un trámite estándar. Nosotros nos encargamos de la custodia de las imágenes..." },
    whatsapp_intro: { title: "WhatsApp: Primer Contacto", text: "Hola [Nombre] 👋, soy [TuNombre] de FotoEsport. Te escribo rápido..." }
};


// Dejamos los datos de prueba vacíos para que no interfieran con la IA ni el CRM
export const SEED_CLUBS = [];
export const INITIAL_TASKS = [];
export const INITIAL_TIMELINE = [];

export const DEFAULT_SPORTS = [
    'Fútbol', 'Baloncesto', 'Fútbol Sala', 'Balonmano', 'Voleibol', 'Pádel', 'Tenis', 'Rugby', 'Otro'
];