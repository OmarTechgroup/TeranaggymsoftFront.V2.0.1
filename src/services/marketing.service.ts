import { apiFetch } from "@/lib/api"

export interface Campagne {
    id: number
    titre: string
    message: string
    cible: "TOUS" | "ACTIFS" | "INACTIFS"
    categorie: string
    nbEnvoyes: number
    envoyeLe: string | null
    envoyePar: string | null
}

export interface MarketingStats {
    tous: number
    actifs: number
    inactifs: number
}

export interface EnvoiRequest {
    titre: string
    message: string
    cible: "TOUS" | "ACTIFS" | "INACTIFS"
    categorie: string
}

export async function getMarketingStats(): Promise<MarketingStats> {
    return apiFetch<MarketingStats>("/api/marketing/stats")
}

export async function getCampagnes(): Promise<Campagne[]> {
    return apiFetch<Campagne[]>("/api/marketing/campagnes")
}

export async function envoyerNotification(data: EnvoiRequest): Promise<{ nbEnvoyes: number; message: string }> {
    return apiFetch("/api/marketing/envoyer", {
        method: "POST",
        body: JSON.stringify(data),
    })
}
