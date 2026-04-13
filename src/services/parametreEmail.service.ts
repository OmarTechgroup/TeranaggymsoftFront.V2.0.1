import { apiFetch } from "@/lib/api"

export interface ParametreEmail {
    actif: boolean
    emailDestinataire: string
    nomExpediteur: string
    smtpHost: string
    smtpPort: number
    smtpUsername: string
    smtpPasswordSet: boolean      // true = un mdp est enregistré (jamais renvoyé)
    smtpTls: boolean
    jourEnvoi: number
    dernierEnvoi: string | null   // "dd/MM/yyyy HH:mm"
}

export interface ParametreEmailRequest {
    actif: boolean
    emailDestinataire: string
    nomExpediteur: string
    smtpHost: string
    smtpPort: number
    smtpUsername: string
    smtpPassword?: string         // vide = ne pas changer
    smtpTls: boolean
    jourEnvoi: number
}

export async function getParametreEmail(): Promise<ParametreEmail> {
    return apiFetch<ParametreEmail>("/api/rapport-email/config")
}

export async function saveParametreEmail(data: ParametreEmailRequest): Promise<ParametreEmail> {
    return apiFetch<ParametreEmail>("/api/rapport-email/config", {
        method: "PUT",
        body: JSON.stringify(data),
    })
}

export async function envoyerRapportMaintenant(mois?: number, annee?: number): Promise<{ message: string }> {
    const params = mois && annee ? `?mois=${mois}&annee=${annee}` : ""
    return apiFetch<{ message: string }>(`/api/rapport-email/envoyer${params}`, { method: "POST" })
}
