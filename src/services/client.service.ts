import { apiFetch } from "@/lib/api"

export interface Client {
    id: number
    nom: string
    telephone: string
    email?: string
    address?: string
    date_inscription: string
    qrcode: string
    photo?: string
    cardNumber: string
}

export interface ClientCreateDTO {
    photo?: string
    nom: string
    telephone: string
    email?: string
    address?: string
    date_inscription: string
}

export async function getAllClients(): Promise<Client[]> {
    return apiFetch<Client[]>("/api/client/all")
}

export async function getClientById(id: number): Promise<Client> {
    return apiFetch<Client>(`/api/client/findById/${id}`)
}

export async function getClientByTelephone(telephone: string): Promise<Client> {
    return apiFetch<Client>(`/api/client/telephone/${telephone}`)
}

export async function createClient(data: ClientCreateDTO): Promise<Client> {
    return apiFetch<Client>("/api/client/create", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function updateClient(id: number, data: Partial<ClientCreateDTO>): Promise<Client> {
    return apiFetch<Client>(`/api/client/update/id/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function deleteClient(id: number): Promise<void> {
    return apiFetch<void>(`/api/client/delete/id/${id}`, {
        method: "DELETE",
    })
}

export async function uploadClientPhoto(clientId: number, file: File): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const formData = new FormData()
    formData.append('file', file)
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL
    await fetch(`${BASE_URL}/api/client/${clientId}/photo`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
    })
}

export function getClientPhotoUrl(clientId: number): string {
    return `${process.env.NEXT_PUBLIC_API_URL}/api/client/${clientId}/photo`
}

export interface AccesClient {
    AccessAutorize: boolean
    message: string
    clientId: number
    nom: string
    telephone: string
    typeAbonnement: string
    dateDebut: string
    dateFin: string
}

export async function getClientAcces(clientId: number): Promise<AccesClient> {
    return apiFetch<AccesClient>(`/api/service/clientActif/${clientId}`)
}
