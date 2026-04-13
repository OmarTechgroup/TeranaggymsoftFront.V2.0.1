import { apiFetch } from "@/lib/api"

export type StatutEmploye = 'ACTIF' | 'INACTIF' | 'CONGE'

export interface Employe {
    id: number
    nom: string
    prenom: string
    telephone: string
    email: string | null
    poste: string
    salaireMensuel: number
    dateEmbauche: string   // "dd-MM-yyyy"
    statut: StatutEmploye
    note: string | null
}

export interface EmployeRequest {
    nom: string
    prenom: string
    telephone: string
    email?: string | null
    poste: string
    salaireMensuel: number
    dateEmbauche: string   // "yyyy-MM-dd" pour le backend
    statut?: StatutEmploye
    note?: string | null
}

export interface PaiementSalaire {
    id: number
    employeId: number
    employeNomComplet: string
    poste: string
    salaireMensuel: number
    mois: number
    annee: number
    montantPaye: number
    datePaiement: string   // "dd-MM-yyyy HH:mm"
    note: string | null
    payePar: string
}

export interface PaiementRequest {
    employeId: number
    mois: number
    annee: number
    montantPaye?: number | null
    note?: string | null
}

export interface ResumePaie {
    nbEmployesActifs: number
    masseSalarialeTotal: number
    totalDejaDecaisse: number
    resteADecaisser: number
    nbPayes: number
    nbRestants: number
}

// ─── CRUD Employés ────────────────────────────────────────────────────────────

export async function getAllEmployes(): Promise<Employe[]> {
    return apiFetch<Employe[]>("/api/employes")
}

export async function getEmployeById(id: number): Promise<Employe> {
    return apiFetch<Employe>(`/api/employes/${id}`)
}

export async function createEmploye(data: EmployeRequest): Promise<Employe> {
    return apiFetch<Employe>("/api/employes", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function updateEmploye(id: number, data: EmployeRequest): Promise<Employe> {
    return apiFetch<Employe>(`/api/employes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function deleteEmploye(id: number): Promise<void> {
    return apiFetch<void>(`/api/employes/${id}`, { method: "DELETE" })
}

// ─── Paie ─────────────────────────────────────────────────────────────────────

export async function enregistrerPaiement(data: PaiementRequest): Promise<PaiementSalaire> {
    return apiFetch<PaiementSalaire>("/api/employes/paie/payer", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function getPaiementsByEmploye(id: number): Promise<PaiementSalaire[]> {
    return apiFetch<PaiementSalaire[]>(`/api/employes/${id}/paiements`)
}

export async function getPaiementsDuMois(mois: number, annee: number): Promise<PaiementSalaire[]> {
    return apiFetch<PaiementSalaire[]>(`/api/employes/paie/mois?mois=${mois}&annee=${annee}`)
}

export async function getResumePaie(mois: number, annee: number): Promise<ResumePaie> {
    return apiFetch<ResumePaie>(`/api/employes/paie/resume?mois=${mois}&annee=${annee}`)
}
