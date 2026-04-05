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
            
            // Medida de seguridad básica para que nadie más pueda meter datos
            if (token !== "FOTOESPORT_SECRETO") return res.status(401).send("No autorizado");
            if (!clubName || !text) return res.status(400).send("Faltan datos");

            const db = admin.firestore();
            
            // 1. Buscar el club (traemos todos y filtramos para ignorar mayúsculas/minúsculas)
            // NOTA: Ajusta "clubs" si el nombre de tu colección principal en Firestore es distinto
            const clubsSnapshot = await db.collection("clubs").get(); 
            let targetClub = null;
            
            clubsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.name && data.name.toLowerCase().includes(clubName.toLowerCase())) {
                    targetClub = { id: doc.id, ...data };
                }
            });

            if (!targetClub) {
                return res.status(404).send(`No se encontró el club "${clubName}"`);
            }

            // 2. Pedirle a Gemini que resuma el texto
            const prompt = `Actúa como un asistente CRM. Resume la siguiente transcripción de llamada en un formato estructurado y muy corto. Usa viñetas para: Estado actual, Acuerdos, y Siguientes pasos: "${text}"`;
            
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.value()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const geminiData = await geminiRes.json();
            const summary = geminiData.candidates[0].content.parts[0].text;

            // 3. Guardar en Firebase dentro del historial del club
            const interactionId = Date.now().toString();
            await db.collection("clubs").doc(targetClub.id).collection("interactions").doc(interactionId).set({
                id: interactionId,
                clubId: targetClub.id,
                type: "call",
                user: "Tú (iPhone)",
                note: summary,
                date: new Date().toLocaleDateString('es-ES')
            });

            res.status(200).json({ success: true, message: `Llamada guardada en ${targetClub.name}` });

        } catch (error) {
            console.error("Error al procesar llamada de iOS:", error);
            res.status(500).send("Error interno del servidor");
        }
    });
});