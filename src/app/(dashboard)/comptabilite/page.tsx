'use client'
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getBilanMensuel, getBilanAnnuel,
    getDepenses, createDepense, updateDepense, deleteDepense,
    BilanMensuel, Depense, DepenseRequest, DepenseCategorie, CATEGORIE_LABELS
} from "@/services/comptabilite.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { toast } from "sonner"
import {
    TrendingUp, TrendingDown, DollarSign, BarChart2,
    Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight
} from "lucide-react"
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector
} from "recharts"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MOIS_LABELS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const MOIS_COURT = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function fcfa(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

const CATEGORIES: DepenseCategorie[] = ['LOYER', 'ELECTRICITE', 'EAU', 'MAINTENANCE', 'FOURNITURES', 'MARKETING', 'AUTRE']

const CATEGORIE_COLOR: Record<DepenseCategorie, string> = {
    LOYER: '#6366f1',
    ELECTRICITE: '#f59e0b',
    EAU: '#3b82f6',
    MAINTENANCE: '#ef4444',
    FOURNITURES: '#8b5cf6',
    MARKETING: '#10b981',
    AUTRE: '#6b7280',
}

// ─── Modal Dépense ────────────────────────────────────────────────────────────
function ModalDepense({ depense, onClose, onSuccess }: {
    depense: Depense | null; onClose: () => void; onSuccess: () => void
}) {
    const isEdit = !!depense
    const [form, setForm] = useState<DepenseRequest>({
        categorie: depense?.categorie ?? 'AUTRE',
        description: depense?.description ?? '',
        montant: depense?.montant ?? 0,
        dateDepense: depense?.dateDepense ?? new Date().toISOString().split('T')[0],
    })
    const [loading, setLoading] = useState(false)

    const set = (k: keyof DepenseRequest, v: string | number) =>
        setForm(f => ({ ...f, [k]: v }))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.description.trim()) { toast.error("Description requise"); return }
        if (!form.montant || form.montant <= 0) { toast.error("Montant invalide"); return }
        setLoading(true)
        try {
            if (isEdit) {
                await updateDepense(depense!.id, form)
                toast.success("Dépense modifiée")
            } else {
                await createDepense(form)
                toast.success("Dépense ajoutée")
            }
            onSuccess()
            onClose()
        } catch {
            toast.error("Erreur lors de l'enregistrement")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Catégorie</Label>
                        <select
                            className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                            value={form.categorie}
                            onChange={e => set('categorie', e.target.value as DepenseCategorie)}
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input value={form.description} onChange={e => set('description', e.target.value)}
                            placeholder="Ex: Loyer mois d'avril" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Montant (FCFA)</Label>
                            <Input type="number" min={1} value={form.montant}
                                onChange={e => set('montant', Number(e.target.value))} className="mt-1" />
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input type="date" value={form.dateDepense}
                                onChange={e => set('dateDepense', e.target.value)} className="mt-1" />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Enregistrement…" : isEdit ? "Modifier" : "Ajouter"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Modal Suppression ────────────────────────────────────────────────────────
function ModalSupprimer({ depense, onClose, onSuccess }: {
    depense: Depense; onClose: () => void; onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    async function handleDelete() {
        setLoading(true)
        try {
            await deleteDepense(depense.id)
            toast.success("Dépense supprimée")
            onSuccess()
            onClose()
        } catch {
            toast.error("Erreur lors de la suppression")
        } finally {
            setLoading(false)
        }
    }
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Supprimer la dépense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Confirmer la suppression</p>
                            <p className="text-sm text-red-600 mt-1">
                                {CATEGORIE_LABELS[depense.categorie]} — {depense.description} ({fcfa(depense.montant)})
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Suppression…" : "Supprimer"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Tooltip personnalisé pour le graphique annuel ────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-background border rounded-lg p-3 shadow-lg text-xs space-y-1 min-w-[160px]">
            <p className="font-semibold text-sm mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="font-medium">{new Intl.NumberFormat('fr-FR').format(p.value)}</span>
                </div>
            ))}
        </div>
    )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color }: {
    title: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                    </div>
                    <div className={`p-2.5 rounded-full ${color}`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ComptabilitePage() {
    const now = new Date()
    const [mois, setMois] = useState(now.getMonth() + 1)
    const [annee, setAnnee] = useState(now.getFullYear())
    const [anneeAnnuel, setAnneeAnnuel] = useState(now.getFullYear())
    const [activeTab, setActiveTab] = useState<'mensuel' | 'annuel' | 'depenses'>('mensuel')
    const [modalDepense, setModalDepense] = useState<'new' | Depense | null>(null)
    const [modalSupprimer, setModalSupprimer] = useState<Depense | null>(null)

    const qc = useQueryClient()

    const { data: bilan, isLoading: bilanLoading } = useQuery({
        queryKey: ['bilan-mensuel', mois, annee],
        queryFn: () => getBilanMensuel(mois, annee),
    })

    const { data: bilanAnnuel } = useQuery({
        queryKey: ['bilan-annuel', anneeAnnuel],
        queryFn: () => getBilanAnnuel(anneeAnnuel),
    })

    const { data: depenses = [] } = useQuery({
        queryKey: ['depenses', mois, annee],
        queryFn: () => getDepenses(mois, annee),
    })

    function invalidate() {
        qc.invalidateQueries({ queryKey: ['depenses', mois, annee] })
        qc.invalidateQueries({ queryKey: ['bilan-mensuel', mois, annee] })
        qc.invalidateQueries({ queryKey: ['bilan-annuel', anneeAnnuel] })
    }

    // Navigation mois
    function prevMois() {
        if (mois === 1) { setMois(12); setAnnee(a => a - 1) }
        else setMois(m => m - 1)
    }
    function nextMois() {
        if (mois === 12) { setMois(1); setAnnee(a => a + 1) }
        else setMois(m => m + 1)
    }

    // Données graphique annuel
    const chartData = useMemo(() =>
        (bilanAnnuel ?? []).map(b => ({
            name: MOIS_COURT[b.mois],
            Recettes: b.recettesTotales,
            Charges: b.totalCharges,
            Bénéfice: b.beneficeNet,
        })),
        [bilanAnnuel]
    )

    // Données camembert recettes
    const recettesData = bilan ? [
        { name: 'Abonnements', value: bilan.recettesAbonnements, fill: '#10b981' },
        { name: 'Séances', value: bilan.recettesSeances, fill: '#3b82f6' },
        { name: 'Produits', value: bilan.recettesProduits, fill: '#8b5cf6' },
    ].filter(d => d.value > 0) : []

    // Données camembert charges
    const chargesData = bilan ? [
        { name: 'Salaires', value: bilan.salairesDecaisses, fill: '#f59e0b' },
        { name: 'Dép. diverses', value: bilan.depensesDiverses, fill: '#ef4444' },
    ].filter(d => d.value > 0) : []

    const tabs = [
        { key: 'mensuel', label: 'Bilan du mois' },
        { key: 'annuel', label: 'Vue annuelle' },
        { key: 'depenses', label: 'Dépenses diverses' },
    ] as const

    return (
        <div className="p-6 space-y-6">
            {/* ─── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Comptabilité</h1>
                    <p className="text-sm text-muted-foreground">Recettes, charges et résultat de la salle</p>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <button onClick={prevMois} className="p-1 hover:bg-background rounded">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-medium text-sm min-w-[130px] text-center">
                        {MOIS_LABELS[mois]} {annee}
                    </span>
                    <button onClick={nextMois} className="p-1 hover:bg-background rounded">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ─── KPI Cards ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Recettes du mois"
                    value={fcfa(bilan?.recettesTotales ?? 0)}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <KpiCard
                    title="Charges totales"
                    value={fcfa(bilan?.totalCharges ?? 0)}
                    sub={`Salaires: ${fcfa(bilan?.salairesDecaisses ?? 0)}`}
                    icon={TrendingDown}
                    color="bg-red-500"
                />
                <KpiCard
                    title="Bénéfice net"
                    value={fcfa(bilan?.beneficeNet ?? 0)}
                    sub={(bilan?.beneficeNet ?? 0) >= 0 ? "Positif ✓" : "Déficit ⚠"}
                    icon={DollarSign}
                    color={(bilan?.beneficeNet ?? 0) >= 0 ? "bg-blue-500" : "bg-orange-500"}
                />
                <KpiCard
                    title="Taux de marge"
                    value={`${bilan?.tauxMarge ?? 0} %`}
                    sub="Bénéfice / Recettes"
                    icon={BarChart2}
                    color="bg-violet-500"
                />
            </div>

            {/* ─── Tabs ─────────────────────────────────────────────────── */}
            <div className="border-b">
                <div className="flex gap-1">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Tab: Bilan mensuel ───────────────────────────────────── */}
            {activeTab === 'mensuel' && (
                <div className="space-y-6">
                    {bilanLoading ? (
                        <p className="text-muted-foreground text-sm">Chargement…</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Répartition des recettes */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Répartition des recettes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recettesData.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-8 text-center">Aucune recette ce mois</p>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            <ResponsiveContainer width={160} height={160}>
                                                <PieChart>
                                                    <Pie data={recettesData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                                                        {recettesData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(v: number) => fcfa(v)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-3 flex-1">
                                                {recettesData.map(d => (
                                                    <div key={d.name}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.fill }} />
                                                                {d.name}
                                                            </span>
                                                            <span className="font-medium">{fcfa(d.value)}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${bilan!.recettesTotales > 0 ? (d.value / bilan!.recettesTotales * 100) : 0}%`,
                                                                    background: d.fill
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Répartition des charges */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Répartition des charges</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {chargesData.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-8 text-center">Aucune charge ce mois</p>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            <ResponsiveContainer width={160} height={160}>
                                                <PieChart>
                                                    <Pie data={chargesData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                                                        {chargesData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(v: number) => fcfa(v)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-3 flex-1">
                                                {chargesData.map(d => (
                                                    <div key={d.name}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.fill }} />
                                                                {d.name}
                                                            </span>
                                                            <span className="font-medium">{fcfa(d.value)}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${bilan!.totalCharges > 0 ? (d.value / bilan!.totalCharges * 100) : 0}%`,
                                                                    background: d.fill
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tableau récapitulatif */}
                            <Card className="lg:col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Compte de résultat — {MOIS_LABELS[mois]} {annee}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y">
                                            <tr className="bg-emerald-50">
                                                <td className="py-2.5 px-3 font-semibold text-emerald-700">Recettes totales</td>
                                                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{fcfa(bilan?.recettesTotales ?? 0)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3 pl-8 text-muted-foreground">dont Abonnements</td>
                                                <td className="py-2 px-3 text-right">{fcfa(bilan?.recettesAbonnements ?? 0)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3 pl-8 text-muted-foreground">dont Séances</td>
                                                <td className="py-2 px-3 text-right">{fcfa(bilan?.recettesSeances ?? 0)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3 pl-8 text-muted-foreground">dont Produits</td>
                                                <td className="py-2 px-3 text-right">{fcfa(bilan?.recettesProduits ?? 0)}</td>
                                            </tr>
                                            <tr className="bg-red-50">
                                                <td className="py-2.5 px-3 font-semibold text-red-700">Total charges</td>
                                                <td className="py-2.5 px-3 text-right font-bold text-red-700">— {fcfa(bilan?.totalCharges ?? 0)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3 pl-8 text-muted-foreground">Masse salariale décaissée</td>
                                                <td className="py-2 px-3 text-right">— {fcfa(bilan?.salairesDecaisses ?? 0)}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3 pl-8 text-muted-foreground">Dépenses diverses</td>
                                                <td className="py-2 px-3 text-right">— {fcfa(bilan?.depensesDiverses ?? 0)}</td>
                                            </tr>
                                            <tr className={(bilan?.beneficeNet ?? 0) >= 0 ? "bg-blue-50" : "bg-orange-50"}>
                                                <td className={`py-3 px-3 font-bold text-base ${(bilan?.beneficeNet ?? 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                                    {(bilan?.beneficeNet ?? 0) >= 0 ? "Bénéfice net" : "Déficit net"}
                                                </td>
                                                <td className={`py-3 px-3 text-right font-bold text-base ${(bilan?.beneficeNet ?? 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                                    {fcfa(bilan?.beneficeNet ?? 0)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Tab: Vue annuelle ────────────────────────────────────── */}
            {activeTab === 'annuel' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Label>Année</Label>
                        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                            <button onClick={() => setAnneeAnnuel(a => a - 1)} className="p-1 hover:bg-background rounded">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <span className="font-medium text-sm w-12 text-center">{anneeAnnuel}</span>
                            <button onClick={() => setAnneeAnnuel(a => a + 1)} className="p-1 hover:bg-background rounded">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Évolution annuelle {anneeAnnuel}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="Recettes" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
                                    <Bar dataKey="Charges" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} />
                                    <Line dataKey="Bénéfice" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} type="monotone" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Tableau mensuel */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Détail mensuel {anneeAnnuel}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                            <th className="text-left px-4 py-3">Mois</th>
                                            <th className="text-right px-4 py-3">Recettes</th>
                                            <th className="text-right px-4 py-3">Salaires</th>
                                            <th className="text-right px-4 py-3">Dép. diverses</th>
                                            <th className="text-right px-4 py-3">Total charges</th>
                                            <th className="text-right px-4 py-3">Bénéfice net</th>
                                            <th className="text-right px-4 py-3">Marge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {(bilanAnnuel ?? []).map(b => (
                                            <tr key={b.mois} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-2.5 font-medium">{MOIS_LABELS[b.mois]}</td>
                                                <td className="px-4 py-2.5 text-right text-emerald-700 font-medium">{fcfa(b.recettesTotales)}</td>
                                                <td className="px-4 py-2.5 text-right text-amber-600">{fcfa(b.salairesDecaisses)}</td>
                                                <td className="px-4 py-2.5 text-right text-red-500">{fcfa(b.depensesDiverses)}</td>
                                                <td className="px-4 py-2.5 text-right font-medium">{fcfa(b.totalCharges)}</td>
                                                <td className={`px-4 py-2.5 text-right font-bold ${b.beneficeNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                    {fcfa(b.beneficeNet)}
                                                </td>
                                                <td className={`px-4 py-2.5 text-right font-medium ${b.tauxMarge >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                    {b.tauxMarge} %
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 bg-muted/30 font-bold text-sm">
                                            <td className="px-4 py-3">Total {anneeAnnuel}</td>
                                            <td className="px-4 py-3 text-right text-emerald-700">
                                                {fcfa((bilanAnnuel ?? []).reduce((s, b) => s + b.recettesTotales, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right text-amber-600">
                                                {fcfa((bilanAnnuel ?? []).reduce((s, b) => s + b.salairesDecaisses, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-500">
                                                {fcfa((bilanAnnuel ?? []).reduce((s, b) => s + b.depensesDiverses, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {fcfa((bilanAnnuel ?? []).reduce((s, b) => s + b.totalCharges, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right text-blue-600">
                                                {fcfa((bilanAnnuel ?? []).reduce((s, b) => s + b.beneficeNet, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right">—</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ─── Tab: Dépenses diverses ───────────────────────────────── */}
            {activeTab === 'depenses' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Dépenses de <strong>{MOIS_LABELS[mois]} {annee}</strong>
                            {' '}— Total : <strong className="text-red-600">{fcfa(depenses.reduce((s, d) => s + d.montant, 0))}</strong>
                        </p>
                        <Button size="sm" onClick={() => setModalDepense('new')}>
                            <Plus className="h-4 w-4 mr-1" /> Nouvelle dépense
                        </Button>
                    </div>

                    {depenses.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>Aucune dépense enregistrée pour {MOIS_LABELS[mois]} {annee}</p>
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => setModalDepense('new')}>
                                    <Plus className="h-4 w-4 mr-1" /> Ajouter une dépense
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                            <th className="text-left px-4 py-3">Date</th>
                                            <th className="text-left px-4 py-3">Catégorie</th>
                                            <th className="text-left px-4 py-3">Description</th>
                                            <th className="text-right px-4 py-3">Montant</th>
                                            <th className="text-left px-4 py-3">Créé par</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {depenses.map(d => (
                                            <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {new Date(d.dateDepense).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                                                        style={{ background: CATEGORIE_COLOR[d.categorie] }}
                                                    >
                                                        {CATEGORIE_LABELS[d.categorie]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{d.description}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-red-600">
                                                    {fcfa(d.montant)}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{d.creePar}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8"
                                                            onClick={() => setModalDepense(d)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600"
                                                            onClick={() => setModalSupprimer(d)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 bg-muted/30">
                                            <td colSpan={3} className="px-4 py-3 font-bold">Total</td>
                                            <td className="px-4 py-3 text-right font-bold text-red-600">
                                                {fcfa(depenses.reduce((s, d) => s + d.montant, 0))}
                                            </td>
                                            <td colSpan={2} />
                                        </tr>
                                    </tfoot>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ─── Modals ───────────────────────────────────────────────── */}
            {modalDepense !== null && (
                <ModalDepense
                    depense={modalDepense === 'new' ? null : modalDepense}
                    onClose={() => setModalDepense(null)}
                    onSuccess={invalidate}
                />
            )}
            {modalSupprimer && (
                <ModalSupprimer
                    depense={modalSupprimer}
                    onClose={() => setModalSupprimer(null)}
                    onSuccess={invalidate}
                />
            )}
        </div>
    )
}
