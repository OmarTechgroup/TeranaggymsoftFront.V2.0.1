'use client'
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getPlans, createPlan, updatePlan, deletePlan, activerPlan, desactiverPlan,
    Plan, PlanRequest, ModuleKey, MODULE_META
} from "@/services/plan.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Zap, Package, X, ChevronDown, ChevronUp } from "lucide-react"

const ALL_MODULES = Object.keys(MODULE_META) as ModuleKey[]
const GROUPS = ["Principale", "Gestion", "Analyse & Finance", "Outils", "Administration"]


// ── Modal création / édition plan ─────────────────────────────────────────────
function ModalPlan({
    plan,
    onClose,
}: {
    plan: Plan | null
    onClose: () => void
}) {
    const qc = useQueryClient()
    const isEdit = plan !== null

    const [nom, setNom] = useState(plan?.nom ?? "")
    const [description, setDescription] = useState(plan?.description ?? "")
    const [prixMensuel, setPrixMensuel] = useState(plan?.prixMensuel ?? 0)
    const [selectedModules, setSelectedModules] = useState<Set<ModuleKey>>(
        new Set(plan?.modules ?? [])
    )

    const { mutate: save, isPending } = useMutation({
        mutationFn: (data: PlanRequest) =>
            isEdit ? updatePlan(plan!.id, data) : createPlan(data),
        onSuccess: () => {
            toast.success(isEdit ? "Plan mis à jour" : "Plan créé")
            qc.invalidateQueries({ queryKey: ['plans'] })
            onClose()
        },
        onError: (e: Error) => toast.error(e.message),
    })

    function toggleModule(key: ModuleKey) {
        setSelectedModules(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    function toggleGroup(group: string) {
        const groupModules = ALL_MODULES.filter(m => MODULE_META[m].group === group)
        const allSelected = groupModules.every(m => selectedModules.has(m))
        setSelectedModules(prev => {
            const next = new Set(prev)
            groupModules.forEach(m => allSelected ? next.delete(m) : next.add(m))
            return next
        })
    }

    function selectAll() { setSelectedModules(new Set(ALL_MODULES)) }
    function clearAll() { setSelectedModules(new Set()) }

    function handleSubmit() {
        if (!nom.trim()) { toast.error("Le nom du plan est requis"); return }
        if (selectedModules.size === 0) { toast.error("Sélectionnez au moins un module"); return }
        save({ nom, description, prixMensuel, modules: Array.from(selectedModules) })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div
                className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b">
                    <h2 className="font-semibold text-lg">{isEdit ? "Modifier le plan" : "Nouveau plan"}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Infos générales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block">Nom du plan *</label>
                            <input
                                value={nom}
                                onChange={e => setNom(e.target.value)}
                                placeholder="ex: Basique, Pro, Enterprise"
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Prix mensuel (FCFA)</label>
                            <input
                                type="number"
                                value={prixMensuel}
                                onChange={e => setPrixMensuel(Number(e.target.value))}
                                min={0}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Description</label>
                            <input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brève description"
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Sélection modules */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium">Modules inclus ({selectedModules.size}/{ALL_MODULES.length})</label>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-xs text-primary hover:underline">Tout sélectionner</button>
                                <span className="text-muted-foreground">·</span>
                                <button onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Tout désélectionner</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {GROUPS.map(group => {
                                const groupModules = ALL_MODULES.filter(m => MODULE_META[m].group === group)
                                if (groupModules.length === 0) return null
                                const allSelected = groupModules.every(m => selectedModules.has(m))
                                const someSelected = groupModules.some(m => selectedModules.has(m))
                                return (
                                    <div key={group} className="border rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleGroup(group)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                                        >
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {groupModules.filter(m => selectedModules.has(m)).length}/{groupModules.length}
                                                </span>
                                                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${allSelected ? 'bg-primary border-primary' : someSelected ? 'border-primary' : 'border-muted-foreground/40'}`}>
                                                    {allSelected && <span className="text-primary-foreground text-[10px]">✓</span>}
                                                    {someSelected && !allSelected && <span className="text-primary text-[10px]">−</span>}
                                                </div>
                                            </div>
                                        </button>
                                        <div className="divide-y">
                                            {groupModules.map(key => {
                                                const meta = MODULE_META[key]
                                                const on = selectedModules.has(key)
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => toggleModule(key)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${on ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                                                    >
                                                        <div className="shrink-0">
                                                            <meta.icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium ${on ? 'text-primary' : ''}`}>{meta.label}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{meta.description}</p>
                                                        </div>
                                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                                                            {on && <span className="text-primary-foreground text-[10px]">✓</span>}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Annuler</Button>
                    <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le plan"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Carte plan ─────────────────────────────────────────────────────────────────
function PlanCard({
    plan,
    onEdit,
    onDelete,
    onActiver,
    onDesactiver,
    loading,
}: {
    plan: Plan
    onEdit: () => void
    onDelete: () => void
    onActiver: () => void
    onDesactiver: () => void
    loading: boolean
}) {
    const [expanded, setExpanded] = useState(false)
    const moduleList = plan.modules.slice(0, expanded ? undefined : 4)

    return (
        <div className={`rounded-2xl border-2 transition-all ${plan.actif ? 'border-primary bg-primary/3' : 'border-border bg-card'}`}>
            {/* Top */}
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${plan.actif ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base">{plan.nom}</h3>
                                {plan.actif && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        <Zap className="h-3 w-3" /> Actif
                                    </span>
                                )}
                            </div>
                            {plan.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-lg font-black">{plan.prixMensuel === 0 ? 'Gratuit' : `${plan.prixMensuel.toLocaleString('fr-FR')} FCFA`}</p>
                        {plan.prixMensuel > 0 && <p className="text-xs text-muted-foreground"></p>}
                    </div>
                </div>

                {/* Modules */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {moduleList.map(key => {
                        const Icon = MODULE_META[key]?.icon
                        return (
                            <span key={key} className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-full font-medium">
                                <span>{Icon && <Icon className="h-3 w-3" />}</span>
                                <span>{MODULE_META[key]?.label}</span>
                            </span>
                        )
                    })}
                    {plan.modules.length > 4 && (
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline px-1"
                        >
                            {expanded ? <><ChevronUp className="h-3 w-3" /> Moins</> : <><ChevronDown className="h-3 w-3" /> +{plan.modules.length - 4} modules</>}
                        </button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">{plan.modules.length} module(s) inclus</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
                {plan.actif ? (
                    <Button variant="outline" size="sm" className="flex-1 text-muted-foreground" onClick={onDesactiver} disabled={loading}>
                        <Circle className="h-3.5 w-3.5 mr-1" /> Désactiver
                    </Button>
                ) : (
                    <Button size="sm" className="flex-1" onClick={onActiver} disabled={loading}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activer ce plan
                    </Button>
                )}
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete} disabled={plan.actif}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function PlansPage() {
    const qc = useQueryClient()
    const [modalPlan, setModalPlan] = useState<Plan | null | "new">(undefined as any)
    const showModal = modalPlan !== undefined

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: getPlans,
    })

    const { mutate: doActiver, isPending: activerLoading } = useMutation({
        mutationFn: activerPlan,
        onSuccess: () => { toast.success("Plan activé"); qc.invalidateQueries({ queryKey: ['plans'] }); qc.invalidateQueries({ queryKey: ['modulesActifs'] }) },
        onError: (e: Error) => toast.error(e.message),
    })

    const { mutate: doDesactiver, isPending: desactiverLoading } = useMutation({
        mutationFn: desactiverPlan,
        onSuccess: () => { toast.success("Plan désactivé — tous les modules sont actifs"); qc.invalidateQueries({ queryKey: ['plans'] }); qc.invalidateQueries({ queryKey: ['modulesActifs'] }) },
        onError: (e: Error) => toast.error(e.message),
    })

    const { mutate: doDelete } = useMutation({
        mutationFn: deletePlan,
        onSuccess: () => { toast.success("Plan supprimé"); qc.invalidateQueries({ queryKey: ['plans'] }) },
        onError: (e: Error) => toast.error(e.message),
    })

    const planActif = plans.find(p => p.actif)
    const modulesActifs = planActif ? planActif.modules.length : ALL_MODULES.length

    return (
        <>
            <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Plans & Modules</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Gérez les fonctionnalités accessibles dans l'application
                        </p>
                    </div>
                    <Button onClick={() => setModalPlan("new")} className="gap-2">
                        <Plus className="h-4 w-4" /> Nouveau plan
                    </Button>
                </div>

                {/* Status banner */}
                <div className={`rounded-xl border-2 px-5 py-4 flex items-center justify-between ${planActif ? 'border-primary/30 bg-primary/5' : 'border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${planActif ? 'bg-primary/10' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                            <Zap className={`h-5 w-5 ${planActif ? 'text-primary' : 'text-amber-600'}`} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">
                                {planActif ? `Plan actif : ${planActif.nom}` : 'Aucun plan actif — mode libre'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {planActif
                                    ? `${modulesActifs} module(s) activé(s) sur ${ALL_MODULES.length}`
                                    : 'Tous les modules sont accessibles. Activez un plan pour restreindre l\'accès.'}
                            </p>
                        </div>
                    </div>
                    {planActif && (
                        <Button variant="outline" size="sm" onClick={() => doDesactiver()} disabled={desactiverLoading}>
                            Désactiver
                        </Button>
                    )}
                </div>

                {/* Plans */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
                    </div>
                ) : plans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                        <Package className="h-12 w-12 opacity-30" />
                        <p className="text-sm">Aucun plan créé. Créez votre premier plan.</p>
                        <Button variant="outline" onClick={() => setModalPlan("new")}>
                            <Plus className="h-4 w-4 mr-2" /> Créer un plan
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onEdit={() => setModalPlan(plan)}
                                onDelete={() => doDelete(plan.id)}
                                onActiver={() => doActiver(plan.id)}
                                onDesactiver={() => doDesactiver()}
                                loading={activerLoading || desactiverLoading}
                            />
                        ))}
                    </div>
                )}

                {/* Référence modules */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Référence des modules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {ALL_MODULES.map(key => {
                                const meta = MODULE_META[key]
                                const isActive = !planActif || planActif.modules.includes(key)
                                return (
                                    <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border ${isActive ? 'bg-card' : 'bg-muted/30 opacity-50'}`}>
                                        <div className="shrink-0"><meta.icon className="h-5 w-5 text-muted-foreground" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{meta.label}</p>
                                            <p className="text-[11px] text-muted-foreground">{meta.group}</p>
                                        </div>
                                        <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Modal */}
            {showModal && (
                <ModalPlan
                    plan={modalPlan === "new" ? null : modalPlan}
                    onClose={() => setModalPlan(undefined as any)}
                />
            )}
        </>
    )
}
