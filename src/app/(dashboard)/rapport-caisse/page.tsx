'use client'
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getRapport, VenteRapportLigne } from "@/services/vente.service"
import { getConfigSalle, getLogoUrl } from "@/services/configSalle.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { TrendingUp, ShoppingCart, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

type Periode = 'today' | 'custom'

const PAGE_SIZE = 10

function getRange(periode: Periode, customDebut: string, customFin: string): { debut: Date; fin: Date } {
    const now = new Date()
    if (periode === 'today') {
        return {
            debut: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
            fin: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        }
    }
    return {
        debut: customDebut ? new Date(customDebut) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        fin: customFin ? new Date(customFin) : new Date(),
    }
}

function parseBackendDate(str: string): Date {
    try {
        const [datePart, timePart] = str.split(' ')
        const [dd, MM, yyyy] = datePart.split('-')
        return new Date(`${yyyy}-${MM}-${dd}T${timePart}`)
    } catch { return new Date(NaN) }
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

export default function RapportCaissePage() {
    const [periode, setPeriode] = useState<Periode>('today')
    const [customDateDebut, setCustomDateDebut] = useState('')
    const [customTimeDebut, setCustomTimeDebut] = useState('00:00')
    const [customDateFin, setCustomDateFin] = useState('')
    const [customTimeFin, setCustomTimeFin] = useState('23:59')
    const [appliedCustomDebut, setAppliedCustomDebut] = useState('')
    const [appliedCustomFin, setAppliedCustomFin] = useState('')
    const [customApplied, setCustomApplied] = useState(false)
    const [page, setPage] = useState(1)

    const effectivePeriode = periode === 'custom' && !customApplied ? 'today' : periode
    const { debut, fin } = getRange(effectivePeriode, appliedCustomDebut, appliedCustomFin)

    const queryKey = ['rapport-caisse', effectivePeriode, appliedCustomDebut, appliedCustomFin]

    const { data, isLoading, isError } = useQuery({
        queryKey,
        queryFn: () => getRapport(debut, fin),
        staleTime: 30_000,
        refetchInterval: 60_000, // rafraîchissement automatique toutes les minutes
    })

    // Ventes actives uniquement (non annulées)
    const ventes = useMemo(() => (data?.ventes ?? []).filter(v => !v.annulee), [data])
    const total = useMemo(() => ventes.reduce((s, v) => s + v.montantTotal, 0), [ventes])
    const nbVentes = ventes.length
    const panierMoyen = nbVentes > 0 ? Math.round(total / nbVentes) : 0

    // Heure de la dernière vente
    const derniereVente = ventes.length > 0 ? ventes[ventes.length - 1] : null
    const heuresDerniere = derniereVente ? (() => {
        const d = parseBackendDate(derniereVente.dateTime)
        return isNaN(d.getTime()) ? derniereVente.dateTime : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    })() : null

    // Pagination
    const totalPages = Math.max(1, Math.ceil(ventes.length / PAGE_SIZE))
    const paginatedVentes = ventes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    function handleApplyCustom() {
        setAppliedCustomDebut(customDateDebut && customTimeDebut ? `${customDateDebut}T${customTimeDebut}:00` : '')
        setAppliedCustomFin(customDateFin && customTimeFin ? `${customDateFin}T${customTimeFin}:59` : '')
        setCustomApplied(true)
        setPage(1)
    }

    const { data: config } = useQuery({
        queryKey: ['configSalle'],
        queryFn: getConfigSalle,
        staleTime: 5 * 60 * 1000,
    })
    const nomSalle = config?.nom ?? 'TerangaGym'
    const adresse = config?.adresse ?? null
    const logoUrl = config?.hasLogo ? getLogoUrl() : null

    const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Mon rapport</h1>
                    <p className="text-muted-foreground text-sm mt-0.5 capitalize">{todayLabel}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Mis à jour en direct
                    </div>
                    <div className="flex items-center gap-2">
                        {logoUrl && (
                            <Image src={logoUrl} alt={nomSalle} width={36} height={36} className="rounded object-contain" unoptimized />
                        )}
                        <div className="text-right">
                            <p className="font-semibold text-sm">{nomSalle}</p>
                            {adresse && <p className="text-xs text-muted-foreground">{adresse}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Période selector */}
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap gap-2 items-end">
                        <Button
                            variant={periode === 'today' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setPeriode('today'); setCustomApplied(false); setPage(1) }}
                        >
                            Aujourd'hui
                        </Button>
                        <Button
                            variant={periode === 'custom' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriode('custom')}
                        >
                            Intervalle personnalisé
                        </Button>

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Recettes</p>
                                <p className="text-3xl font-bold mt-1">
                                    {isLoading ? '—' : total.toLocaleString('fr-FR')}
                                </p>
                                <p className="text-sm text-muted-foreground">FCFA</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ventes effectuées</p>
                                <p className="text-3xl font-bold mt-1">{isLoading ? '—' : nbVentes}</p>
                                <p className="text-sm text-muted-foreground">
                                    Panier moy. {panierMoyen.toLocaleString('fr-FR')} FCFA
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <ShoppingCart className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Dernière vente</p>
                                <p className="text-3xl font-bold mt-1">
                                    {isLoading ? '—' : (heuresDerniere ?? '—')}
                                </p>
                                <p className="text-sm text-muted-foreground truncate max-w-[140px]">
                                    {derniereVente?.produitLibelle ?? 'Aucune vente'}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau des ventes */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Détail des ventes</CardTitle>
                    <span className="text-xs text-muted-foreground">{nbVentes} vente(s)</span>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>
                    ) : isError ? (
                        <div className="h-32 flex items-center justify-center text-destructive text-sm">Erreur de chargement</div>
                    ) : ventes.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center gap-2">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-muted-foreground text-sm">Aucune vente sur cette période</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Heure</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Article</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qté</th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedVentes.map((v, i) => {
                                            const d = parseBackendDate(v.dateTime)
                                            const heure = isNaN(d.getTime())
                                                ? v.dateTime
                                                : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                            return (
                                                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 text-muted-foreground text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                                    <td className="px-4 py-3 font-mono text-xs font-medium">{heure}</td>
                                                    <td className="px-4 py-3">
                                                        {v.nomClient ?? <span className="text-muted-foreground text-xs italic">Anonyme</span>}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[160px] truncate">{v.produitLibelle}</td>
                                                    <td className="px-4 py-3">{typeBadge(v.typeProduit)}</td>
                                                    <td className="px-4 py-3">{v.quantite}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        {v.montantTotal.toLocaleString('fr-FR')}
                                                        <span className="text-xs font-normal text-muted-foreground ml-1">FCFA</span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    {/* Total en pied de tableau */}
                                    <tfoot>
                                        <tr className="bg-muted/40 border-t-2">
                                            <td colSpan={6} className="px-4 py-3 font-semibold text-sm">Total</td>
                                            <td className="px-4 py-3 text-right font-bold text-base text-primary">
                                                {total.toLocaleString('fr-FR')}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">FCFA</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t">
                                    <span className="text-xs text-muted-foreground">
                                        Page {page} / {totalPages}
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
    )
}
