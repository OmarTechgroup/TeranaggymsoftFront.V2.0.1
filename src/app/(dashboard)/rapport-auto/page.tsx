'use client'
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getParametreEmail, saveParametreEmail, envoyerRapportMaintenant,
    ParametreEmailRequest
} from "@/services/parametreEmail.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { toast } from "sonner"
import { Mail, Send, Settings2, CheckCircle2, XCircle, Eye, EyeOff, Clock, CalendarClock, ToggleLeft, ToggleRight } from "lucide-react"

const MOIS_LABELS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function StatusBadge({ actif }: { actif: boolean }) {
    return actif ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Actif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <XCircle className="h-3.5 w-3.5" /> Inactif
        </span>
    )
}

export default function RapportAutoPage() {
    const now = new Date()
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    const [showPassword, setShowPassword] = useState(false)
    const [sendMois, setSendMois] = useState(prevMonth)
    const [sendAnnee, setSendAnnee] = useState(prevYear)
    const [form, setForm] = useState<ParametreEmailRequest | null>(null)

    const qc = useQueryClient()

    const { data: config, isLoading } = useQuery({
        queryKey: ['parametreEmail'],
        queryFn: getParametreEmail,
    })

    useEffect(() => {
        if (config && !form) {
            setForm({
                actif: config.actif,
                emailDestinataire: config.emailDestinataire ?? '',
                nomExpediteur: config.nomExpediteur ?? 'TerangaGym',
                smtpHost: config.smtpHost ?? '',
                smtpPort: config.smtpPort ?? 587,
                smtpUsername: config.smtpUsername ?? '',
                smtpPassword: '',
                smtpTls: config.smtpTls ?? true,
                jourEnvoi: config.jourEnvoi ?? 1,
            })
        }
    }, [config])

    const saveMutation = useMutation({
        mutationFn: (data: ParametreEmailRequest) => saveParametreEmail(data),
        onSuccess: () => {
            toast.success("Configuration sauvegardée")
            qc.invalidateQueries({ queryKey: ['parametreEmail'] })
        },
        onError: () => toast.error("Erreur lors de la sauvegarde"),
    })

    const sendMutation = useMutation({
        mutationFn: () => envoyerRapportMaintenant(sendMois, sendAnnee),
        onSuccess: (d) => {
            toast.success(d.message ?? "Rapport envoyé avec succès !")
            qc.invalidateQueries({ queryKey: ['parametreEmail'] })
        },
        onError: (e: Error) => toast.error("Erreur : " + e.message),
    })

    function setF(k: keyof ParametreEmailRequest, v: string | number | boolean) {
        setForm(f => f ? { ...f, [k]: v } : f)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form) return
        if (!form.emailDestinataire?.includes('@')) { toast.error("Email destinataire invalide"); return }
        if (!form.smtpHost) { toast.error("Hôte SMTP requis"); return }
        if (!form.smtpUsername) { toast.error("Utilisateur SMTP requis"); return }
        saveMutation.mutate(form)
    }

    if (isLoading || !form) {
        return <div className="p-6 text-muted-foreground text-sm">Chargement…</div>
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* ─── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="h-6 w-6 text-primary" />
                        Rapport mensuel automatique
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Envoi automatique d'un résumé financier par email chaque mois
                    </p>
                </div>
                <StatusBadge actif={config?.actif ?? false} />
            </div>

            {/* ─── Statut & Dernier envoi ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2.5 rounded-full ${form.actif ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            <CalendarClock className={`h-5 w-5 ${form.actif ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Envoi automatique</p>
                            <p className="font-semibold text-sm">{form.actif ? `Le ${form.jourEnvoi} du mois` : 'Désactivé'}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-blue-100">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Dernier envoi</p>
                            <p className="font-semibold text-sm">{config?.dernierEnvoi ?? 'Jamais'}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-violet-100">
                            <Mail className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Destinataire</p>
                            <p className="font-semibold text-sm truncate max-w-[140px]">
                                {config?.emailDestinataire ?? 'Non configuré'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Formulaire de configuration ─────────────────────────── */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Settings2 className="h-4 w-4" /> Configuration
                        </CardTitle>
                        <CardDescription>Paramètres du serveur email et de l'envoi automatique</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Activer / Désactiver */}
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div>
                                <p className="font-medium text-sm">Envoi automatique mensuel</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Le rapport est envoyé le {form.jourEnvoi} de chaque mois pour le mois précédent
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setF('actif', !form.actif)}
                                className="flex-shrink-0"
                            >
                                {form.actif
                                    ? <ToggleRight className="h-9 w-9 text-emerald-500" />
                                    : <ToggleLeft className="h-9 w-9 text-slate-400" />
                                }
                            </button>
                        </div>

                        {/* Destinataire + nom */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Email destinataire *</Label>
                                <Input
                                    type="email" className="mt-1"
                                    placeholder="gerant@terangagym.com"
                                    value={form.emailDestinataire}
                                    onChange={e => setF('emailDestinataire', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Nom expéditeur</Label>
                                <Input
                                    className="mt-1" placeholder="TerangaGym"
                                    value={form.nomExpediteur}
                                    onChange={e => setF('nomExpediteur', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Jour d'envoi */}
                        <div className="w-40">
                            <Label>Jour d'envoi (1–28)</Label>
                            <Input
                                type="number" min={1} max={28} className="mt-1"
                                value={form.jourEnvoi}
                                onChange={e => setF('jourEnvoi', Number(e.target.value))}
                            />
                        </div>

                        <hr />

                        {/* SMTP */}
                        <div>
                            <p className="text-sm font-semibold mb-4 flex items-center gap-1.5 text-muted-foreground">
                                <Settings2 className="h-4 w-4" /> Serveur SMTP
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Hôte SMTP *</Label>
                                    <Input
                                        className="mt-1" placeholder="smtp.gmail.com"
                                        value={form.smtpHost}
                                        onChange={e => setF('smtpHost', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Port</Label>
                                    <Input
                                        type="number" className="mt-1"
                                        value={form.smtpPort}
                                        onChange={e => setF('smtpPort', Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label>Nom d'utilisateur (email) *</Label>
                                    <Input
                                        type="email" className="mt-1"
                                        placeholder="votre@gmail.com"
                                        value={form.smtpUsername}
                                        onChange={e => setF('smtpUsername', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>
                                        Mot de passe {config?.smtpPasswordSet && <span className="text-emerald-600 text-xs font-normal">(déjà configuré)</span>}
                                    </Label>
                                    <div className="relative mt-1">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            className="pr-10"
                                            placeholder={config?.smtpPasswordSet ? "••••••••••• (laisser vide pour conserver)" : "Mot de passe app"}
                                            value={form.smtpPassword ?? ''}
                                            onChange={e => setF('smtpPassword', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword(v => !v)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Pour Gmail : utilisez un <strong>mot de passe d'application</strong>
                                    </p>
                                </div>
                            </div>

                            {/* TLS toggle */}
                            <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-muted/40 border">
                                <input
                                    type="checkbox" id="tls"
                                    checked={form.smtpTls}
                                    onChange={e => setF('smtpTls', e.target.checked)}
                                    className="h-4 w-4 accent-primary cursor-pointer"
                                />
                                <label htmlFor="tls" className="text-sm cursor-pointer select-none">
                                    Activer STARTTLS <span className="text-muted-foreground">(recommandé — port 587)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? "Sauvegarde…" : "Sauvegarder la configuration"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* ─── Envoi manuel ─────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Send className="h-4 w-4" /> Envoyer un rapport maintenant
                    </CardTitle>
                    <CardDescription>
                        Envoie immédiatement le rapport pour le mois sélectionné (test ou envoi ponctuel)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <Label>Mois</Label>
                            <select
                                className="mt-1 block border rounded-md px-3 py-2 text-sm bg-background"
                                value={sendMois}
                                onChange={e => setSendMois(Number(e.target.value))}
                            >
                                {MOIS_LABELS.slice(1).map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Année</Label>
                            <Input
                                type="number" className="mt-1 w-24"
                                value={sendAnnee}
                                onChange={e => setSendAnnee(Number(e.target.value))}
                            />
                        </div>
                        <Button
                            onClick={() => sendMutation.mutate()}
                            disabled={sendMutation.isPending}
                            className="flex items-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {sendMutation.isPending ? "Envoi en cours…" : `Envoyer — ${MOIS_LABELS[sendMois]} ${sendAnnee}`}
                        </Button>
                    </div>

                    {/* Aperçu du contenu */}
                    <div className="mt-5 p-4 rounded-lg bg-muted/40 border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Contenu de l'email</p>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-100 text-center">
                                <p className="text-xs text-emerald-600 font-medium">Recettes</p>
                                <p className="text-emerald-700 text-xs mt-1">Abonnements, séances, produits</p>
                            </div>
                            <div className="p-3 rounded-md bg-red-50 border border-red-100 text-center">
                                <p className="text-xs text-red-600 font-medium">Charges</p>
                                <p className="text-red-700 text-xs mt-1">Salaires + dépenses diverses</p>
                            </div>
                            <div className="p-3 rounded-md bg-blue-50 border border-blue-100 text-center">
                                <p className="text-xs text-blue-600 font-medium">Résultat</p>
                                <p className="text-blue-700 text-xs mt-1">Bénéfice net + taux de marge</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Guide SMTP ───────────────────────────────────────────── */}
            <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-800">💡 Configuration Gmail recommandée</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-amber-700 space-y-1.5">
                    <p><strong>Hôte :</strong> smtp.gmail.com &nbsp;|&nbsp; <strong>Port :</strong> 587 &nbsp;|&nbsp; <strong>TLS :</strong> Activé</p>
                    <p><strong>Mot de passe :</strong> Générer un <em>mot de passe d'application</em> dans votre compte Google
                        (Compte Google → Sécurité → Validation en 2 étapes → Mots de passe des applications).</p>
                    <p>N'utilisez pas votre mot de passe Google principal.</p>
                </CardContent>
            </Card>
        </div>
    )
}
