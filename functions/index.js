const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const cors = require("cors")({ origin: true });

const Busboy = require("busboy");
const os = require("os");
const path = require("path");
const fs = require("fs");

admin.initializeApp();

// 1. Definimos las credenciales
const { defineString } = require("firebase-functions/params");
const CLIENT_ID = defineString("CLIENT_ID");
const clientSecret = defineSecret("CLIENT_SECRET");
// Definimos el secreto para Gemini
const geminiApiKey = defineSecret("GEMINI_API_KEY"); 
const webhookToken = defineSecret("WEBHOOK_TOKEN");
const REDIRECT_URI = "postmessage";

// --- FUNCIÓN ANTERIOR (Calendario) ---
exports.conectarCalendario = onRequest({ secrets: [clientSecret] }, (req, res) => {
    cors(req, res, async () => {
        try {
            const { code, userId } = req.body;
            if (!code || !userId) return res.status(400).send("Faltan datos");

            const secretValue = clientSecret.value();
            const oauth2Client = new google.auth.OAuth2(CLIENT_ID.value(), secretValue, REDIRECT_URI);
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

// --- NUEVA FUNCIÓN SEGURA ---
exports.recibirLlamadaiOS = onRequest({ secrets: [geminiApiKey, webhookToken] }, (req, res) => {
    cors(req, res, () => {
        if (req.method !== 'POST') return res.status(405).send('Solo POST');

        const busboy = Busboy({ headers: req.headers });
        let clubName = "";
        let token = "";
        let tipoInteraccion = "call"; 
        let userId = ""; // <-- NUEVO: Identificador del usuario
        let audioBuffer = null;
        let mimeType = "audio/m4a"; 

        busboy.on("field", (fieldname, val) => {
            if (fieldname === "club") clubName = val;
            if (fieldname === "token") token = val;
            if (fieldname === "tipo") tipoInteraccion = val; 
            if (fieldname === "userId") userId = val; // <-- Recibimos tu ID
        });

        busboy.on("file", (fieldname, file, info) => {
            if (fieldname === "audio") {
                mimeType = info.mimeType || mimeType;
                const chunks = [];
                file.on("data", (data) => chunks.push(data));
                file.on("end", () => {
                    audioBuffer = Buffer.concat(chunks);
                });
            }
        });

        busboy.on("finish", async () => {
            try {
                // 1. VERIFICACIÓN DEL TOKEN SECRETO
                if (token !== webhookToken.value()) {
                    console.warn("Intento de acceso denegado por token inválido.");
                    return res.status(401).send("No autorizado");
                }
                
                if (!userId || !clubName || !audioBuffer) {
                    return res.status(400).send("Faltan datos (userId, club, o audio)");
                }

                const db = admin.firestore();
                
                // 2. BÚSQUEDA AISLADA (Solo en los clubes de ESTE usuario)
                const userClubsRef = db.collection("artifacts").doc("fotoesport-crm").collection("users").doc(userId).collection("clubs");
                const clubsSnapshot = await userClubsRef.get(); 
                
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
                            targetClubRef = doc.ref;
                            targetClubName = data.name;
                        }
                    }
                });

                if (!targetClubRef) {
                    return res.status(404).send(`No se encontró el club "${clubName}". Revisa el texto.`);
                }

                // 3. ENVÍO DEL AUDIO A GEMINI
                const base64Audio = audioBuffer.toString("base64");
                const tipoTexto = tipoInteraccion === 'whatsapp' ? 'conversación de WhatsApp' : 'llamada telefónica';
                const prompt = `Actúa como un asistente CRM. Escucha el audio adjunto que resume una ${tipoTexto} y escribe un resumen. 
                ES OBLIGATORIO usar exactamente esta estructura con saltos de línea claros:
                
                ESTADO ACTUAL:
                - (Escribe aquí el estado de forma concisa)
                
                ACUERDOS:
                - (Escribe los acuerdos aquí)
                
                SIGUIENTES PASOS:
                - (Escribe los próximos pasos)
                
                No uses asteriscos dobles ni negritas de Markdown.`;
                
                const payload = {
                    contents: [{ parts: [ { text: prompt }, { inlineData: { mimeType: mimeType, data: base64Audio } } ] }]
                };

                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.value()}`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
                });
                
                const geminiData = await geminiRes.json();
                if (!geminiData.candidates) return res.status(500).send("Fallo en Gemini");
                const summary = geminiData.candidates[0].content.parts[0].text;

                // 4. GUARDADO EN FIREBASE
                const interactionId = Date.now().toString();
                await userClubsRef.parent.collection("interactions").doc(interactionId).set({
                    id: interactionId,
                    clubId: targetClubRef.id,
                    type: tipoInteraccion, 
                    user: "Asistente IA", 
                    note: summary,
                    date: new Date().toLocaleDateString('es-ES')
                });

                res.status(200).json({ success: true, message: `Resumen guardado en ${targetClubName}` });

            } catch (error) {
                console.error(">>> ERROR GRAVE:", error);
                res.status(500).send("Error interno del servidor");
            }
        });

        if (req.rawBody) busboy.end(req.rawBody); else req.pipe(busboy);
    });
});