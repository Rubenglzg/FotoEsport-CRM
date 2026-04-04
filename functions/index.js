const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const cors = require("cors")({ origin: true });

// Iniciamos la conexión con Firebase
admin.initializeApp();

// --- CONFIGURACIÓN DE SEGURIDAD ---
const CLIENT_ID = "6259490332964411im6ignisp9qo0mqp2orbovgnua2p.apps.googleusercontent.com"; // El mismo de main.jsx
const CLIENT_SECRET = "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"; // El que copiaste en el bloc de notas
const REDIRECT_URI = "postmessage"; // Obligatorio cuando se usa el flujo auth-code

exports.conectarCalendario = functions.https.onRequest((req, res) => {
    // cors() permite que tu web (localhost o dominio) hable con este servidor
    cors(req, res, async () => {
        try {
            const { code, userId } = req.body;
            if (!code || !userId) return res.status(400).send("Faltan datos");

            const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
            
            // 1. Intercambiamos el código temporal por las llaves oficiales
            const { tokens } = await oauth2Client.getToken(code);

            // 2. Si Google nos da la Llave Maestra (Refresh Token), la guardamos bajo llave en Firestore
            if (tokens.refresh_token) {
                await admin.firestore()
                    .collection("artifacts").doc("fotoesport-crm")
                    .collection("users").doc(userId)
                    .set({ calendarRefreshToken: tokens.refresh_token }, { merge: true });
            }

            // 3. Devolvemos la llave de uso diario (Access Token) al CRM para que la empiece a usar ya
            res.status(200).json({ accessToken: tokens.access_token });
        } catch (error) {
            console.error("Error en servidor:", error);
            res.status(500).send("Error al conectar con Google");
        }
    });
});