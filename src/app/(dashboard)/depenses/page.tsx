'use client'
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getDepenses, createDepense, updateDepense, deleteDepense,
    Depense, DepenseRequest, DepenseCategorie, CATEGORIE_LABELS
} from "@/services/comptabilite.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { toast } from "sonner"
import {
    Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight,
    Search, Receipt, TrendingDown, Filter
} from "lucide-react"

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIES: DepenseCategorie[] = [
    'LOYER', 'ELECTRICITE', 'EAU', 'MAINTENANCE', 'FOURNITURES', 'MARKETING', 'AUTRE'
]

const MOIS_LABELS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const CATEGORIE_STYLE: Record<DepenseCategorie, { bg: string; text: string; dot: string }> = {
    LOYER:       { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: '#6366f1' },
    ELECTRICITE: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: '#f59e0b' },
    EAU:         { bg: 'bg-sky-100',     text: 'text-sky-700',     dot: '#0ea5e9' },
    MAINTENANCE: { bg: 'bg-red-100',     text: 'text-red-700',     dot: '#ef4444' },
    FOURNITURES: { bg: 'bg-violet-100',  text: 'text-violet-700',  dot: '#8b5cf6' },
    MARKETING:   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: '#10b981' },
    AUTRE:       { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: '#64748b' },
}

function fcfa(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function CategorieBadge({ cat }: { cat: DepenseCategorie }) {
    const s = CATEGORIE_STYLE[cat]
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
            {CATEGORIE_LABELS[cat]}
        </span>
    )
}

