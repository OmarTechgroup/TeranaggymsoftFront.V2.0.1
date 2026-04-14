const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8086'

export interface PortalClient {
    id: number
    nom: string
    telephone: string | null
    email: string | null
    cardNumber: string
    qrcode: string | null
    photo: string | null
    date_inscription: string | null
    responseDto: {
        id: number
        isActif: boolean
        dateDebut: string
        dateFin: string
        produit?: { libelle: string; prix: number }
    } | null
}

export interface PortalAbonnement {
    id: number
    isActif: boolean
    dateDebut: string
    dateFin: string
    produit?: { libelle: string; prix: number }
}

async function portalFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? err.message ?? `Erreur ${res.status}`)
    }
    return res.json()
}

export async function portalLogin(id: number, cardNumber: string): Promise<PortalClient> {
    return portalFetch<PortalClient>(`/api/portal/login?id=${id}&cardNumber=${encodeURIComponent(cardNumber)}`)
}

export async function getPortalClient(id: number): Promise<PortalClient> {
    return portalFetch<PortalClient>(`/api/portal/client/${id}`)
}

export async function getPortalSubscriptions(id: number): Promise<PortalAbonnement[]> {
    return portalFetch<PortalAbonnement[]>(`/api/portal/client/${id}/subscriptions`)
}

export async function uploadPortalPhoto(id: number, file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/api/portal/client/${id}/photo`, {
        method: 'POST',
        body: formData,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erreur upload photo')
    }
}

export function getPortalPhotoUrl(id: number): string {
    return `${API_BASE}/api/portal/client/${id}/photo`
}

export async function registerFcmToken(clientId: number, token: string): Promise<void> {
    await fetch(`${API_BASE}/api/portal/client/${clientId}/fcm-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: 'web' }),
    })
}
