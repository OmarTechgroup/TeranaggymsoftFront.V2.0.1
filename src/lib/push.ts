const VAPID_PUBLIC_KEY = 'BDl1YoHC2K46iHbSZX9DWS4rRz3NP__87RtmBvGU8WSXBpf0avBF4F8l3M5NBjQEAmkh2mCYceXIjQco1jh4Vlo'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (e) {
    console.error('SW registration failed:', e)
    return null
  }
}

export async function subscribePush(clientId: number): Promise<boolean> {
  if (!('PushManager' in window)) return false

  try {
    const reg = await registerSW()
    if (!reg) return false

    // Attendre que le SW soit actif
    await navigator.serviceWorker.ready

    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    const json = sub.toJSON()
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8086'

    await fetch(`${API_BASE}/api/portal/client/${clientId}/subscribe-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    })

    return true
  } catch (e) {
    console.error('Push subscription failed:', e)
    return false
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}
