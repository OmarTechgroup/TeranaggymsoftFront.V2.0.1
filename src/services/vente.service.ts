import { apiFetch } from "@/lib/api"

export interface LigneCommandeRequest {
    produitId: number
    quantite: number
}

export interface VenteRequest {
    clientId?: number | null
    users: string
    commandeVentes: LigneCommandeRequest[]
}

export interface LigneCommandeResponse {
    produitLibelle: string
    prixUnitaire: number
    quantite: number
    sousTotal: number
}

export interface VenteResponse {
    id: number
    dateTime: string
    nom: string
    telephone: string
    users: string
    ligneCommandeVenteList: LigneCommandeResponse[]
    montantTotal: number
}

export async function creerVente(data: VenteRequest): Promise<VenteResponse> {
    return apiFetch<VenteResponse>("/api/sale/save", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export interface VenteRapportLigne {
    id: number
    dateTime: string        // format "dd-MM-yyyy HH:mm:ss" du backend
    nomClient: string | null
    produitLibelle: string
    quantite: number
    montantTotal: number
    users: string
    typeProduit: 'ABONNEMENT' | 'SEANCE' | 'PRODUIT' | null
    annulee: boolean
    dateAnnulation: string | null
    annulePar: string | null
}

export interface RapportComplet {
    ventes: VenteRapportLigne[]
    total: number
}

function toISOLocal(dt: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
}

export async function getRapport(debut: Date, fin: Date): Promise<RapportComplet> {
    return apiFetch<RapportComplet>("/api/sale/rapport/all", {
        method: "POST",
        body: JSON.stringify({ dateDebut: toISOLocal(debut), dateFin: toISOLocal(fin) }),
    })
}

export interface VenteStats {
    recettesJour: number
    recettesSemaine: number
    recettesMois: number
    nbVentesJour: number
}

export async function getVenteStats(): Promise<VenteStats> {
    return apiFetch<VenteStats>("/api/sale/stats")
}

export async function annulerVente(venteId: number): Promise<{ message: string; venteId: number }> {
    return apiFetch<{ message: string; venteId: number }>(`/api/sale/annuler/${venteId}`, {
        method: "PUT",
        body: JSON.stringify({}),
    })
}
