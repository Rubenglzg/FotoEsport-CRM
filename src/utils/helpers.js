// src/utils/helpers.js
export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const generateContractFile = (clubName, season) => {
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
          El Club garantiza poseer las autorizaciones de los jugadores (o tutores legales) y <strong>CEDE AL PROVEEDOR</strong> el derecho no exclusivo a utilizar y explotar comercialmente dichas imágenes. Esta cesión se limita <strong>EXCLUSIVAMENTE</strong> a la elaboración y venta de los productos de merchandising objeto de este acuerdo.
        </div>
        <div class="clause">
          <span class="clause-title">III. PROTECCIÓN DE DATOS.</span>
          El Proveedor tratará las imágenes conforme al RGPD, actuando como Encargado del Tratamiento.
        </div>
        <div class="signatures">
          <div class="signature-box">
            <strong>POR FOTOESPORT MERCH</strong><br/><span style="font-size: 7pt; color: #666;">(Firma y Sello)</span><br/><br/><br/>Fdo: Dirección Comercial
          </div>
          <div class="signature-box">
            <strong>POR ${clubName.toUpperCase()}</strong><br/><span style="font-size: 7pt; color: #666;">(Firma y Sello)</span><br/><br/><br/>Fdo: El Presidente / Responsable
          </div>
        </div>
        <div class="footer">Documento generado digitalmente por Grupo Avantia (Sooner) - Válido a efectos administrativos.</div>
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

export const exportToCSV = (clubs, seasonName) => {
    // 1. Añadimos columnas más útiles para que la migración tenga toda la info de contacto
    const headers = ["ID", "Club", "Categoría", "Estado", "Última Interacción", "Contacto Principal", "Rol", "Teléfono", "Email", "Fecha de Sesión", "Contrato Firmado"];
    
    const rows = clubs.map(club => {
        const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || {};
        return [
            club.id, 
            `"${club.name || ''}"`, 
            `"${club.category || ''}"`, 
            `"${club.status || ''}"`, 
            `"${club.lastInteraction || ''}"`, 
            `"${mainContact?.name || ''}"`,
            `"${mainContact?.role || ''}"`,
            `"${mainContact?.phone || ''}"`,
            `"${mainContact?.email || ''}"`,
            `"${club.sessionDate || 'Pendiente'}"`,
            club.assets?.contractSigned ? "SÍ" : "NO"
        ];
    });

    // 2. MAGIA PARA EXCEL: Añadimos "\uFEFF" al principio. Esto se llama BOM (Byte Order Mark) y evita que se rompan las tildes/ñ en Excel.
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FotoEsport_Export_${seasonName.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const summarizeWithAI = async (text) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta la API Key de Gemini");

  const prompt = `Actúa como un asistente de ventas CRM profesional. 
  Toma la siguiente interacción (que puede ser un dictado de voz desordenado o un pegado de WhatsApp) y resúmela en un formato claro, profesional y estructurado en español. 
  Usa viñetas para: Estado actual, Acuerdos, y Siguientes pasos. Sé muy conciso.
  
  Texto original: "${text}"`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error conectando con Gemini:", error);
    throw error;
  }
};

export const predictDateWithAI = async (historyText) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta la API Key de Gemini");

  const prompt = `
  Eres un asistente de ventas experto en un CRM de fotografía deportiva.
  Analiza el siguiente historial de interacciones con un club deportivo y decide en qué fecha exacta se debería volver a contactar con ellos para hacer seguimiento.
  
  Reglas estrictas:
  - Si en la conversación dicen "hablamos en septiembre", calcula una fecha a principios de septiembre.
  - Si dicen "están de vacaciones", dales 3 o 4 semanas.
  - Si la conversación fue positiva pero sin cierre, dales 7-10 días.
  - Fecha de HOY: ${new Date().toISOString().split('T')[0]}
  
  Historial del club:
  ${historyText}
  
  IMPORTANTE: Tu respuesta debe ser ÚNICAMENTE la fecha en formato YYYY-MM-DD. No escribas nada más. Solo la fecha (ejemplo: 2024-05-20).
  `;

  try {
    // CORRECCIÓN: URL ajustada v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });
    
    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Error detallado de API:", errorBody);
        return null;
    }

    const data = await response.json();
    
    // Verificamos que la estructura de respuesta existe antes de leerla
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
        const responseText = data.candidates[0].content.parts[0].text.trim();
        
        // Extraer solo la fecha con Regex por si la IA añade texto extra por error
        const match = responseText.match(/\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : null;
    }
    
    return null;
    
  } catch (error) {
    console.error("Error en la llamada a Gemini (Predicción):", error);
    return null;
  }
};