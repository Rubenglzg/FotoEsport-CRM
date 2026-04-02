// Importa las funciones que necesitas de los SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Reemplaza ESTE objeto con el que copiaste de tu consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAL_6VEsWaNIYT5Mw1vxL682jAEh1c9x4I",
  authDomain: "fotoesport-crm.firebaseapp.com",
  projectId: "fotoesport-crm",
  storageBucket: "fotoesport-crm.firebasestorage.app",
  messagingSenderId: "905001341850",
  appId: "1:905001341850:web:b6889e6b56b58b0bec6023",
  measurementId: "G-5R2ZQ5CVSC"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la base de datos y la autenticación para usarlas en la app
export const db = getFirestore(app);
export const auth = getAuth(app);