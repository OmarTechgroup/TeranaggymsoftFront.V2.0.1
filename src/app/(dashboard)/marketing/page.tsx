'use client'
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getMarketingStats, getCampagnes, envoyerNotification,
    Campagne, EnvoiRequest
} from "@/services/marketing.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { toast } from "sonner"
import { Megaphone, Users, UserCheck, UserX, Send, Clock, CheckCircle2 } from "lucide-react"

const CATEGORIES = [
    { value: "ABONNEMENT",  label: "📋 Abonnement",         desc: "Rappel, renouvellement" },
    { value: "OUVERTURE",   label: "🟢 Ouverture salle",    desc: "Horaires, réouverture" },
    { value: "FERMETURE",   label: "🔴 Fermeture salle",    desc: "Fermeture exceptionnelle" },
    { value: "PROMO",       label: "🎁 Promotion",          desc: "Offre spéciale, réduction" },
    { value: "EVENEMENT",   label: "🎉 Événement",          desc: "Tournoi, cours spécial" },
    { value: "AUTRE",       label: "📢 Autre",              desc: "Message général" },
]

const CIBLES = [
    { value: "TOUS",     label: "Tous les clients",     icon: Users,      color: "blue" },
    { value: "ACTIFS",   label: "Membres actifs",       icon: UserCheck,  color: "green" },
    { value: "INACTIFS", label: "Membres inactifs",     icon: UserX,      color: "orange" },
] as const

function formatDate(s: string | null) {
    if (!s) return "—"
    try { return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return s }
}

function cibleBadge(cible: string) {
    const map: Record<string, string> = {
        TOUS:     "bg-blue-100 text-blue-700",
        ACTIFS:   "bg-green-100 text-green-700",
        INACTIFS: "bg-orange-100 text-orange-700",
    }
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[cible] ?? 'bg-muted text-muted-foreground'}`}>{cible}</span>
}

export default function MarketingPage() {
    const qc = useQueryClient()
    const [titre, setTitre] = useState("")
    const [message, setMessage] = useState("")
    const [cible, setCible] = useState<"TOUS" | "ACTIFS" | "INACTIFS">("TOUS")
    const [categorie, setCategorie] = useState("ABONNEMENT")
    const [preview, setPreview] = useState(false)

    const { data: stats } = useQuery({ queryKey: ['marketingStats'], queryFn: getMarketingStats, refetchInterval: 30_000 })
    const { data: campagnes = [] } = useQuery({ queryKey: ['campagnes'], queryFn: getCampagnes })

    const { mutate: envoyer, isPending } = useMutation({
        mutationFn: (data: EnvoiRequest) => envoyerNotification(data),
        onSuccess: (res) => {
            toast.success(`✅ Envoyé à ${res.nbEnvoyes} appareil(s)`)
            qc.invalidateQueries({ queryKey: ['campagnes'] })
            qc.invalidateQueries({ queryKey: ['marketingStats'] })
            setTitre(""); setMessage(""); setPreview(false)
        },
        onError: (e: Error) => toast.error(e.message),
    })

    const nbCible = cible === "TOUS" ? (stats?.tous ?? 0) : cible === "ACTIFS" ? (stats?.actifs ?? 0) : (stats?.inactifs ?? 0)

    function handleEnvoyer() {
        if (!titre.trim()) { toast.error("Le titre est requis"); return }
        if (!message.trim()) { toast.error("Le message est requis"); return }
        setPreview(false)
        envoyer({ titre, message, cible, categorie })
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Marketing Push</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Envoyez des notifications push ciblées à vos membres</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {CIBLES.map(c => {
                    const val = c.value === "TOUS" ? stats?.tous : c.value === "ACTIFS" ? stats?.actifs : stats?.inactifs
                    const Icon = c.icon
                    return (
                        <Card key={c.value} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setCible(c.value)}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
                                        <p className="text-2xl font-black mt-0.5">{val ?? '—'}</p>
                                        <p className="text-xs text-muted-foreground">appareils enregistrés</p>
                                    </div>
                                    <Icon className={`h-8 w-8 ${c.color === 'blue' ? 'text-blue-400' : c.color === 'green' ? 'text-emerald-400' : 'text-orange-400'}`} />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulaire */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-primary" /> Composer une notification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Catégorie */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Catégorie</label>
                            <div className="grid grid-cols-2 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategorie(cat.value)}
                                        className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${categorie === cat.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
                                    >
                                        <p className="text-sm font-semibold">{cat.label}</p>
                                        <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cible */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Destinataires</label>
                            <div className="flex gap-2">
                                {CIBLES.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setCible(c.value)}
                                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${cible === c.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Titre */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Titre *</label>
                            <input
                                value={titre}
                                onChange={e => setTitre(e.target.value)}
                                placeholder="ex: Fermeture exceptionnelle demain"
                                maxLength={60}
                                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <p className="text-[11px] text-muted-foreground mt-0.5 text-right">{titre.length}/60</p>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Message *</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="ex: La salle sera fermée demain mercredi 15 janvier pour maintenance. Réouverture jeudi à 7h."
                                rows={3}
                                maxLength={200}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                            <p className="text-[11px] text-muted-foreground text-right">{message.length}/200</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="outline" className="flex-1"
                                onClick={() => setPreview(p => !p)}
                                disabled={!titre || !message}
                            >
                                {preview ? "Masquer" : "Aperçu"}
                            </Button>
                            <Button
                                className="flex-1 gap-2"
                                onClick={handleEnvoyer}
                                disabled={isPending || !titre || !message}
                            >
                                <Send className="h-4 w-4" />
                                {isPending ? "Envoi…" : `Envoyer à ${nbCible} appareil(s)`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    {/* Aperçu notification */}
                    {preview && titre && message && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Aperçu</p>
                            <div className="rounded-2xl border bg-card p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-lg">{CATEGORIES.find(c => c.value === categorie)?.label.charAt(0) ?? '📢'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-muted-foreground">TerangaGym • maintenant</p>
                                        </div>
                                        <p className="font-semibold text-sm mt-0.5 truncate">{titre}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2 text-center">
                                Ceci est un aperçu — la vraie notification s'affiche sur l'appareil du client
                            </p>
                        </div>
                    )}

                    {/* Historique */}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" /> Historique
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {campagnes.length === 0 ? (
                                <div className="py-10 text-center text-muted-foreground text-sm">Aucune campagne envoyée</div>
                            ) : (
                                <div className="divide-y">
                                    {campagnes.slice(0, 10).map(c => (
                                        <div key={c.id} className="px-4 py-3">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-semibold text-sm truncate">{c.titre}</p>
                                                {cibleBadge(c.cible)}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{c.message}</p>
                                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                    {c.nbEnvoyes} envoyé(s)
                                                </span>
                                                <span>{formatDate(c.envoyeLe)}</span>
                                                {c.envoyePar && <span>par {c.envoyePar}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
