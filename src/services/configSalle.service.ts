import { apiFetch } from "@/lib/api"

export interface ConfigSalle {
    nom: string
    sousTitre: string
    adresse: string | null
    telephone: string | null
    email: string | null
    hasLogo: boolean
    logoUrl: string | null   // "/api/config-salle/logo" si logo présent
}

export interface ConfigSalleRequest {
    nom: string
    sousTitre: string
    adresse: string
    telephone: string
    email: string
}

export async function getConfigSalle(): Promise<ConfigSalle> {
    return apiFetch<ConfigSalle>("/api/config-salle")
}

export async function saveConfigSalle(data: ConfigSalleRequest): Promise<ConfigSalle> {
    return apiFetch<ConfigSalle>("/api/config-salle", {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function uploadLogo(file: File): Promise<ConfigSalle> {
    const formData = new FormData()
    formData.append("file", file)

    // On récupère le token pour l'auth
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8086"

    const res = await fetch(`${API_BASE}/api/config-salle/logo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur upload logo")
    }
    return res.json()
}

/** URL publique du logo (sans cache-busting par défaut) */
export function getLogoUrl(bust?: boolean): string {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8086"
    return `${API_BASE}/api/config-salle/logo${bust ? `?t=${Date.now()}` : ''}`
}
