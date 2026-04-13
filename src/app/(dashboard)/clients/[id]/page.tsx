'use client'
import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientDetail } from "@/components/clients/client-detail"
import { getClientById, getClientAcces } from "@/services/client.service"
import { Skeleton } from "@/components/ui/shared/skeleton"
import { Button } from "@/components/ui/shared/button"
import { ArrowLeft } from "lucide-react"

interface Props {
    params: Promise<{ id: string }>
}

export default function ClientDetailPage({ params }: Props) {
    const { id } = use(params)
    const clientId = parseInt(id)
    const router = useRouter()

    const { data: client, isLoading: l1 } = useQuery({
        queryKey: ['client', clientId],
        queryFn: () => getClientById(clientId),
        staleTime: 0,
        refetchOnWindowFocus: true,
    })

    const { data: acces, isLoading: l2 } = useQuery({
        queryKey: ['acces', clientId],
        queryFn: () => getClientAcces(clientId),
        staleTime: 0,
        refetchOnWindowFocus: true,
    })

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <DashboardHeader title="Fiche Client">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
            </DashboardHeader>
            <div className="flex-1 p-6 overflow-auto">
                {l1 || l2 ? (
                    <div className="space-y-4">
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                ) : client ? (
                    <ClientDetail client={client} acces={acces ?? null} />
                ) : (
                    <p className="text-muted-foreground">Client introuvable</p>
                )}
            </div>
        </div>
    )
}
