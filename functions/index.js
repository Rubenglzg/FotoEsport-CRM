const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https"); // <-- Añadido onCall y HttpsError
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const cors = require("cors")({ origin: true });

const Busboy = require("busboy");
const os = require("os");
const path = require("path");
const fs = require("fs");

if (!admin.apps.length) {
    admin.initializeApp();
}

// 1. Definimos las credenciales
const CLIENT_ID = defineString("CLIENT_ID");
const clientSecret = defineSecret("CLIENT_SECRET");
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

// --- FUNCIÓN ANTERIOR (Atajos de iOS) ---
exports.recibirLlamadaiOS = onRequest({ secrets: [geminiApiKey, webhookToken] }, (req, res) => {
    cors(req, res, () => {
        if (req.method !== 'POST') return res.status(405).send('Solo POST');

        const busboy = Busboy({ headers: req.headers });
        let clubName = "";
        let token = "";
        let tipoInteraccion = "call"; 
        let userId = ""; 
        let audioBuffer = null;
        let mimeType = "audio/m4a"; 
        let fechaInteraccion = "";

        busboy.on("field", (fieldname, val) => {
            console.log(`Atajo envió -> Clave: "${fieldname}" | Valor: "${val}"`);
            
            if (fieldname === "club") clubName = val.trim();
            if (fieldname === "token") token = val.trim();
            if (fieldname === "tipo") tipoInteraccion = val.trim(); 
            if (fieldname === "userId") userId = val.trim();
            if (fieldname === "fecha") fechaInteraccion = val.trim();
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
                if (token !== webhookToken.value()) {
                    console.warn("Intento de acceso denegado por token inválido.");
                    return res.status(401).send("No autorizado");
                }
                
                if (!userId || !clubName || !audioBuffer) {
                    return res.status(400).send("Faltan datos (userId, club, o audio)");
                }

                const db = admin.firestore();
                
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
                // 1. OBTENEMOS LA RESPUESTA DE GEMINI (Esto ya lo tienes)
                const summary = geminiData.candidates[0].content.parts[0].text;

                // 2. BUSCAMOS EL NOMBRE REAL DEL USUARIO EN LA BASE DE DATOS
                let nombreReal = "Asistente IA";
                try {
                    const userDoc = await db.collection("users").doc(userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData.nombre) {
                            // Si tiene nombre configurado, lo usamos
                            nombreReal = `${userData.nombre} ${userData.apellidos || ''}`.trim() + ' (App iOS)';
                        } else if (userData.email) {
                            // Si por algún motivo no tiene nombre, usamos el inicio del correo
                            nombreReal = userData.email.split('@')[0] + ' (App iOS)';
                        }
                    }
                } catch (err) {
                    console.error("Error al buscar el perfil del usuario:", err);
                }

                // 3. GUARDAMOS EN FIRESTORE CON EL NOMBRE REAL
                const interactionId = Date.now().toString();
                await userClubsRef.parent.collection("interactions").doc(interactionId).set({
                    id: interactionId,
                    clubId: targetClubRef.id,
                    type: tipoInteraccion, // Si el atajo manda "Atajo Móvil", se guardará "Atajo Móvil"
                    user: nombreReal,      // Ahora pondrá "Rubén González (App iOS)"
                    note: summary,
                    date: fechaInteraccion // <-- CORREGIDO (antes decía fechaFinal)
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

// --- NUEVA FUNCIÓN: Crear Comercial (CON PERMISOS) ---
exports.createComercialUser = onCall(async (request) => {
    const { auth, data } = request;

    if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const callerDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new HttpsError('permission-denied', 'Solo administradores.');
    }

    // <-- AÑADIDO: Extraemos nombre y apellidos
    const { email, password, allowedZones, permissions, nombre, apellidos } = data;

    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });

        await admin.firestore().collection('users').doc(userRecord.uid).set({
            email: email,
            nombre: nombre || '',       // <-- AÑADIDO
            apellidos: apellidos || '', // <-- AÑADIDO
            role: 'comercial',
            adminUid: auth.uid, 
            allowedZones: allowedZones || [], 
            permissions: permissions || {
                canEditSeasons: false,
                canEditChecklist: false,
                canEditObjectives: false
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, uid: userRecord.uid, message: "Comercial creado con éxito." };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});

// --- NUEVA FUNCIÓN: Editar Comercial (CON PERMISOS) ---
exports.updateComercialUser = onCall(async (request) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Sin autorización.');

    const callerDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new HttpsError('permission-denied', 'Solo administradores.');
    }

    const { targetUid, newPassword, allowedZones, permissions } = data;

    try {
        const updateData = {};
        
        if (allowedZones) updateData.allowedZones = allowedZones;
        if (permissions) updateData.permissions = permissions; // Actualizamos permisos

        if (Object.keys(updateData).length > 0) {
            await admin.firestore().collection('users').doc(targetUid).update(updateData);
        }
        
        if (newPassword && newPassword.length >= 6) {
            await admin.auth().updateUser(targetUid, { password: newPassword });
        }

        return { success: true, message: "Usuario actualizado." };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});

// --- NUEVA FUNCIÓN: Eliminar Comercial ---
exports.deleteComercialUser = onCall(async (request) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Sin autorización.');

    const callerDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
        throw new HttpsError('permission-denied', 'Solo administradores.');
    }

    const { targetUid } = data;

    try {
        // 1. Lo borramos de Authentication (ya no podrá loguearse)
        await admin.auth().deleteUser(targetUid);
        
        // 2. Lo borramos de Firestore
        await admin.firestore().collection('users').doc(targetUid).delete();

        return { success: true, message: "Usuario eliminado." };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});