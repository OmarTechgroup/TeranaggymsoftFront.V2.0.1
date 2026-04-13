import { apiFetch } from "@/lib/api"

export type TypeProduit = 'SEANCE' | 'PRODUIT' | 'ABONNEMENT'
export type TypeAbonnement = 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'

export interface Produit {
    id: number
    libelle: string
    prixUnitaire: number
    typeProduit: TypeProduit
    gererStock: boolean
    stockQuantity: number | null
    seuilAlert: number | null
    prixAchat: number | null
    dureeAbonnement: TypeAbonnement | null
}

export interface ProduitCreateDTO {
    libelle: string
    prixUnitaire: number
    typeProduit: TypeProduit
    gererStock: boolean
    prixAchat?: number | null
    stockQuantity?: number | null
    seuilAlert?: number | null
    dureeAbonnement?: TypeAbonnement | null
}

export async function getAllProduits(): Promise<Produit[]> {
    return apiFetch<Produit[]>("/api/product/finAll")
}

export async function createProduit(data: ProduitCreateDTO): Promise<Produit> {
    return apiFetch<Produit>("/api/product/save", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function updateProduit(id: number, data: ProduitCreateDTO): Promise<Produit> {
    return apiFetch<Produit>(`/api/product/update/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function deleteProduit(id: number): Promise<void> {
    return apiFetch<void>(`/api/product/delete/id/${id}`, { method: "DELETE" })
}

export function getStockLevel(produit: Produit): 'high' | 'low' | 'critical' | null {
    if (!produit.gererStock || produit.stockQuantity === null || produit.seuilAlert === null) return null
    if (produit.stockQuantity <= 0) return 'critical'
    if (produit.stockQuantity <= produit.seuilAlert) return 'low'
    return 'high'
}

export interface StockEntree {
    id: number
    produitId: number
    produitLibelle: string
    quantite: number
    prixAchatUnitaire: number | null
    coutTotal: number | null
    note: string | null
    dateEntree: string
    createdBy: string
}

export interface StockEntreeDTO {
    produitId: number
    quantite: number
    prixAchatUnitaire?: number
    note?: string
}

export async function entrerStock(data: StockEntreeDTO): Promise<StockEntree> {
    return apiFetch<StockEntree>("/api/product/stock/entree", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function getHistoriqueStock(produitId: number): Promise<StockEntree[]> {
    return apiFetch<StockEntree[]>(`/api/product/stock/historique/${produitId}`)
}

export async function getAllHistoriqueStock(): Promise<StockEntree[]> {
    return apiFetch<StockEntree[]>("/api/product/stock/historique")
}

export interface StockSortie {
    id: number
    produitId: number
    produitLibelle: string
    quantite: number
    motif: string
    dateSortie: string
    createdBy: string
}

export interface StockSortieDTO {
    produitId: number
    quantite: number
    motif: string
}

export async function sortirStock(data: StockSortieDTO): Promise<StockSortie> {
    return apiFetch<StockSortie>("/api/product/stock/sortie", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function getAllHistoriqueSorties(): Promise<StockSortie[]> {
    return apiFetch<StockSortie[]>("/api/product/stock/sorties")
}
