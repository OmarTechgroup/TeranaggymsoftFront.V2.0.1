'use client'
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Client, getAllClients, deleteClient } from "@/services/client.service"
import { ClientsTable } from "./clients-table"
import { ClientsGrid } from "./clients-grid"
import { ClientFormSheet } from "./client-form-sheet"
import { Input } from "@/components/ui/shared/input"
import { Button } from "@/components/ui/shared/button"
import { Search, UserPlus, List, LayoutGrid, Grid2x2 } from "lucide-react"
import { toast } from "sonner"

type ViewMode = 'list' | 'grid3' | 'grid4'

interface ClientsViewProps {
    initialClients: Client[]
}

export function ClientsView({ initialClients }: ClientsViewProps) {
    const [search, setSearch] = useState("")
    const [sheetOpen, setSheetOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const queryClient = useQueryClient()

    const { data: qClients } = useQuery({
        queryKey: ['clients'],
        queryFn: getAllClients,
        staleTime: 30_000,
    })
    const clients = qClients || initialClients

    const { mutate: remove } = useMutation({
        mutationFn: (id: number) => deleteClient(id),
        onSuccess: () => {
            toast.success("Client supprimé")
            queryClient.invalidateQueries({ queryKey: ['clients'] })
        },
        onError: () => toast.error("Impossible de supprimer ce client"),
    })

    const safeClients = Array.isArray(clients) ? clients : []

    const filtered = safeClients.filter(c =>
        c.nom?.toLowerCase().includes(search.toLowerCase()) ||
        c.telephone?.includes(search)
    )

    const handleEdit = (client: Client) => {
        setSelectedClient(client)
        setSheetOpen(true)
    }

    const handleNew = () => {
        setSelectedClient(null)
        setSheetOpen(true)
    }

    return (
        <div className="space-y-4">
            {/* Barre d'actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom ou téléphone..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle vue */}
                    <div className="flex items-center border rounded-lg p-0.5 gap-0.5">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                            title="Vue liste"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid3' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid3')}
                            title="Grille 3 colonnes"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid4' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid4')}
                            title="Grille 4 colonnes"
                        >
                            <Grid2x2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button onClick={handleNew}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nouveau client
                    </Button>
                </div>
            </div>

            {/* Contenu */}
            {viewMode === 'list' ? (
                <ClientsTable
                    key={search}
                    clients={filtered}
                    onEdit={handleEdit}
                    onDelete={(id) => remove(id)}
                />
            ) : (
                <ClientsGrid
                    key={search}
                    clients={filtered}
                    cols={viewMode === 'grid3' ? 3 : 4}
                    onEdit={handleEdit}
                    onDelete={(id) => remove(id)}
                />
            )}

            {/* Modal formulaire */}
            <ClientFormSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                client={selectedClient}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['clients'] })
                    queryClient.invalidateQueries({ queryKey: ['expirations'] })
                }}
            />
        </div>
    )
}
