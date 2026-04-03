// src/utils/constants.js
export const SALES_SCRIPTS = {
    cold_call: { title: "Llamada en Frío (Apertura)", text: "Hola [Nombre], soy [TuNombre] de FotoEsport. Trabajamos con clubes como el Villarreal o el Castellón..." },
    closing_contract: { title: "Cierre: Envío de Contrato", text: "Genial. Para formalizarlo y poder agendar el día de la sesión, te envío ahora mismo el contrato..." },
    objection_rights: { title: "Objeción: 'Derechos de Imagen'", text: "Es un trámite estándar. Nosotros nos encargamos de la custodia de las imágenes..." },
    whatsapp_intro: { title: "WhatsApp: Primer Contacto", text: "Hola [Nombre] 👋, soy [TuNombre] de FotoEsport. Te escribo rápido..." }
};

export const SEED_CLUBS = [
  { id: '1', name: "C.D. Castellón Base", status: "signed", lat: 50, lng: 50, category: "Fútbol", lastInteraction: "2d", assets: { hasLogo: true, hasRoster: true, contractSigned: true }, sessionDate: "2025-11-15T16:00", contacts: [{ name: "Carlos", role: "Coordinador", phone: "600000000", email: "carlos@cdcastellon.com", isDecisionMaker: true }] },
  { id: '2', name: "Atlético Vivero", status: "lead", lat: 45, lng: 55, category: "Fútbol", lastInteraction: "Never", assets: { hasLogo: false, hasRoster: false, contractSigned: false }, contacts: [{ name: "Roberto", role: "Presidente", phone: "611111111", email: "presi@atleticovivero.com", isDecisionMaker: true }] }
];

export const INITIAL_SEASONS = ['2024-2025'];

export const INITIAL_TASKS = [
  { id: 1, clubId: '1', task: 'Confirmar hora de la sesión fotográfica', priority: 'high', due: '2025-10-22', time: '10:00' },
  { id: 2, clubId: '2', task: 'Enviar propuesta de merchandising', priority: 'medium', due: '2025-10-24', time: '12:00' }
];

export const INITIAL_TIMELINE = [
  { id: 1, clubId: '1', type: 'call', user: 'Tú', note: 'Llamada inicial de presentación', date: '01/10/2025' }
];