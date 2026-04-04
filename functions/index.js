const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// 1. Definimos las credenciales
const CLIENT_ID = "625949033296-4411im6ignisp9qo0mqp2orbovgnua2p.apps.googleusercontent.com";
// Llamamos al secreto de la caja fuerte
const clientSecret = defineSecret("CLIENT_SECRET");
const REDIRECT_URI = "postmessage";

// 2. Exportamos la función usando el formato v2 (onRequest) y le pasamos el secreto en las opciones
exports.conectarCalendario = onRequest({ secrets: [clientSecret] }, (req, res) => {
    cors(req, res, async () => {
        try {
            const { code, userId } = req.body;
            if (!code || !userId) return res.status(400).send("Faltan datos");

            // 3. Extraemos el valor del secreto
            const secretValue = clientSecret.value();

            // 4. Instanciamos OAuth2 con el secreto real
            const oauth2Client = new google.auth.OAuth2(CLIENT_ID, secretValue, REDIRECT_URI);
            
            const { tokens } = await oauth2Client.getToken(code);

            // 5. Guardamos el refresh token si Google nos lo envía
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