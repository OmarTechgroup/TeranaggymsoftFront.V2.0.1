'use client'
import { useState, useEffect } from "react"
import { Client, getClientAcces, AccesClient } from "@/services/client.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shared/table"
import { Button } from "@/components/ui/shared/button"
import { Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

function getStatus(dateFin?: string, isActif?: boolean) {
    if (!dateFin) return { text: "Aucun", color: "text-slate-500 bg-slate-100" }
    const fin = new Date(dateFin)
    const now = new Date()
    fin.setHours(23, 59, 59, 999)
    
    if (fin.getTime() < now.getTime()) return { text: "Expiré", color: "text-red-600 bg-red-100" }
    
    const diffTime = fin.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    
    if (diffDays <= 3) return { text: "Expire bientôt", color: "text-orange-600 bg-orange-100" }
    if (isActif === false) return { text: "Inactif", color: "text-slate-600 bg-slate-100" }
    return { text: "Actif", color: "text-green-600 bg-green-100" }
}

const PAGE_SIZE = 10

interface ClientsTableProps {
    clients: Client[]
    onEdit: (client: Client) => void
    onDelete: (id: number) => void
}

function ClientSubscriptionCells({ clientId }: { clientId: number }) {
    const [data, setData] = useState<AccesClient | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        getClientAcces(clientId)
            .then(res => {
                if (mounted) { setData(res); setLoading(false) }
            })
            .catch(() => {
                if (mounted) { setLoading(false) }
            })
        return () => { mounted = false }
    }, [clientId])

    if (loading) {
        return (
            <>
                <TableCell><div className="h-4 w-16 bg-muted/50 animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-5 w-14 bg-muted/50 animate-pulse rounded-full" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted/50 animate-pulse rounded" /></TableCell>
            </>
        )
    }

    const statutInfo = getStatus(data?.dateFin, data?.AccessAutorize)

    return (
        <>
            <TableCell className="text-muted-foreground font-medium">
                {data?.typeAbonnement || "—"}
            </TableCell>
            <TableCell>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold whitespace-nowrap ${statutInfo.color}`}>
                    {statutInfo.text}
                </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
                {data?.dateFin
                    ? format(new Date(data.dateFin), "dd MMM yyyy", { locale: fr })
                    : "—"}
            </TableCell>
        </>
    )
}

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
    const [page, setPage] = useState(1)

    const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const paginated = clients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    if (clients.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-muted-foreground border rounded-lg">
                Aucun client trouvé
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow className="">
                            <TableHead className="font-bold uppercase">Nom Complet</TableHead>
                            <TableHead className="font-bold uppercase">Téléphone</TableHead>
                            <TableHead className="font-bold uppercase">Abonnement</TableHead>
                            <TableHead className="font-bold uppercase">Statut</TableHead>
                            <TableHead className="font-bold uppercase">Expiration</TableHead>
                            <TableHead className="text-right font-bold uppercase">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium uppercase">{client.nom}</TableCell>
                                <TableCell>{client.telephone}</TableCell>
                                
                                <ClientSubscriptionCells clientId={client.id} />

                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/clients/${client.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => onDelete(client.id)}
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
                    {clients.length} client{clients.length > 1 ? "s" : ""} —
                    page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
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
                                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={currentPage === p ? "default" : "outline"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(p as number)}
                                >
                                    {p}
                                </Button>
                            )
                        )}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
