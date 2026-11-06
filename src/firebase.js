import {initializeApp} from 'firebase/app'
import {getAuth} from 'firebase/auth'
import {getFirestore, addDoc, collection, serverTimestamp} from 'firebase/firestore'
import {getStorage} from 'firebase/storage'

export const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
}
const app = initializeApp(cfg)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const addLog = (m, by) => addDoc(collection(db, 'logs'), {m, by, at: serverTimestamp()})
