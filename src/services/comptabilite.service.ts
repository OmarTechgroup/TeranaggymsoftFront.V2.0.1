import { apiFetch } from "@/lib/api"

export type DepenseCategorie =
    | 'LOYER'
    | 'ELECTRICITE'
    | 'EAU'
    | 'MAINTENANCE'
    | 'FOURNITURES'
    | 'MARKETING'
    | 'AUTRE'

export const CATEGORIE_LABELS: Record<DepenseCategorie, string> = {
    LOYER:        'Loyer',
    ELECTRICITE:  'Électricité',
    EAU:          'Eau',
    MAINTENANCE:  'Maintenance',
    FOURNITURES:  'Fournitures',
    MARKETING:    'Marketing',
    AUTRE:        'Autre',
}

export interface Depense {
    id: number
    categorie: DepenseCategorie
    description: string
    montant: number
    dateDepense: string   // "yyyy-MM-dd"
    creePar: string
}

export interface DepenseRequest {
    categorie: DepenseCategorie
    description: string
    montant: number
    dateDepense: string   // "yyyy-MM-dd"
}

export interface BilanMensuel {
    mois: number
    annee: number
    // Recettes
    recettesTotales: number
    recettesAbonnements: number
    recettesSeances: number
    recettesProduits: number
    // Charges
    salairesDecaisses: number
    depensesDiverses: number
    totalCharges: number
    // Résultat
    beneficeNet: number
    tauxMarge: number
}

// ─── Dépenses CRUD ───────────────────────────────────────────────────────────

export async function getDepenses(mois?: number, annee?: number): Promise<Depense[]> {
    const params = mois != null && annee != null ? `?mois=${mois}&annee=${annee}` : ""
    return apiFetch<Depense[]>(`/api/depenses${params}`)
}

export async function createDepense(data: DepenseRequest): Promise<Depense> {
    return apiFetch<Depense>("/api/depenses", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function updateDepense(id: number, data: DepenseRequest): Promise<Depense> {
    return apiFetch<Depense>(`/api/depenses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function deleteDepense(id: number): Promise<void> {
    return apiFetch<void>(`/api/depenses/${id}`, { method: "DELETE" })
}

// ─── Bilan ───────────────────────────────────────────────────────────────────

export async function getBilanMensuel(mois: number, annee: number): Promise<BilanMensuel> {
    return apiFetch<BilanMensuel>(`/api/comptabilite/bilan-mensuel?mois=${mois}&annee=${annee}`)
}

export async function getBilanAnnuel(annee: number): Promise<BilanMensuel[]> {
    return apiFetch<BilanMensuel[]>(`/api/comptabilite/bilan-annuel?annee=${annee}`)
}
