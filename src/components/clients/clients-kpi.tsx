import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Users, UserCheck, UserPlus } from "lucide-react"
import { Client } from "@/services/client.service"
import { differenceInDays } from "date-fns"

interface ClientsKpiProps {
    clients: Client[]
    activeCount: number
}

export function ClientsKpi({ clients, activeCount }: ClientsKpiProps) {
    const safeClients = Array.isArray(clients) ? clients : []

    const newClients = safeClients.filter(c => {
        const diff = differenceInDays(new Date(), new Date(c.date_inscription))
        return diff <= 7
    }).length

    const cards = [
        {
            title: "Total Clients",
            value: safeClients.length,
            description: "Clients enregistrés",
            icon: Users,
        },
        {
            title: "Abonnements actifs",
            value: activeCount,
            description: "Abonnements en cours",
            icon: UserCheck,
        },
        {
            title: "Nouveaux clients",
            value: newClients,
            description: "Inscrits ces 7 derniers jours",
            icon: UserPlus,
        },
    ]

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
