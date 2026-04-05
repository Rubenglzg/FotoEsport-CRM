const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// 1. Definimos las credenciales
const CLIENT_ID = "625949033296-4411im6ignisp9qo0mqp2orbovgnua2p.apps.googleusercontent.com";
const clientSecret = defineSecret("CLIENT_SECRET");
// Definimos el secreto para Gemini
const geminiApiKey = defineSecret("GEMINI_API_KEY"); 
const REDIRECT_URI = "postmessage";

// --- FUNCIÓN ANTERIOR (Calendario) ---
exports.conectarCalendario = onRequest({ secrets: [clientSecret] }, (req, res) => {
    cors(req, res, async () => {
        try {
            const { code, userId } = req.body;
            if (!code || !userId) return res.status(400).send("Faltan datos");

            const secretValue = clientSecret.value();
            const oauth2Client = new google.auth.OAuth2(CLIENT_ID, secretValue, REDIRECT_URI);
            const { tokens } = await oauth2Client.getToken(code);

            if (tokens.refresh_token) {
                await admin.firestore()
                    .collection("artifacts").doc("fotoesport-crm")
                    .collection("users").doc(userId)
                    .set({ calendarRefreshToken: tokens.refresh_token }, { merge: true });
            }

            res.status(200).json({ accessToken: tokens.access_token });
        } catch (error) {
            console.error("Error en servidor:", error);
            res.status(500).send("Error al conectar con Google");
        }
    });
});

// --- NUEVA FUNCIÓN (Atajo de iOS) ---
exports.recibirLlamadaiOS = onRequest({ secrets: [geminiApiKey] }, (req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') return res.status(405).send('Solo POST');

            const { clubName, text, token } = req.body;
            
            if (token !== "FOTOESPORT_SECRETO") return res.status(401).send("No autorizado");
            if (!clubName || !text) return res.status(400).send("Faltan datos");

            const db = admin.firestore();
            
            // MAGIA AQUÍ: collectionGroup busca la carpeta 'clubs' sin importar en qué usuario esté
            const clubsSnapshot = await db.collectionGroup("clubs").get(); 
            
            let targetClubRef = null;
            let targetClubName = "";
            
            const normalizarTexto = (texto) => {
                if (!texto) return "";
                return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            };

            const inputLimpiado = normalizarTexto(clubName);

            clubsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.name) {
                    const nombreBDLimpiado = normalizarTexto(data.name);
                    
                    if (nombreBDLimpiado.includes(inputLimpiado)) {
                        targetClubRef = doc.ref; // Guardamos la RUTA EXACTA de este club
                        targetClubName = data.name;
                    }
                }
            });

            if (!targetClubRef) {
                return res.status(404).send(`No se encontró el club "${clubName}". Revisa el texto.`);
            }

            // Pedirle a Gemini que resuma el texto
            const prompt = `Actúa como un asistente CRM. Resume la siguiente transcripción de llamada en un formato estructurado y muy corto. Usa viñetas para: Estado actual, Acuerdos, y Siguientes pasos: "${text}"`;
            
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.value()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const geminiData = await geminiRes.json();

            // --- NUEVO ESCUDO DE DEPURACIÓN ---
            if (!geminiData.candidates) {
                console.error(">>> ERROR DESDE GEMINI:", JSON.stringify(geminiData, null, 2));
                return res.status(500).send("La IA de Gemini ha fallado. Mira los logs.");
            }
            // ----------------------------------

            const summary = geminiData.candidates[0].content.parts[0].text;

            // Guardar en Firebase dentro del historial del club usando la referencia exacta
            const interactionId = Date.now().toString();
            await targetClubRef.collection("interactions").doc(interactionId).set({
                id: interactionId,
                clubId: targetClubRef.id,
                type: "call",
                user: "Tú (iPhone)",
                note: summary,
                date: new Date().toLocaleDateString('es-ES')
            });

            res.status(200).json({ success: true, message: `Llamada guardada en ${targetClubName}` });

        } catch (error) {
            console.error(">>> ERROR GRAVE:", error);
            res.status(500).send("Error interno del servidor");
        }
    });
});