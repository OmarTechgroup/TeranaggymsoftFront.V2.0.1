'use client'
import { useState } from "react"
import { Produit, getStockLevel } from "@/services/produit.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shared/table"
import { Button } from "@/components/ui/shared/button"
import { Badge } from "@/components/ui/shared/badge"
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 10

const TYPE_LABELS: Record<string, string> = {
    ABONNEMENT: "Abonnement",
    SEANCE: "Séance",
    PRODUIT: "Produit",
}

const TYPE_COLORS: Record<string, string> = {
    ABONNEMENT: "bg-blue-100 text-blue-700",
    SEANCE: "bg-purple-100 text-purple-700",
    PRODUIT: "bg-orange-100 text-orange-700",
}

function StockIndicator({ produit }: { produit: Produit }) {
    const level = getStockLevel(produit)

    if (!produit.gererStock || level === null) {
        return <span className="text-xs text-muted-foreground">— Non géré</span>
    }

    const config = {
        high: { label: "Suffisant", color: "text-green-600", bar: "bg-green-500", width: "w-full" },
        low: { label: "Faible", color: "text-yellow-600", bar: "bg-yellow-500", width: "w-1/2" },
        critical: { label: "Critique", color: "text-red-600", bar: "bg-red-500", width: "w-1/4" },
    }[level]

    return (
        <div className="space-y-1 min-w-[120px]">
            <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{produit.stockQuantity} unités</span>
                <span className={`text-xs font-medium ${config.color}`}>· {config.label}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${config.bar} ${config.width} rounded-full transition-all`} />
            </div>
        </div>
    )
}

interface ProduitsTableProps {
    produits: Produit[]
    onEdit: (p: Produit) => void
    onDelete: (id: number) => void
}

export function ProduitsTable({ produits, onEdit, onDelete }: ProduitsTableProps) {
    const [page, setPage] = useState(1)

    const totalPages = Math.max(1, Math.ceil(produits.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const paginated = produits.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    if (produits.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-muted-foreground border rounded-lg">
                Aucun produit trouvé
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom du produit</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Seuil alerte</TableHead>
                            <TableHead>Prix unitaire</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.libelle}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[p.typeProduit] ?? "bg-muted text-muted-foreground"}`}>
                                        {TYPE_LABELS[p.typeProduit] ?? p.typeProduit}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <StockIndicator produit={p} />
                                </TableCell>
                                <TableCell>
                                    {p.gererStock && p.seuilAlert !== null
                                        ? <span className="text-sm">{p.seuilAlert} unités</span>
                                        : <span className="text-xs text-muted-foreground">—</span>
                                    }
                                </TableCell>
                                <TableCell className="font-medium">
                                    {p.prixUnitaire.toLocaleString()} FCFA
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(p)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => onDelete(p.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-1">
                <p className="text-sm text-muted-foreground">
                    {produits.length} produit{produits.length > 1 ? "s" : ""} — page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                            acc.push(p)
                            return acc
                        }, [])
                        .map((p, i) =>
                            p === '...' ? (
                                <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                            ) : (
                                <Button key={p} variant={currentPage === p ? "default" : "outline"}
                                    size="icon" className="h-8 w-8"
                                    onClick={() => setPage(p as number)}>
                                    {p}
                                </Button>
                            )
                        )}
                    <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
