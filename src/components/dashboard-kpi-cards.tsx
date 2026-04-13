import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Users, UserX, ShoppingCart, TrendingUp } from "lucide-react"

interface DashboardKpiCardsProps {
    totalClients: number
    totalExpirants: number
    ventesTotal: number
    ventesCount: number
}

export function DashboardKpiCards({
    totalClients,
    totalExpirants,
    ventesTotal,
    ventesCount,
}: DashboardKpiCardsProps) {
    const cards = [
        {
            title: "Total Clients",
            value: totalClients,
            description: "Clients enregistrés",
            icon: Users,
        },
        {
            title: "Expirations proches",
            value: totalExpirants,
            description: "Abonnements expirant bientôt",
            icon: UserX,
        },
        {
            title: "Ventes du jour",
            value: `${ventesTotal.toLocaleString()} FCFA`,
            description: "Chiffre d'affaires aujourd'hui",
            icon: ShoppingCart,
        },
        {
            title: "Transactions",
            value: ventesCount,
            description: "Ventes enregistrées aujourd'hui",
            icon: TrendingUp,
        },
    ]

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
