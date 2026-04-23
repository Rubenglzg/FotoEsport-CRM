// src/utils/helpers.js
export const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- NUEVA FUNCIÓN PARA FORMATEAR FECHAS A DD-MM-YYYY ---
export const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string') {
        // Si viene del input tipo "date" o de la IA (YYYY-MM-DD)
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${day}-${month}-${year}`;
        }
        // Si viene del sistema español por defecto (DD/MM/YYYY)
        if (dateString.includes('/')) {
            return dateString.replace(/\//g, '-');
        }
    }
    // Fallback de seguridad
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    } catch {
        return dateString;
    }
};
// ---------------------------------------------------------

export const generateContractFile = (club, startSeason, duration = 1) => {
    // Si viene solo el string por algún error, lo manejamos, sino tomamos el nombre del objeto
    const clubName = typeof club === 'string' ? club : (club?.name || 'Club no especificado');
    
    // --- NUEVO: CAPTURAR EL PORCENTAJE DE BENEFICIO ---
    // Si el club tiene un % asignado lo muestra (ej: "15%"), si no, deja un espacio en blanco para rellenar a mano
    const profitPercentage = club?.profitPercentage ? `${club.profitPercentage}%` : '_____%';
    
    const printWindow = window.open('', '_blank');

    // Cálculo del rango de temporadas según la duración elegida en el selector
    let seasonDisplay = startSeason;
    if (duration > 1) {
        const parts = startSeason.split('/');
        if (parts.length === 2) {
            const startYear = parseInt(parts[0]);
            const endYear = startYear + (duration - 1);
            seasonDisplay = `${startSeason} a ${endYear}/${endYear + 1}`;
        } else {
            seasonDisplay = `${startSeason} (${duration} temporadas)`;
        }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato ${clubName}</title>
        <style>
          /* ELIMINAMOS EL MARGEN DE LA PÁGINA PARA BORRAR CABECERAS DEL NAVEGADOR */
          @page { 
            size: A4; 
            margin: 0mm; 
          }
          
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            /* Aumentado el interlineado de 1.3 a 1.45 para que el texto respire más */
            line-height: 1.45; 
            color: #111; 
            max-width: 100%; margin: 0 auto; padding: 0; 
            background: white; font-size: 9.5pt; 
          }
          
          /* Aumentados los márgenes inferiores para separar más los bloques */
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #059669; padding-bottom: 15px; }
          .logo { font-size: 22px; font-weight: 900; color: #111; letter-spacing: 1px; margin-bottom: 5px; }
          .logo span { color: #059669; }
          .title { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-top: 5px; color: #333; }
          .subtitle { font-size: 11px; color: #666; margin-top: 3px; }
          
          /* Más separación bajo las cajas de Proveedor/Club */
          .details-box { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 25px; font-size: 9pt; }
          .details-box div { width: 48%; background: #fafafa; padding: 12px; border-radius: 8px; border: 1px solid #eaeaea; }
          .details-box h3 { margin-top: 0; font-size: 10pt; color: #059669; margin-bottom: 8px; border-bottom: 1px solid #eaeaea; padding-bottom: 4px; text-transform: uppercase;}
          
          /* Más separación entre cada cláusula (de 10px a 16px) */
          .clause { margin-bottom: 16px; text-align: justify; font-size: 9.5pt; }
          .clause-title { font-weight: bold; font-size: 10pt; color: #111; display: inline-block; margin-right: 5px; }
          
          /* Más espacio antes de la zona de firmas (de 25px a 40px) */
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
          .signature-box { 
            width: 45%; 
            border: 1px solid #111; 
            height: 85px; 
            position: relative;
            background: #fff;
          }
          .signature-box strong {
            position: absolute;
            top: -20px;
            left: 0;
            font-size: 9pt;
            text-transform: uppercase;
          }
          .signature-placeholder {
            position: absolute;
            bottom: 5px;
            width: 100%;
            text-align: center;
            color: #ccc;
            font-size: 8pt;
            font-style: italic;
          }
          
          /* CONTROLES MÓVILES PARA CERRAR/VOLVER */
          .mobile-controls { display: none; }
          @media screen {
            body { background: #f4f4f5; padding: 20px; }
            .document-container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
            .mobile-controls { display: flex; justify-content: center; gap: 15px; margin-bottom: 20px; }
            .btn { padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; font-size: 14px; }
            .btn-print { background: #059669; color: white; }
            .btn-close { background: #ef4444; color: white; }
          }
          @media print {
            /* Mantenemos un margen interno amplio para la impresión */
            body { background: white; padding: 1.5cm; margin: 0; }
            .document-container { padding: 0; box-shadow: none; max-width: 100%; }
            .mobile-controls { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="mobile-controls">
          <button class="btn btn-close" onclick="window.close()">Volver al CRM</button>
          <button class="btn btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
        </div>
        
        <div class="document-container">
            <div class="header">
              <div class="logo">FOTOESPORT <span>MERCH</span></div>
              <div class="title">Contrato de Colaboración y Cesión de Derechos</div>
              <div class="subtitle">Vigencia: ${seasonDisplay}</div>
            </div>
            
            <p style="text-align: right; margin-bottom: 25px; font-size: 9.5pt;">
              En ___________________________________, a _____ de ____________________ de 20___
            </p>
            
            <div class="details-box">
              <div>
                <h3>El Proveedor</h3>
                <strong>Juliogmilat Fotografía</strong><br>
                Servicio de merchandising deportivo personalizado.<br>
                <em>Representante Comercial</em>
              </div>
              <div>
                <h3>El Club</h3>
                <strong>${clubName.toUpperCase()}</strong><br>
                ${club.address ? `📍 ${club.address}<br>` : ''}
                ${club.genericPhone ? `📞 ${club.genericPhone}<br>` : ''}
                ${club.genericEmail ? `✉️ ${club.genericEmail}<br>` : ''}
              </div>
            </div>

            <p style="margin-bottom: 20px; font-size: 9.5pt;">Ambas partes se reconocen mutuamente la capacidad legal necesaria para la firma del presente contrato y acuerdan las siguientes cláusulas:</p>

            <div class="clause">
              <span class="clause-title">I. OBJETO DEL ACUERDO.</span>
              El presente contrato regula la colaboración para la realización de la sesión fotográfica oficial para el periodo ${seasonDisplay} y la posterior gestión, producción y venta bajo demanda de productos de merchandising personalizado (tazas, gorras, botellas, llaveros, fotos individuales y de equipo, cromos, calendarios de pared y zapatilleros) por parte de FOTOESPORT MERCH.
            </div>
            
            <div class="clause">
              <span class="clause-title">II. CESIÓN DE DERECHOS DE IMAGEN.</span>
              El Club garantiza poseer las autorizaciones pertinentes de los jugadores (o sus tutores legales en caso de menores) y <strong>CEDE AL PROVEEDOR</strong> el derecho no exclusivo a utilizar y explotar comercialmente dichas imágenes. Esta cesión se limita <strong>EXCLUSIVAMENTE</strong> a la elaboración y venta de los productos de merchandising objeto de este acuerdo durante la vigencia del mismo.
            </div>
            
            <div class="clause">
              <span class="clause-title">III. PROTECCIÓN DE DATOS (RGPD).</span>
              El Proveedor tratará las imágenes y datos proporcionados conforme al Reglamento General de Protección de Datos (RGPD) actuando como Encargado del Tratamiento, garantizando que no se utilizarán para fines distintos a los estipulados sin el consentimiento expreso de los interesados.
            </div>
            
            <div class="clause">
              <span class="clause-title">IV. VIGENCIA.</span>
              Este contrato tendrá validez durante el periodo: ${seasonDisplay}, finalizando sus efectos a la conclusión del mismo, salvo renovación o firma de acuerdo multianual expresa por ambas partes.
            </div>

            <div class="clause">
              <span class="clause-title">V. CONDICIONES DE ENTREGA.</span>
              FOTOESPORT MERCH garantiza la entrega directa de los dos primeros pedidos. Para las siguientes entregas, será necesario que el importe del pedido supere los 500€. En caso de no alcanzar dicho importe, el Club deberá recoger el pedido en nuestro estudio situado en Carrer de Miguel Galan Mestre, n° 8, Bajo Izq, Benicalap, 46025 València.
            </div>

            <div class="clause">
              <span class="clause-title">VI. ENTREGA DE FOTOGRAFÍAS.</span>
              FOTOESPORT MERCH se compromete a entregar al Club las fotografías editadas de manera gratuita. Estas imágenes incluirán obligatoriamente una marca de agua en la parte inferior.
            </div>

            <div class="clause">
              <span class="clause-title">VII. BENEFICIOS PARA EL CLUB.</span>
              El Club percibirá un beneficio del <strong>${profitPercentage}</strong> de las ganancias derivadas de los pedidos, el cual quedará establecido y será liquidado según el acuerdo comercial previamente pactado entre ambas partes.
            </div>

            <div class="signatures">
              <div class="signature-box">
                <strong>POR FOTOESPORT MERCH</strong>
                <div class="signature-placeholder">Sello y Firma</div>
              </div>
              <div class="signature-box">
                <strong>POR ${clubName.toUpperCase()}</strong>
                <div class="signature-placeholder">Firma del Presidente / Responsable</div>
              </div>
            </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { 
              window.print(); 
            }, 1000);
          };
          window.onafterprint = function() {
            window.close();
          };
        </script>
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
    const headers = ["ID", "Club", "Categoría", "Estado", "Última Interacción", "Contacto Principal", "Rol", "Teléfono", "Email", "Fecha de Sesión", "Contrato Firmado"];
    
    const rows = clubs.map(club => {
        const mainContact = club.contacts?.find(c => c.isDecisionMaker) || club.contacts?.[0] || {};
        return [
            club.id, 
            `"${club.name || ''}"`, 
            `"${club.category || ''}"`, 
            `"${club.status || ''}"`, 
            `"${formatDateToDDMMYYYY(club.lastInteraction) || ''}"`, 
            `"${mainContact?.name || ''}"`,
            `"${mainContact?.role || ''}"`,
            `"${mainContact?.phone || ''}"`,
            `"${mainContact?.email || ''}"`,
            `"${club.sessionDate || 'Pendiente'}"`,
            club.assets?.contractSigned ? "SÍ" : "NO"
        ];
    });

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    
    const data = await response.json();

    // 1. Si Google devuelve un error HTTP (ej. 400, 403, 404)
    if (!response.ok) {
        console.error(">>> ERROR DETALLADO DE GEMINI:", data);
        alert(`Error de Google: ${data.error?.message || 'Error desconocido'}`);
        return text; // Devolvemos el texto original para no perderlo
    }

    // 2. Si la respuesta es exitosa
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
    } else {
        console.error(">>> RESPUESTA INESPERADA:", data);
        alert("Gemini respondió, pero el formato no es el esperado.");
        return text;
    }

  } catch (error) {
    console.error(">>> ERROR DE RED CON GEMINI:", error);
    alert("Hubo un error de red al conectar con la IA.");
    throw error;
  }
};

export const predictDateWithAI = async (historyText) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta la API Key de Gemini");

  const prompt = `
  Eres un experto en ventas. Analiza este historial y devuelve SOLAMENTE una fecha en formato YYYY-MM-DD para el próximo contacto.
  Fecha de hoy: ${new Date().toISOString().split('T')[0]}
  Historial: ${historyText}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Respuesta de error de Google:", errorData);
        return null;
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
        const responseText = data.candidates[0].content.parts[0].text.trim();
        const dateMatch = responseText.match(/\d{4}-\d{2}-\d{2}/);
        return dateMatch ? dateMatch[0] : null;
    }
    
    return null;
    
  } catch (error) {
    console.error("Error técnico en predictDateWithAI:", error);
    return null;
  }
};