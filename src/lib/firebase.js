// Importa las funciones que necesitas de los SDKs
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Exporta la base de datos y la autenticación para usarlas en la app
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configurar la persistencia local
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        // La persistencia se ha configurado correctamente
        console.log("Persistencia de sesión configurada a local");
    })
    .catch((error) => {
        console.error("Error al configurar la persistencia:", error);
    });

export { auth, db, googleProvider };