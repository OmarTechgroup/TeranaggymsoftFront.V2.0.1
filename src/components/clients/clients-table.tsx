'use client'
import { useState } from "react"
import { Client } from "@/services/client.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shared/table"
import { Button } from "@/components/ui/shared/button"
import { Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const PAGE_SIZE = 10

interface ClientsTableProps {
    clients: Client[]
    onEdit: (client: Client) => void
    onDelete: (id: number) => void
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
                            <TableHead className="font-bold uppercase">Inscription</TableHead>
                            <TableHead className="text-right font-bold uppercase">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium uppercase">{client.nom}</TableCell>
                                <TableCell>{client.telephone}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {client.date_inscription
                                        ? format(new Date(client.date_inscription), "dd MMM yyyy", { locale: fr })
                                        : "—"}
                                </TableCell>
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
