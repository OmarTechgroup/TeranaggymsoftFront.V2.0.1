'use client'
import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Client, AccesClient, getClientPhotoUrl } from "@/services/client.service"
import QRCode from "react-qr-code"
import { getAbonnementsClient } from "@/services/abonnement.service"
import { Badge } from "@/components/ui/shared/badge"
import { Card, CardContent } from "@/components/ui/shared/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shared/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shared/table"
import { Button } from "@/components/ui/shared/button"
import { ClientFormSheet } from "./client-form-sheet"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Phone, Mail, MapPin, Pencil, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface ClientDetailProps {
    client: Client
    acces: AccesClient | null
}



export function ClientDetail({ client, acces }: ClientDetailProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [photoLoaded, setPhotoLoaded] = useState(false)
    const [photoError, setPhotoError] = useState(false)
    const queryClient = useQueryClient()


    useEffect(() => {
        setPhotoLoaded(false)
        setPhotoError(false)
    }, [client.id, client.photo])

    const { data: abonnements = [], isLoading: loadingAbo } = useQuery({
        queryKey: ['abonnements', client.id],
        queryFn: () => getAbonnementsClient(client.id),
        staleTime: 5 * 60_000,
    })

    const photoUrl = getClientPhotoUrl(client.id)
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/portal?id=${client.id}&cardNumber=${client.cardNumber ?? ''}`

    // Stats calculées
    const totalDepense = abonnements.reduce((sum, a) => sum + (a.montant ?? 0), 0)
    const abosActifs = abonnements.filter(a => new Date(a.dateFin) >= new Date()).length
    const totalAchats = abonnements.length

    const router = useRouter()


    return (
        <div className="flex gap-6 max-w-6xl">

            {/* Colonne gauche — Photo + QR */}
            <div className="flex flex-col items-center gap-4 w-48 shrink-0">
                <div className="relative">
                    <div className="h-36 w-36 rounded-full border-2 border-primary bg-muted flex items-center justify-center overflow-hidden">
                        {!photoError && (
                            <img
                                src={photoUrl}
                                alt={client.nom}
                                className="h-full w-full object-cover"
                                onLoad={() => setPhotoLoaded(true)}
                                onError={() => setPhotoError(true)}
                            />
                        )}
                        {(!photoLoaded || photoError) && (
                            <User className="h-16 w-16 text-muted-foreground absolute" />
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 w-full">
                    <span className="text-sm font-medium text-muted-foreground">QR Code Client</span>
                    <div className="border rounded-lg p-2 bg-white">
                        <QRCode
                            value={portalUrl}
                            size={130}
                        />
                    </div>

                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setEditOpen(true)}
                >
                    <Pencil className="h-3 w-3 mr-1" /> Modifier
                </Button>
            </div>

            {/* Colonne droite */}
            <div className="flex-1 space-y-4">

                {/* Header — Nom + statut */}
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold uppercase">{client.nom}</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Membre depuis le {client.date_inscription
                                        ? format(new Date(client.date_inscription), "dd MMMM yyyy", { locale: fr })
                                        : "—"}
                                </p>
                            </div>
                            {abosActifs > 0 ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white">ACTIF</Badge>
                            ) : (
                                <Badge variant="destructive">EXPIRÉ</Badge>
                            )}
                        </div>

                        {/* Infos contact */}
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                            <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Téléphone</p>
                                    <p className="text-sm font-medium">{client.telephone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Email</p>
                                    <p className="text-sm font-medium">{client.email ?? "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Adresse</p>
                                    <p className="text-sm font-medium">{client.address ?? "—"}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                    <CardContent className="py-4">
                        <div className="grid grid-cols-3 divide-x text-center">
                            <div className="px-4">
                                <p className="text-2xl font-bold">{totalDepense.toLocaleString()} <span className="text-base font-normal">FCFA</span></p>
                                <p className="text-xs text-muted-foreground mt-1">Total Dépensé</p>
                            </div>
                            <div className="px-4">
                                <p className="text-2xl font-bold">{totalAchats}</p>
                                <p className="text-xs text-muted-foreground mt-1">Achats</p>
                            </div>
                            <div className="px-4">
                                <p className="text-2xl font-bold">{abosActifs}</p>
                                <p className="text-xs text-muted-foreground mt-1">Abonnements Actifs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="abonnements">
                    <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
                        <TabsTrigger
                            value="abonnements"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
                        >
                            Abonnements ({abonnements.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="ventes"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
                        >
                            Historique des Ventes (0)
                        </TabsTrigger>
                    </TabsList>

                    {/* Abonnements */}
                    <TabsContent value="abonnements">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">Liste des Abonnements</h3>

                                </div>

                                {loadingAbo ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
                                ) : abonnements.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                                        <p className="text-sm">Ce client n'a aucun abonnement.</p>
                                        <Button size="sm" onClick={() => router.push("/caisse")}>
                                            Créer le premier abonnement
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Début</TableHead>
                                                <TableHead>Fin</TableHead>
                                                <TableHead>Montant</TableHead>
                                                <TableHead>Statut</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {abonnements.map((abo) => (
                                                <TableRow key={abo.id}>
                                                    <TableCell className="font-medium">{abo.typeAbonnement}</TableCell>
                                                    <TableCell>{abo.dateDebut ? format(new Date(abo.dateDebut), "dd/MM/yyyy") : "—"}</TableCell>
                                                    <TableCell>{abo.dateFin ? format(new Date(abo.dateFin), "dd/MM/yyyy") : "—"}</TableCell>
                                                    <TableCell>{abo.montant?.toLocaleString()} FCFA</TableCell>
                                                    <TableCell>
                                                        {new Date(abo.dateFin) >= new Date()
                                                            ? <Badge className="bg-green-500 text-white text-xs">Actif</Badge>
                                                            : <Badge variant="destructive" className="text-xs">Expiré</Badge>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ventes */}
                    <TabsContent value="ventes">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                                    <p className="text-sm">Aucun historique de ventes.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modal modification */}
            <ClientFormSheet
                open={editOpen}
                onOpenChange={setEditOpen}
                client={client}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['clients'] })
                    queryClient.invalidateQueries({ queryKey: ['client', client.id] })
                    queryClient.invalidateQueries({ queryKey: ['acces', client.id] })
                    queryClient.invalidateQueries({ queryKey: ['abonnements', client.id] })
                }}
            />
        </div>
    )
}
