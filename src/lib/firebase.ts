import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'

// ⚠️ Remplacer par votre config Firebase Console → Project Settings → Web App
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

let app: FirebaseApp
let messaging: Messaging | null = null

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  return app
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (!firebaseConfig.apiKey) return null
  try {
    return getMessaging(getFirebaseApp())
  } catch {
    return null
  }
}

/** Demander permission + récupérer token FCM */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const msg = getFirebaseMessaging()
    if (!msg) return null

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    })
    return token ?? null
  } catch (e) {
    console.warn('FCM token error:', e)
    return null
  }
}

/** Écouter les messages en foreground (app ouverte) */
export function onForegroundMessage(callback: (payload: any) => void) {
  const msg = getFirebaseMessaging()
  if (!msg) return () => {}
  return onMessage(msg, callback)
}
