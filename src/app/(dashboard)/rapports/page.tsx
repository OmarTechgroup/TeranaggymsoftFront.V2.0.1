'use client'
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getRapport, annulerVente, VenteRapportLigne } from "@/services/vente.service"
import { getConfigSalle, getLogoUrl } from "@/services/configSalle.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, ShoppingCart, Users, BarChart2, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

type Periode = 'today' | 'week' | 'month' | 'custom'

const PAGE_SIZE = 10

function getRange(periode: Periode, customDebut: string, customFin: string): { debut: Date; fin: Date } {
    const now = new Date()
    if (periode === 'today') {
        const debut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        return { debut, fin }
    }
    if (periode === 'week') {
        const day = now.getDay() === 0 ? 6 : now.getDay() - 1
        const debut = new Date(now); debut.setDate(now.getDate() - day); debut.setHours(0, 0, 0, 0)
        const fin = new Date(now); fin.setHours(23, 59, 59, 999)
        return { debut, fin }
    }
    if (periode === 'month') {
        const debut = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        return { debut, fin }
    }
    return {
        debut: customDebut ? new Date(customDebut) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        fin: customFin ? new Date(customFin) : new Date(),
    }
}

function typeBadge(type: string | null) {
    if (!type) return <span className="text-muted-foreground text-xs">—</span>
    const map: Record<string, string> = {
        ABONNEMENT: 'bg-primary/10 text-primary border-primary/20',
        SEANCE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        PRODUIT: 'bg-amber-100 text-amber-700 border-amber-200',
    }
    const labels: Record<string, string> = { ABONNEMENT: 'Abonnement', SEANCE: 'Séance', PRODUIT: 'Produit' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[type] ?? ''}`}>{labels[type] ?? type}</span>
}

function parseBackendDate(str: string): Date {
    try {
        const [datePart, timePart] = str.split(' ')
        const [dd, MM, yyyy] = datePart.split('-')
        return new Date(`${yyyy}-${MM}-${dd}T${timePart}`)
    } catch { return new Date(NaN) }
}

// ---- Modal confirmation d'annulation ----
function ModalAnnulation({
    vente,
    onConfirm,
    onClose,
    loading,
}: {
    vente: VenteRapportLigne
    onConfirm: () => void
    onClose: () => void
    loading: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-base">Annuler cette vente ?</h2>
                            <p className="text-xs text-muted-foreground">Cette action est irréversible</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Détails de la vente */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Référence</span>
                        <span className="font-mono font-medium">#{vente.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span>{vente.dateTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Client</span>
                        <span>{vente.nomClient ?? <span className="italic text-muted-foreground">vente directe</span>}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Article</span>
                        <span className="font-medium max-w-[180px] text-right truncate">{vente.produitLibelle}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-1">
                        <span className="text-muted-foreground">Montant</span>
                        <span className="font-bold text-base">{vente.montantTotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                </div>

                {/* Avertissement abonnement */}
                {vente.typeProduit === 'ABONNEMENT' && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-sm text-amber-800">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>
                            Cette vente est liée à un <strong>abonnement</strong>.
                            L'abonnement du client sera également <strong>désactivé</strong>.
                        </span>
                    </div>
                )}

                {/* Note */}
                <p className="text-xs text-muted-foreground mb-5">
                    La vente ne sera pas supprimée de la base de données, elle sera marquée comme annulée et resteront visible dans le rapport avec un badge <span className="font-medium text-destructive">Annulée</span>.
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                        Retour
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
                        {loading ? "Annulation…" : "Confirmer l'annulation"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ---- Page principale ----
export default function RapportsPage() {
    const queryClient = useQueryClient()
    const [periode, setPeriode] = useState<Periode>('today')
    const [customDateDebut, setCustomDateDebut] = useState('')
    const [customTimeDebut, setCustomTimeDebut] = useState('00:00')
    const [customDateFin, setCustomDateFin] = useState('')
    const [customTimeFin, setCustomTimeFin] = useState('23:59')
    const [appliedCustomDebut, setAppliedCustomDebut] = useState('')
    const [appliedCustomFin, setAppliedCustomFin] = useState('')
    const [customApplied, setCustomApplied] = useState(false)
    const [page, setPage] = useState(1)
    const [venteAConfirmer, setVenteAConfirmer] = useState<VenteRapportLigne | null>(null)

    const effectivePeriode = periode === 'custom' && !customApplied ? 'today' : periode
    const { debut, fin } = getRange(effectivePeriode, appliedCustomDebut, appliedCustomFin)

    const queryKey = ['rapport', effectivePeriode, appliedCustomDebut, appliedCustomFin]

    const { data, isLoading, isError } = useQuery({
        queryKey,
        queryFn: () => getRapport(debut, fin),
        staleTime: 30_000,
    })

    const { data: config } = useQuery({
        queryKey: ['configSalle'],
        queryFn: getConfigSalle,
        staleTime: 5 * 60 * 1000,
    })
    const nomSalle = config?.nom ?? 'TerangaGym'
    const adresse = config?.adresse ?? null
    const logoUrl = config?.hasLogo ? getLogoUrl() : null

    const { mutate: doAnnuler, isPending: annulationLoading } = useMutation({
        mutationFn: (venteId: number) => annulerVente(venteId),
        onSuccess: () => {
            toast.success("Vente annulée avec succès")
            setVenteAConfirmer(null)
            queryClient.invalidateQueries({ queryKey })
        },
        onError: (e: Error) => {
            toast.error(e.message ?? "Erreur lors de l'annulation")
        },
    })

    const ventes = data?.ventes ?? []
    const total = data?.total ?? 0

    // KPIs (on exclut les ventes annulées du CA)
    const ventesActives = useMemo(() => ventes.filter(v => !v.annulee), [ventes])
    const nbVentes = ventesActives.length
    const totalActif = useMemo(() => ventesActives.reduce((s, v) => s + v.montantTotal, 0), [ventesActives])
    const clientsServis = useMemo(() => new Set(ventesActives.map(v => v.nomClient).filter(Boolean)).size, [ventesActives])
    const panierMoyen = nbVentes > 0 ? Math.round(totalActif / nbVentes) : 0

    // Bar chart par heure (ventes actives uniquement)
    const chartData = useMemo(() => {
        const byHour: Record<number, number> = {}
        for (let h = 6; h <= 23; h++) byHour[h] = 0
        ventesActives.forEach(v => {
            const d = parseBackendDate(v.dateTime)
            if (!isNaN(d.getTime())) byHour[d.getHours()] = (byHour[d.getHours()] ?? 0) + v.montantTotal
        })
        return Array.from({ length: 18 }, (_, i) => {
            const h = i + 6
            return { heure: `${String(h).padStart(2, '0')}h`, montant: byHour[h] ?? 0 }
        })
    }, [ventesActives])

    // Pagination (toutes ventes, y compris annulées — visibles avec badge)
    const totalPages = Math.max(1, Math.ceil(ventes.length / PAGE_SIZE))
    const paginatedVentes = ventes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    function handleApplyCustom() {
        setAppliedCustomDebut(customDateDebut && customTimeDebut ? `${customDateDebut}T${customTimeDebut}:00` : '')
        setAppliedCustomFin(customDateFin && customTimeFin ? `${customDateFin}T${customTimeFin}:59` : '')
        setCustomApplied(true)
        setPage(1)
    }

    function handlePeriodeChange(p: Periode) {
        setPeriode(p)
        setCustomApplied(false)
        setPage(1)
    }

    return (
        <>
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Rapports de ventes</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Analyse des performances sur la période sélectionnée</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {logoUrl && (
                            <Image src={logoUrl} alt={nomSalle} width={40} height={40} className="rounded object-contain" unoptimized />
                        )}
                        <div className="text-right">
                            <p className="font-semibold text-sm">{nomSalle}</p>
                            {adresse && <p className="text-xs text-muted-foreground">{adresse}</p>}
                        </div>
                    </div>
                </div>

                {/* Période selector */}
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap gap-2 items-end">
                            {([
                                { key: 'today', label: "Aujourd'hui" },
                                { key: 'week', label: 'Cette semaine' },
                                { key: 'month', label: 'Ce mois' },
                                { key: 'custom', label: 'Personnalisée' },
                            ] as { key: Periode; label: string }[]).map(p => (
                                <Button
                                    key={p.key}
                                    variant={periode === p.key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePeriodeChange(p.key)}
                                >
                                    {p.label}
                                </Button>
                            ))}

                            {periode === 'custom' && (
                                <div className="flex flex-wrap gap-3 items-end ml-2 border rounded-lg p-3 bg-muted/30">
                                    {/* Début */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted-foreground font-medium">Date début</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="date"
                                                value={customDateDebut}
                                                onChange={e => setCustomDateDebut(e.target.value)}
                                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                            />
                                            <input
                                                type="time"
                                                value={customTimeDebut}
                                                onChange={e => setCustomTimeDebut(e.target.value)}
                                                className="h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    {/* Fin */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted-foreground font-medium">Date fin</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="date"
                                                value={customDateFin}
                                                onChange={e => setCustomDateFin(e.target.value)}
                                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                            />
                                            <input
                                                type="time"
                                                value={customTimeFin}
                                                onChange={e => setCustomTimeFin(e.target.value)}
                                                className="h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={handleApplyCustom} disabled={!customDateDebut || !customDateFin}>
                                        Appliquer
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Chiffre d'affaires</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {isLoading ? '—' : totalActif.toLocaleString('fr-FR')}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">FCFA</span>
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ventes</p>
                                    <p className="text-2xl font-bold mt-1">{isLoading ? '—' : nbVentes}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Clients servis</p>
                                    <p className="text-2xl font-bold mt-1">{isLoading ? '—' : clientsServis}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Panier moyen</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {isLoading ? '—' : panierMoyen.toLocaleString('fr-FR')}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">FCFA</span>
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <BarChart2 className="h-5 w-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bar chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Ventes par heure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="heure" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Montant']}
                                        labelFormatter={l => `Heure : ${l}`}
                                    />
                                    <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Détail des ventes</CardTitle>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{ventes.length} vente(s)</span>
                            {ventes.some(v => v.annulee) && (
                                <span className="text-xs text-destructive/70 bg-destructive/10 px-2 py-0.5 rounded">
                                    {ventes.filter(v => v.annulee).length} annulée(s)
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>
                        ) : isError ? (
                            <div className="h-32 flex items-center justify-center text-destructive text-sm">Erreur de chargement</div>
                        ) : ventes.length === 0 ? (
                            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Aucune vente sur cette période</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Heure</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produit</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qté</th>
                                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Caissier</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedVentes.map((v, i) => {
                                                const d = parseBackendDate(v.dateTime)
                                                const heure = isNaN(d.getTime()) ? v.dateTime : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                                return (
                                                    <tr
                                                        key={v.id}
                                                        className={`border-b last:border-0 transition-colors ${v.annulee ? 'bg-destructive/5 opacity-70' : 'hover:bg-muted/30'}`}
                                                    >
                                                        <td className="px-4 py-3 text-muted-foreground text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                                        <td className="px-4 py-3 font-mono text-xs">{heure}</td>
                                                        <td className="px-4 py-3">{v.nomClient ?? <span className="text-muted-foreground text-xs italic">Anonyme</span>}</td>
                                                        <td className={`px-4 py-3 max-w-[160px] truncate ${v.annulee ? 'line-through text-muted-foreground' : ''}`}>{v.produitLibelle}</td>
                                                        <td className="px-4 py-3">{typeBadge(v.typeProduit)}</td>
                                                        <td className="px-4 py-3">{v.quantite}</td>
                                                        <td className={`px-4 py-3 text-right font-semibold ${v.annulee ? 'line-through text-muted-foreground' : ''}`}>
                                                            {v.montantTotal.toLocaleString('fr-FR')}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">{v.users}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {v.annulee ? (
                                                                <span
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"
                                                                    title={`Annulée le ${v.dateAnnulation ?? ''} par ${v.annulePar ?? ''}`}
                                                                >
                                                                    Annulée
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setVenteAConfirmer(v)}
                                                                >
                                                                    Annuler
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t">
                                        <span className="text-xs text-muted-foreground">
                                            Page {page} / {totalPages} — {ventes.length} résultats
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline" size="icon" className="h-8 w-8"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let p = page - 2 + i
                                                if (p < 1) p += (1 - (page - 2))
                                                if (p > totalPages) return null
                                                return (
                                                    <Button
                                                        key={p}
                                                        variant={p === page ? 'default' : 'outline'}
                                                        size="icon"
                                                        className="h-8 w-8 text-xs"
                                                        onClick={() => setPage(p)}
                                                    >
                                                        {p}
                                                    </Button>
                                                )
                                            })}
                                            <Button
                                                variant="outline" size="icon" className="h-8 w-8"
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal de confirmation d'annulation */}
            {venteAConfirmer && (
                <ModalAnnulation
                    vente={venteAConfirmer}
                    onConfirm={() => doAnnuler(venteAConfirmer.id)}
                    onClose={() => setVenteAConfirmer(null)}
                    loading={annulationLoading}
                />
            )}
        </>
    )
}
