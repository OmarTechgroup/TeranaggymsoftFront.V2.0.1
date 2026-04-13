'use client'
import { useQuery } from "@tanstack/react-query"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientsView } from "@/components/clients/clients-view"
import { ClientsKpi } from "@/components/clients/clients-kpi"
import { getAllClients } from "@/services/client.service"
import { getClientsExpirants } from "@/services/abonnement.service"
import { Skeleton } from "@/components/ui/shared/skeleton"

export default function ClientsPage() {
    const { data: clients = [], isLoading: l1 } = useQuery({
        queryKey: ['clients'],
        queryFn: getAllClients,
        staleTime: 30_000,
    })
    const { data: expirants = [], isLoading: l2 } = useQuery({
        queryKey: ['expirations'],
        queryFn: getClientsExpirants,
        staleTime: 5 * 60_000,
    })

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <DashboardHeader title="Clients" />
            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {l1 || l2 ? (
                    <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                ) : (
                    <ClientsKpi clients={clients} activeCount={expirants.length} />
                )}
                <ClientsView initialClients={clients} />
            </div>
        </div>
    )
}
