'use client'
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getAllEmployes, createEmploye, updateEmploye, deleteEmploye,
    enregistrerPaiement, getPaiementsDuMois, getResumePaie,
    Employe, EmployeRequest, PaiementSalaire, StatutEmploye
} from "@/services/employe.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { toast } from "sonner"
import {
    Briefcase, Plus, Pencil, Trash2, Wallet, Users,
    CheckCircle2, Clock, ChevronLeft, ChevronRight, X, AlertTriangle
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MOIS_LABELS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const STATUT_CONFIG: Record<StatutEmploye, { label: string; class: string }> = {
    ACTIF: { label: 'Actif', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    INACTIF: { label: 'Inactif', class: 'bg-red-100 text-red-700 border-red-200' },
    CONGE: { label: 'Congé', class: 'bg-amber-100 text-amber-700 border-amber-200' },
}

function statutBadge(statut: StatutEmploye) {
    const c = STATUT_CONFIG[statut]
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.class}`}>{c.label}</span>
}

// ─── Modal Formulaire Employé ─────────────────────────────────────────────────
function ModalEmploye({ employe, onClose, onSuccess }: {
    employe: Employe | null; onClose: () => void; onSuccess: () => void
}) {
    const isEdit = !!employe
    const [form, setForm] = useState<EmployeRequest>({
        nom: employe?.nom ?? '',
        prenom: employe?.prenom ?? '',
        telephone: employe?.telephone ?? '',
        email: employe?.email ?? '',
        poste: employe?.poste ?? '',
        salaireMensuel: employe?.salaireMensuel ?? 0,
        dateEmbauche: employe?.dateEmbauche
            ? employe.dateEmbauche.split('-').reverse().join('-')  // dd-MM-yyyy → yyyy-MM-dd
            : new Date().toISOString().split('T')[0],
        statut: employe?.statut ?? 'ACTIF',
        note: employe?.note ?? '',
    })

    const { mutate, isPending } = useMutation({
        mutationFn: () => isEdit ? updateEmploye(employe!.id, form) : createEmploye(form),
        onSuccess: () => { toast.success(isEdit ? "Employé modifié" : "Employé ajouté"); onSuccess(); onClose() },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    const valid = form.nom && form.prenom && form.telephone && form.poste && form.salaireMensuel > 0 && form.dateEmbauche

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isEdit ? "Modifier l'employé" : "Nouvel employé"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Prénom *</Label>
                            <Input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Moussa" />
                        </div>
                        <div className="space-y-1">
                            <Label>Nom *</Label>
                            <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Diallo" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Téléphone *</Label>
                            <Input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="77XXXXXXX" />
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.com" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Poste *</Label>
                            <Input value={form.poste} onChange={e => setForm(f => ({ ...f, poste: e.target.value }))} placeholder="Coach, Réceptionniste…" />
                        </div>
                        <div className="space-y-1">
                            <Label>Salaire mensuel (FCFA) *</Label>
                            <Input type="number" min={0} value={form.salaireMensuel} onChange={e => setForm(f => ({ ...f, salaireMensuel: +e.target.value }))} placeholder="150000" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Date d'embauche *</Label>
                            <Input type="date" value={form.dateEmbauche} onChange={e => setForm(f => ({ ...f, dateEmbauche: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label>Statut</Label>
                            <select
                                value={form.statut}
                                onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutEmploye }))}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            >
                                <option value="ACTIF">Actif</option>
                                <option value="INACTIF">Inactif</option>
                                <option value="CONGE">Congé</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Notes</Label>
                        <Input value={form.note ?? ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Remarques optionnelles…" />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button className="flex-1" onClick={() => mutate()} disabled={isPending || !valid}>
                            {isPending ? "Enregistrement…" : isEdit ? "Modifier" : "Ajouter"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Modal Payer salaire ──────────────────────────────────────────────────────
function ModalPayer({ employe, mois, annee, onClose, onSuccess }: {
    employe: Employe; mois: number; annee: number; onClose: () => void; onSuccess: () => void
}) {
    const [montant, setMontant] = useState(employe.salaireMensuel)
    const [note, setNote] = useState('')

    const { mutate, isPending } = useMutation({
        mutationFn: () => enregistrerPaiement({ employeId: employe.id, mois, annee, montantPaye: montant, note }),
        onSuccess: () => { toast.success(`Salaire de ${employe.prenom} ${employe.nom} enregistré`); onSuccess(); onClose() },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Payer le salaire
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Employé</span><span className="font-medium">{employe.prenom} {employe.nom}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Poste</span><span>{employe.poste}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Période</span><span>{MOIS_LABELS[mois]} {annee}</span></div>
                        <div className="flex justify-between border-t pt-2 mt-1"><span className="text-muted-foreground">Salaire de base</span><span className="font-bold">{employe.salaireMensuel.toLocaleString('fr-FR')} FCFA</span></div>
                    </div>
                    <div className="space-y-1">
                        <Label>Montant à payer (FCFA) *</Label>
                        <Input type="number" min={0} value={montant} onChange={e => setMontant(+e.target.value)} />
                        {montant !== employe.salaireMensuel && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Différent du salaire de base ({employe.salaireMensuel.toLocaleString('fr-FR')} FCFA)
                            </p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>Note (optionnel)</Label>
                        <Input value={note} onChange={e => setNote(e.target.value)} placeholder="ex: déduction avance 20 000 FCFA" />
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => mutate()} disabled={isPending || montant <= 0}>
                            {isPending ? "Enregistrement…" : "Confirmer le paiement"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Modal Supprimer employé ──────────────────────────────────────────────────
function ModalSupprimer({ employe, onClose, onSuccess }: {
    employe: Employe; onClose: () => void; onSuccess: () => void
}) {
    const { mutate, isPending } = useMutation({
        mutationFn: () => deleteEmploye(employe.id),
        onSuccess: () => { toast.success("Employé supprimé"); onSuccess(); onClose() },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Supprimer l'employé
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                        Voulez-vous supprimer <span className="font-semibold text-foreground">{employe.prenom} {employe.nom}</span> ?
                        L'historique de paie sera également supprimé.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Annuler</Button>
                        <Button variant="destructive" className="flex-1" onClick={() => mutate()} disabled={isPending}>
                            {isPending ? "Suppression…" : "Supprimer"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page principale ──────────────────────────────────────────────────────────
const PAGE_SIZE = 10

export default function EmployesPage() {
    const queryClient = useQueryClient()
    const now = new Date()
    const [mois, setMois] = useState(now.getMonth() + 1)
    const [annee, setAnnee] = useState(now.getFullYear())
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [tab, setTab] = useState<'employes' | 'paie'>('employes')

    const [modalForm, setModalForm] = useState<Employe | null | 'new'>(null)
    const [modalPayer, setModalPayer] = useState<Employe | null>(null)
    const [modalDel, setModalDel] = useState<Employe | null>(null)

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['employes'] })
        queryClient.invalidateQueries({ queryKey: ['paie', mois, annee] })
        queryClient.invalidateQueries({ queryKey: ['resume-paie', mois, annee] })
    }

    const { data: employes = [], isLoading: loadingEmployes } = useQuery({
        queryKey: ['employes'],
        queryFn: getAllEmployes,
        staleTime: 30_000,
    })

    const { data: paiements = [], isLoading: loadingPaie } = useQuery({
        queryKey: ['paie', mois, annee],
        queryFn: () => getPaiementsDuMois(mois, annee),
        staleTime: 30_000,
    })

    const { data: resume } = useQuery({
        queryKey: ['resume-paie', mois, annee],
        queryFn: () => getResumePaie(mois, annee),
        staleTime: 30_000,
    })

    // Employés filtrés + pagination
    const filtered = useMemo(() => employes.filter(e =>
        `${e.prenom} ${e.nom} ${e.poste} ${e.telephone}`.toLowerCase().includes(search.toLowerCase())
    ), [employes, search])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Set des IDs déjà payés ce mois
    const dejaPayes = useMemo(() => new Set(paiements.map(p => p.employeId)), [paiements])

    // Employés ACTIFS non encore payés ce mois
    const aPayerListe = useMemo(() =>
        employes.filter(e => e.statut === 'ACTIF' && !dejaPayes.has(e.id)),
        [employes, dejaPayes]
    )

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" />
                        Gestion des employés
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Gérez le personnel et la paie mensuelle</p>
                </div>
                <Button onClick={() => setModalForm('new')} className="gap-2">
                    <Plus className="h-4 w-4" /> Ajouter un employé
                </Button>
            </div>

            {/* KPI résumé paie */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Employés actifs</p>
                                <p className="text-2xl font-bold mt-1">{resume?.nbEmployesActifs ?? '—'}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Masse salariale</p>
                                <p className="text-2xl font-bold mt-1">{resume ? resume.masseSalarialeTotal.toLocaleString('fr-FR') : '—'}</p>
                                <p className="text-xs text-muted-foreground">FCFA / mois</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Déjà décaissé</p>
                                <p className="text-2xl font-bold mt-1 text-emerald-600">{resume ? resume.totalDejaDecaisse.toLocaleString('fr-FR') : '—'}</p>
                                <p className="text-xs text-muted-foreground">{resume?.nbPayes ?? 0} employé(s)</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Reste à payer</p>
                                <p className="text-2xl font-bold mt-1 text-amber-600">{resume ? resume.resteADecaisser.toLocaleString('fr-FR') : '—'}</p>
                                <p className="text-xs text-muted-foreground">{resume?.nbRestants ?? 0} employé(s)</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                {(['employes', 'paie'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        {t === 'employes' ? `Employés (${employes.length})` : `Paie — ${MOIS_LABELS[mois]} ${annee}`}
                    </button>
                ))}
            </div>

            {/* ── TAB EMPLOYÉS ── */}
            {tab === 'employes' && (
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
                        <CardTitle className="text-base">Liste du personnel</CardTitle>
                        <Input
                            placeholder="Rechercher…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1) }}
                            className="max-w-xs h-8"
                        />
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingEmployes ? (
                            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>
                        ) : filtered.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center gap-2">
                                <Briefcase className="h-8 w-8 text-muted-foreground/40" />
                                <p className="text-muted-foreground text-sm">Aucun employé trouvé</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Poste</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Téléphone</th>
                                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Salaire</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Embauche</th>
                                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginated.map(e => (
                                                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                                                {e.prenom.charAt(0)}{e.nom.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{e.prenom} {e.nom}</div>
                                                                {e.email && <div className="text-xs text-muted-foreground">{e.email}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{e.poste}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{e.telephone}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">{e.salaireMensuel.toLocaleString('fr-FR')} <span className="text-xs font-normal text-muted-foreground">FCFA</span></td>
                                                    <td className="px-4 py-3">{statutBadge(e.statut)}</td>
                                                    <td className="px-4 py-3 text-muted-foreground text-xs">{e.dateEmbauche}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                                                                title="Payer le salaire ce mois"
                                                                onClick={() => setModalPayer(e)}
                                                                disabled={dejaPayes.has(e.id) || e.statut !== 'ACTIF'}
                                                            >
                                                                {dejaPayes.has(e.id)
                                                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                    : <Wallet className="h-4 w-4" />
                                                                }
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                title="Modifier"
                                                                onClick={() => setModalForm(e)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                title="Supprimer"
                                                                onClick={() => setModalDel(e)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t">
                                        <span className="text-xs text-muted-foreground">Page {page}/{totalPages}</span>
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── TAB PAIE ── */}
            {tab === 'paie' && (
                <div className="space-y-4">
                    {/* Sélecteur mois/année */}
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground font-medium">Mois</label>
                                    <select
                                        value={mois}
                                        onChange={e => setMois(+e.target.value)}
                                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        {MOIS_LABELS.slice(1).map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground font-medium">Année</label>
                                    <select
                                        value={annee}
                                        onChange={e => setAnnee(+e.target.value)}
                                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        {[2023, 2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                                {aPayerListe.length > 0 && (
                                    <div className="flex items-center gap-2 ml-auto text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        <Clock className="h-4 w-4" />
                                        <span><strong>{aPayerListe.length}</strong> employé(s) non encore payé(s)</span>
                                    </div>
                                )}
                                {aPayerListe.length === 0 && employes.length > 0 && (
                                    <div className="flex items-center gap-2 ml-auto text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Tous les employés ont été payés ce mois</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tableau paie du mois */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Paie — {MOIS_LABELS[mois]} {annee}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingPaie ? (
                                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>
                            ) : paiements.length === 0 ? (
                                <div className="h-32 flex flex-col items-center justify-center gap-2">
                                    <Wallet className="h-8 w-8 text-muted-foreground/40" />
                                    <p className="text-muted-foreground text-sm">Aucun paiement enregistré pour ce mois</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Poste</th>
                                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Salaire base</th>
                                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Montant payé</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date paiement</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Par</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paiements.map(p => (
                                                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{p.employeNomComplet}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{p.poste}</td>
                                                    <td className="px-4 py-3 text-right text-muted-foreground">{p.salaireMensuel.toLocaleString('fr-FR')}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`font-bold ${p.montantPaye < p.salaireMensuel ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                            {p.montantPaye.toLocaleString('fr-FR')} FCFA
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.datePaiement}</td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground italic">{p.note ?? '—'}</td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.payePar}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-muted/40 border-t-2">
                                                <td colSpan={3} className="px-4 py-3 font-semibold text-sm">Total décaissé</td>
                                                <td className="px-4 py-3 text-right font-bold text-base text-primary">
                                                    {paiements.reduce((s, p) => s + p.montantPaye, 0).toLocaleString('fr-FR')} FCFA
                                                </td>
                                                <td colSpan={3} />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modals */}
            {modalForm && (
                <ModalEmploye
                    employe={modalForm === 'new' ? null : modalForm}
                    onClose={() => setModalForm(null)}
                    onSuccess={refresh}
                />
            )}
            {modalPayer && (
                <ModalPayer
                    employe={modalPayer}
                    mois={mois}
                    annee={annee}
                    onClose={() => setModalPayer(null)}
                    onSuccess={refresh}
                />
            )}
            {modalDel && (
                <ModalSupprimer
                    employe={modalDel}
                    onClose={() => setModalDel(null)}
                    onSuccess={refresh}
                />
            )}
        </div>
    )
}
