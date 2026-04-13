import { apiFetch } from "@/lib/api"

export interface ClientExpirant {
    clientId: number
    nom: string
    telephone: string
    dateFin: string
    typeAbonnement: string
}

export interface Abonnement {
    id: number
    typeAbonnement: string
    dateDebut: string
    dateFin: string
    montant: number
    statut: string
}

export async function getClientsExpirants(): Promise<ClientExpirant[]> {
    return apiFetch<ClientExpirant[]>("/api/service/ClientExpirantion")
}

export async function getAbonnementsClient(clientId: number): Promise<Abonnement[]> {
    return apiFetch<Abonnement[]>(`/api/service/allAbonnementClient/${clientId}`)
}

export async function deleteAbonnement(id: number): Promise<void> {
    return apiFetch<void>(`/api/service/delete/${id}`, { method: "DELETE" })
}
