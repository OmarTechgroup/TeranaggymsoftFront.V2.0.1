'use client'
import { useQuery } from "@tanstack/react-query"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardKpiCards } from "@/components/dashboard-kpi-cards"
import { getAllClients } from "@/services/client.service"
import { getClientsExpirants } from "@/services/abonnement.service"
import { getRapport } from "@/services/vente.service"
import { Skeleton } from "@/components/ui/shared/skeleton"

export default function DashboardPage() {
    const { data: clients, isLoading: l1 } = useQuery({
        queryKey: ['clients'],
        queryFn: getAllClients,
        staleTime: 30_000,
        refetchInterval: 60_000,
    })
    const { data: expirants, isLoading: l2 } = useQuery({
        queryKey: ['expirations'],
        queryFn: getClientsExpirants,
        staleTime: 5 * 60_000,
        refetchInterval: 5 * 60_000,
    })
    const { data: rapport, isLoading: l3 } = useQuery({
        queryKey: ['rapport-jour'],
        queryFn: () => {
            const now = new Date()
            const debut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
            const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
            return getRapport(debut, fin)
        },
        staleTime: 60_000,
        refetchInterval: 60_000,
    })

    const isLoading = l1 || l2 || l3

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <DashboardHeader title="Dashboard" />
            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-28 rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <DashboardKpiCards
                        totalClients={clients?.length ?? 0}
                        totalExpirants={expirants?.length ?? 0}
                        ventesTotal={rapport?.total ?? 0}
                        ventesCount={rapport?.ventes?.length ?? 0}
                    />
                )}
            </div>
        </div>
    )
}
