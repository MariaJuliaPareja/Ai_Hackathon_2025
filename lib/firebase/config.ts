

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Importamos Auth (para login/registro)
import { getFirestore } from "firebase/firestore"; // Importamos Firestore (para DB)

// 1. Usa las variables de entorno para la configuración
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  
  // Mantenemos estas claves de entorno, pero NO inicializaremos Storage
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, 
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. Inicialización de la App (Robusta para Next.js)
// getApps() verifica si la app ya está inicializada.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 3. Inicialización de los servicios y Exportación
export const auth = getAuth(app); // Necesario para AuthContext
export const db = getFirestore(app); // Necesario para la Base de Datos