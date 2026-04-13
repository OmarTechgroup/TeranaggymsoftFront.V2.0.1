'use client'
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProduitsTable } from "@/components/produits/produits-table"
import { ProduitFormModal } from "@/components/produits/produit-form-modal"
import { Produit, getAllProduits, deleteProduit, getStockLevel } from "@/services/produit.service"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Skeleton } from "@/components/ui/shared/skeleton"
import { Plus, Search, Package, AlertTriangle, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function ProduitsPage() {
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<Produit | null>(null)
    const queryClient = useQueryClient()

    const { data: produits = [], isLoading } = useQuery({
        queryKey: ['produits'],
        queryFn: getAllProduits,
        staleTime: 30_000,
    })

    const { mutate: remove } = useMutation({
        mutationFn: (id: number) => deleteProduit(id),
        onSuccess: () => {
            toast.success("Produit supprimé")
            queryClient.invalidateQueries({ queryKey: ['produits'] })
        },
        onError: () => toast.error("Impossible de supprimer ce produit"),
    })

    const filtered = produits.filter(p => {
        const matchSearch = p.libelle.toLowerCase().includes(search.toLowerCase())
        const matchType = typeFilter ? p.typeProduit === typeFilter : true
        return matchSearch && matchType
    })

    // KPIs
    const total = produits.length
    const enAlerte = produits.filter(p => getStockLevel(p) === 'low').length
    const critiques = produits.filter(p => getStockLevel(p) === 'critical').length

    const handleEdit = (p: Produit) => { setSelected(p); setModalOpen(true) }
    const handleNew = () => { setSelected(null); setModalOpen(true) }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <DashboardHeader title="Produits" />
            <div className="flex-1 p-6 space-y-6 overflow-auto">

                {/* KPI cards */}
                {isLoading ? (
                    <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{total}</p>
                                <p className="text-xs text-muted-foreground">Total produits</p>
                            </div>
                        </div>
                        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{enAlerte}</p>
                                <p className="text-xs text-muted-foreground">Stock faible</p>
                            </div>
                        </div>
                        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{critiques}</p>
                                <p className="text-xs text-muted-foreground">Stock critique</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Barre actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative max-w-xs flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un produit..."
                                className="pl-10"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                        >
                            <option value="">Tous les types</option>
                            <option value="ABONNEMENT">Abonnement</option>
                            <option value="SEANCE">Séance</option>
                            <option value="PRODUIT">Produit</option>
                        </select>
                    </div>
                    <Button onClick={handleNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un produit
                    </Button>
                </div>

                {/* Table */}
                {isLoading ? (
                    <Skeleton className="h-64 rounded-xl" />
                ) : (
                    <ProduitsTable
                        key={search + typeFilter}
                        produits={filtered}
                        onEdit={handleEdit}
                        onDelete={(id) => remove(id)}
                    />
                )}
            </div>

            <ProduitFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                produit={selected}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['produits'] })}
            />
        </div>
    )
}
