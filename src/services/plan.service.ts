import { apiFetch } from "@/lib/api"
import { BarChart, Bell, Bot, Boxes, Briefcase, LucideIcon, Mail, NotebookText, Package, ShoppingCart, Smartphone, TrendingDown, User, UserCog } from "lucide-react";

export type ModuleKey =
    | "CLIENTS" | "CAISSE" | "PRODUITS" | "STOCK" | "DEPENSES"
    | "EMPLOYES" | "COMPTABILITE" | "RAPPORTS" | "CHAT_IA"
    | "RAPPORT_EMAIL" | "UTILISATEURS" | "PORTAIL_CLIENT" | "MARKETING_PUSH"

export const MODULE_META: Record<ModuleKey, { label: string; description: string; icon: LucideIcon; group: string }> = {
    CLIENTS: { label: "Gestion des Clients", description: "Membres, abonnements, fiches clients", icon: User, group: "Principale" },
    CAISSE: { label: "Point de vente", description: "Caisse, encaissements, tickets", icon: ShoppingCart, group: "Principale" },
    PRODUITS: { label: "Gestion des Produits", description: "Catalogue, prix, types de produits", icon: Package, group: "Gestion" },
    STOCK: { label: "Gestion de Stock", description: "Entrées, sorties, alertes stock bas", icon: Boxes, group: "Gestion" },
    DEPENSES: { label: "Gestion des Dépenses", description: "Charges, catégories, historique", icon: TrendingDown, group: "Gestion" },
    EMPLOYES: { label: "Employés", description: "Fiches, salaires, paiements", icon: Briefcase, group: "Gestion" },
    COMPTABILITE: { label: "Comptabilité", description: "Bilan mensuel, vue annuelle", icon: NotebookText, group: "Analyse & Finance" },
    RAPPORTS: { label: "Rapports", description: "Ventes par période, annulation", icon: BarChart, group: "Analyse & Finance" },
    CHAT_IA: { label: "Chat IA", description: "Assistant intelligent intégré", icon: Bot, group: "Outils" },
    RAPPORT_EMAIL: { label: "Rapport auto email", description: "Envoi mensuel automatique par email", icon: Mail, group: "Outils" },
    PORTAIL_CLIENT: { label: "Portail Client (PWA)", description: "App mobile membres : QR code, abonnement", icon: Smartphone, group: "Outils" },
    MARKETING_PUSH: { label: "Marketing Push", description: "Notifications push ciblées aux membres", icon: Bell, group: "Outils" },
    UTILISATEURS: { label: "Utilisateurs", description: "Comptes, rôles, accès", icon: UserCog, group: "Administration" },
}

export interface Plan {
    id: number
    nom: string
    description: string | null
    prixMensuel: number
    modules: ModuleKey[]
    actif: boolean
}

export interface PlanRequest {
    nom: string
    description: string
    prixMensuel: number
    modules: ModuleKey[]
}

export async function getPlans(): Promise<Plan[]> {
    return apiFetch<Plan[]>("/api/plans")
}

export async function getModulesActifs(): Promise<ModuleKey[]> {
    return apiFetch<ModuleKey[]>("/api/plans/modules-actifs")
}

export async function createPlan(data: PlanRequest): Promise<Plan> {
    return apiFetch<Plan>("/api/plans", { method: "POST", body: JSON.stringify(data) })
}

export async function updatePlan(id: number, data: PlanRequest): Promise<Plan> {
    return apiFetch<Plan>(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function deletePlan(id: number): Promise<void> {
    return apiFetch<void>(`/api/plans/${id}`, { method: "DELETE" })
}

export async function activerPlan(id: number): Promise<Plan> {
    return apiFetch<Plan>(`/api/plans/${id}/activer`, { method: "POST" })
}

export async function desactiverPlan(): Promise<void> {
    return apiFetch<void>("/api/plans/desactiver", { method: "POST" })
}