// ─── Modal Dépense (création / modification) ─────────────────────────────────
function ModalDepense({ depense, onClose, onSuccess, defaultDate }: {
    depense: Depense | null
    onClose: () => void
    onSuccess: () => void
    defaultDate: string
}) {
    const isEdit = !!depense
    const [form, setForm] = useState<DepenseRequest>({
        categorie:   depense?.categorie   ?? 'AUTRE',
        description: depense?.description ?? '',
        montant:     depense?.montant     ?? 0,
        dateDepense: depense?.dateDepense ?? defaultDate,
    })
    const [loading, setLoading] = useState(false)

    const set = (k: keyof DepenseRequest, v: string | number) =>
        setForm(f => ({ ...f, [k]: v }))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.description.trim()) { toast.error("La description est requise"); return }
        if (!form.montant || form.montant <= 0) { toast.error("Le montant doit être supérieur à 0"); return }
        if (!form.dateDepense) { toast.error("La date est requise"); return }
        setLoading(true)
        try {
            if (isEdit) {
                await updateDepense(depense!.id, form)
                toast.success("Dépense modifiée")
            } else {
                await createDepense(form)
                toast.success("Dépense enregistrée")
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
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        {isEdit ? "Modifier la dépense" : "Nouvelle dépense"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-1">
                    {/* Type de dépense */}
                    <div>
                        <Label className="text-sm font-medium">Type de dépense</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {CATEGORIES.map(cat => {
                                const s = CATEGORIE_STYLE[cat]
                                const selected = form.categorie === cat
                                return (
                                    <button
                                        key={cat} type="button"
                                        onClick={() => set('categorie', cat)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                                            selected
                                                ? `border-primary bg-primary/5 text-primary`
                                                : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
                                        {CATEGORIE_LABELS[cat]}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <Input
                            className="mt-1.5"
                            placeholder="Ex : Loyer du mois d'avril 2026"
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                        />
                    </div>

                    {/* Montant + Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-sm font-medium">Montant (FCFA)</Label>
                            <Input
                                type="number" min={1} className="mt-1.5"
                                placeholder="0"
                                value={form.montant || ''}
                                onChange={e => set('montant', Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Date</Label>
                            <Input
                                type="date" className="mt-1.5"
                                value={form.dateDepense}
                                onChange={e => set('dateDepense', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Récap avant soumission */}
                    {form.montant > 0 && form.description && (
                        <div className="p-3 rounded-lg bg-muted/50 border text-sm flex justify-between items-center">
                            <span className="text-muted-foreground truncate mr-2">{form.description}</span>
                            <span className="font-bold text-foreground shrink-0">{fcfa(form.montant)}</span>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end pt-1">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Enregistrement…" : isEdit ? "Modifier" : "Enregistrer"}
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
                <div className="space-y-4 pt-1">
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-red-800">Confirmer la suppression</p>
                            <p className="text-sm text-red-700">{depense.description}</p>
                            <p className="text-sm font-bold text-red-800">{fcfa(depense.montant)}</p>
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

// ─── Page principale ──────────────────────────────────────────────────────────
export default function DepensesPage() {
    const now = new Date()
    const [mois, setMois]   = useState(now.getMonth() + 1)
    const [annee, setAnnee] = useState(now.getFullYear())
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState<DepenseCategorie | 'TOUTES'>('TOUTES')
    const [modalForm, setModalForm]   = useState<'new' | Depense | null>(null)
    const [modalDel, setModalDel]     = useState<Depense | null>(null)

    const qc = useQueryClient()

    const { data: depenses = [], isLoading } = useQuery({
        queryKey: ['depenses', mois, annee],
        queryFn: () => getDepenses(mois, annee),
    })

    function invalidate() {
        qc.invalidateQueries({ queryKey: ['depenses', mois, annee] })
        qc.invalidateQueries({ queryKey: ['bilan-mensuel'] })
    }

    function prevMois() {
        if (mois === 1) { setMois(12); setAnnee(a => a - 1) }
        else setMois(m => m - 1)
    }
    function nextMois() {
        if (mois === 12) { setMois(1); setAnnee(a => a + 1) }
        else setMois(m => m + 1)
    }

    // Filtres
    const filtered = useMemo(() => depenses.filter(d => {
        const matchSearch = d.description.toLowerCase().includes(search.toLowerCase()) ||
            CATEGORIE_LABELS[d.categorie].toLowerCase().includes(search.toLowerCase())
        const matchCat = filterCat === 'TOUTES' || d.categorie === filterCat
        return matchSearch && matchCat
    }), [depenses, search, filterCat])

    // Stats par catégorie
    const statsCat = useMemo(() => {
        const map: Partial<Record<DepenseCategorie, number>> = {}
        depenses.forEach(d => { map[d.categorie] = (map[d.categorie] ?? 0) + d.montant })
        return map
    }, [depenses])

    const total = depenses.reduce((s, d) => s + d.montant, 0)
    const totalFiltre = filtered.reduce((s, d) => s + d.montant, 0)

    const defaultDate = `${annee}-${String(mois).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    return (
        <div className="p-6 space-y-6">
            {/* ─── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingDown className="h-6 w-6 text-red-500" />
                        Dépenses
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Enregistrement et suivi des dépenses de la salle
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Navigation mois */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1.5">
                        <button onClick={prevMois} className="p-1 hover:bg-background rounded transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="font-medium text-sm min-w-[130px] text-center">
                            {MOIS_LABELS[mois]} {annee}
                        </span>
                        <button onClick={nextMois} className="p-1 hover:bg-background rounded transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <Button onClick={() => setModalForm('new')} className="flex items-center gap-2 shrink-0">
                        <Plus className="h-4 w-4" /> Nouvelle dépense
                    </Button>
                </div>
            </div>

            {/* ─── KPI Cards ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="lg:col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-medium">Total du mois</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{fcfa(total)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{depenses.length} dépense{depenses.length > 1 ? 's' : ''}</p>
                    </CardContent>
                </Card>
                {CATEGORIES.slice(0, 3).map(cat => (
                    <Card key={cat}>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground font-medium">{CATEGORIE_LABELS[cat]}</p>
                            <p className="text-lg font-bold mt-1">{fcfa(statsCat[cat] ?? 0)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {total > 0 ? Math.round((statsCat[cat] ?? 0) / total * 100) : 0} % du total
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ─── Filtres par catégorie ────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterCat('TOUTES')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        filterCat === 'TOUTES'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-muted-foreground hover:border-foreground'
                    }`}
                >
                    Toutes ({depenses.length})
                </button>
                {CATEGORIES.filter(cat => (statsCat[cat] ?? 0) > 0).map(cat => {
                    const s = CATEGORIE_STYLE[cat]
                    const count = depenses.filter(d => d.categorie === cat).length
                    return (
                        <button
                            key={cat}
                            onClick={() => setFilterCat(filterCat === cat ? 'TOUTES' : cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                filterCat === cat
                                    ? `${s.bg} ${s.text} border-transparent`
                                    : 'bg-background border-border text-muted-foreground hover:border-foreground'
                            }`}
                        >
                            {CATEGORIE_LABELS[cat]} ({count})
                        </button>
                    )
                })}
            </div>

            {/* ─── Barre de recherche ───────────────────────────────────── */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-9"
                    placeholder="Rechercher une dépense…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* ─── Tableau des dépenses ─────────────────────────────────── */}
            {isLoading ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground text-sm">
                        Chargement…
                    </CardContent>
                </Card>
            ) : depenses.length === 0 ? (
                <Card>
                    <CardContent className="py-20 text-center">
                        <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium">Aucune dépense pour {MOIS_LABELS[mois]} {annee}</p>
                        <p className="text-sm text-muted-foreground mt-1">Commencez par enregistrer une nouvelle dépense</p>
                        <Button variant="outline" className="mt-5" onClick={() => setModalForm('new')}>
                            <Plus className="h-4 w-4 mr-1.5" /> Nouvelle dépense
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-0 px-0 pt-0">
                        {/* En-tête du tableau */}
                        <div className="grid grid-cols-[140px_1fr_100px_140px_80px] gap-0 border-b bg-muted/50 rounded-t-lg">
                            <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</div>
                            <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</div>
                            <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Date</div>
                            <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Montant</div>
                            <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                <Filter className="h-6 w-6 mx-auto mb-2 opacity-30" />
                                Aucun résultat pour cette recherche
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filtered.map((d, i) => (
                                    <div
                                        key={d.id}
                                        className={`grid grid-cols-[140px_1fr_100px_140px_80px] gap-0 items-center transition-colors hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                                    >
                                        <div className="px-4 py-3.5">
                                            <CategorieBadge cat={d.categorie} />
                                        </div>
                                        <div className="px-4 py-3.5">
                                            <p className="text-sm font-medium text-foreground">{d.description}</p>
                                            {d.creePar && (
                                                <p className="text-xs text-muted-foreground mt-0.5">par {d.creePar}</p>
                                            )}
                                        </div>
                                        <div className="px-4 py-3.5 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(d.dateDepense + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                        <div className="px-4 py-3.5 text-right">
                                            <p className="text-sm font-bold text-red-600">{fcfa(d.montant)}</p>
                                        </div>
                                        <div className="px-4 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon" variant="ghost" className="h-8 w-8"
                                                    onClick={() => setModalForm(d)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon" variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setModalDel(d)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer total */}
                        {filtered.length > 0 && (
                            <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between rounded-b-lg">
                                <span className="text-sm text-muted-foreground">
                                    {filtered.length} dépense{filtered.length > 1 ? 's' : ''}
                                    {filterCat !== 'TOUTES' || search ? ` (filtrées)` : ''}
                                </span>
                                <div className="text-right">
                                    {(filterCat !== 'TOUTES' || search) && filtered.length !== depenses.length && (
                                        <p className="text-xs text-muted-foreground">
                                            Sélection : <span className="font-semibold">{fcfa(totalFiltre)}</span>
                                        </p>
                                    )}
                                    <p className="text-sm font-bold text-red-600">
                                        Total mois : {fcfa(total)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Répartition par catégorie ────────────────────────────── */}
            {depenses.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Répartition par type — {MOIS_LABELS[mois]} {annee}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {CATEGORIES
                            .filter(cat => (statsCat[cat] ?? 0) > 0)
                            .sort((a, b) => (statsCat[b] ?? 0) - (statsCat[a] ?? 0))
                            .map(cat => {
                                const montant = statsCat[cat] ?? 0
                                const pct = total > 0 ? Math.round(montant / total * 100) : 0
                                const s = CATEGORIE_STYLE[cat]
                                const count = depenses.filter(d => d.categorie === cat).length
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />
                                                <span className="font-medium">{CATEGORIE_LABELS[cat]}</span>
                                                <span className="text-muted-foreground text-xs">({count})</span>
                                            </span>
                                            <span className="font-semibold text-red-600">{fcfa(montant)}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, background: s.dot }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 text-right">{pct} %</p>
                                    </div>
                                )
                            })
                        }
                    </CardContent>
                </Card>
            )}

            {/* ─── Modals ───────────────────────────────────────────────── */}
            {modalForm !== null && (
                <ModalDepense
                    depense={modalForm === 'new' ? null : modalForm}
                    onClose={() => setModalForm(null)}
                    onSuccess={invalidate}
                    defaultDate={defaultDate}
                />
            )}
            {modalDel && (
                <ModalSupprimer
                    depense={modalDel}
                    onClose={() => setModalDel(null)}
                    onSuccess={invalidate}
                />
            )}
        </div>
    )
}
