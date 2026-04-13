'use client'
import { useState } from "react"
import { Client, getClientPhotoUrl } from "@/services/client.service"
import { Button } from "@/components/ui/shared/button"
import { Pencil, Trash2, Eye, User, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 12

interface ClientsGridProps {
    clients: Client[]
    cols: 3 | 4
    onEdit: (client: Client) => void
    onDelete: (id: number) => void
}

export function ClientsGrid({ clients, cols, onEdit, onDelete }: ClientsGridProps) {
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
        <div className="space-y-4">
            <div className={`grid gap-4 ${cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                {paginated.map((client) => (
                    <ClientCard key={client.id} client={client} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-muted-foreground">
                        {clients.length} client{clients.length > 1 ? "s" : ""} — page {currentPage} sur {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

function ClientCard({ client, onEdit, onDelete }: {
    client: Client
    onEdit: (c: Client) => void
    onDelete: (id: number) => void
}) {
    const [imgError, setImgError] = useState(false)
    const photoUrl = getClientPhotoUrl(client.id)

    return (
        <div className="border rounded-xl p-4 flex flex-col items-center gap-3 bg-card hover:shadow-md transition-shadow">
            {/* Photo */}
            <div className="h-16 w-16 rounded-full border-2 border-primary bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {!imgError ? (
                    <img
                        src={photoUrl}
                        alt={client.nom}
                        className="h-full w-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                )}
            </div>

            {/* Infos */}
            <div className="text-center min-w-0 w-full">
                <p className="font-semibold text-sm truncate uppercase">{client.nom}</p>
                <p className="text-xs text-muted-foreground">{client.telephone}</p>
                {client.cardNumber && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">#{client.cardNumber}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 mt-auto">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/clients/${client.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(client)}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(client.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}
