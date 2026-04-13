'use client'
import { useState, useMemo, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { getAllProduits, Produit } from "@/services/produit.service"
import { getAllClients, Client, createClient, ClientCreateDTO, uploadClientPhoto } from "@/services/client.service"
import { creerVente, VenteResponse } from "@/services/vente.service"
import { useAuth } from "@/app/context/AuthContext"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Badge } from "@/components/ui/shared/badge"
import { toast } from "sonner"
import {
    ShoppingCart, Plus, Minus, Trash2, User, X,
    Search, Clock, Package, Printer,
    UserPlus, ArrowLeft, AlertTriangle, Camera
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getConfigSalle, getLogoUrl } from "@/services/configSalle.service"

// ── Types ──────────────────────────────────────────────────────
interface CartItem { produit: Produit; quantite: number }

const TYPE_FILTERS = ["Tous", "ABONNEMENT", "SEANCE", "PRODUIT"]
const TYPE_LABELS: Record<string, string> = { ABONNEMENT: "Abonnement", SEANCE: "Séance", PRODUIT: "Produit" }
const TYPE_BADGE: Record<string, string> = {
    ABONNEMENT: "bg-violet-100 text-violet-700",
    SEANCE: "bg-blue-100 text-blue-700",
    PRODUIT: "bg-emerald-100 text-emerald-700",
}
const DUREE_LABELS: Record<string, string> = {
    MENSUEL: "Mensuel · 30j",
    TRIMESTRIEL: "Trimestriel · 90j",
    ANNUEL: "Annuel · 365j",
}

// ── Horloge live ───────────────────────────────────────────────
function LiveClock() {
    const [now, setNow] = useState(new Date())
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
    return (
        <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-3 py-2 text-primary-foreground">
            <Clock className="h-4 w-4 opacity-70" />
            <div className="text-right">
                <p className="text-xs opacity-70 leading-none">{now.toLocaleDateString('fr-FR')}</p>
                <p className="text-sm font-bold tabular-nums leading-tight">{now.toLocaleTimeString('fr-FR')}</p>
            </div>
        </div>
    )
}

// ── Modal sélection client ─────────────────────────────────────
function ClientSelectModal({ open, onClose, onSelect, clients }: {
    open: boolean; onClose: () => void
    onSelect: (c: Client) => void; clients: Client[]
}) {
    const [search, setSearch] = useState("")
    const [selected, setSelected] = useState<Client | null>(null)

    const filtered = useMemo(() => {
        if (!search.trim()) return clients.slice(0, 12)
        return clients.filter(c =>
            c.nom.toLowerCase().includes(search.toLowerCase()) ||
            c.telephone?.includes(search) ||
            c.cardNumber?.includes(search)
        ).slice(0, 12)
    }, [clients, search])

    useEffect(() => { if (!open) { setSearch(""); setSelected(null) } }, [open])
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border">
                <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <span className="font-bold text-lg">Sélectionner un client</span>
                        <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">{clients.length} clients</span>
                    </div>
                    <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-6 py-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input autoFocus placeholder="Rechercher par nom ou téléphone..." value={search}
                            onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </div>
                <div className="flex-1 overflow-auto px-6 py-4">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <User className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">Aucun client trouvé</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {filtered.map(c => (
                                <button key={c.id} onClick={() => setSelected(c)}
                                    className={`rounded-xl border p-3 text-left transition-all hover:shadow-md
                                        ${selected?.id === c.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}>
                                    <div className="flex items-start gap-2">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                            {c.nom.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm uppercase truncate">{c.nom}</p>
                                            <p className="text-xs text-muted-foreground truncate">📞 {c.telephone}</p>
                                            {c.email && <p className="text-xs text-muted-foreground truncate">✉ {c.email}</p>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Annuler</button>
                    <button onClick={() => selected && (onSelect(selected), onClose())} disabled={!selected}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <UserPlus className="h-4 w-4" />
                        Confirmer le client
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Schéma formulaire nouveau client ──────────────────────────
const clientSchema = z.object({
    nom: z.string().min(2, "Nom requis"),
    telephone: z.string().min(6, "Téléphone requis"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    address: z.string().optional(),
    date_inscription: z.string().min(1, "Date requise"),
})
type ClientFormData = z.infer<typeof clientSchema>

// ── Modal nouveau client ───────────────────────────────────────
function NewClientModal({ open, onClose, onCreated }: {
    open: boolean; onClose: () => void; onCreated: (c: Client) => void
}) {
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const qc = useQueryClient()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: { date_inscription: new Date().toISOString().split('T')[0] },
    })

    useEffect(() => {
        if (!open) { reset(); setPhotoFile(null); setPhotoPreview(null) }
    }, [open, reset])

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: ClientFormData) => {
            const dto: ClientCreateDTO = {
                nom: data.nom, telephone: data.telephone,
                email: data.email, address: data.address,
                date_inscription: data.date_inscription,
            }
            const saved = await createClient(dto)
            if (photoFile) {
                try { await uploadClientPhoto(saved.id, photoFile) } catch { /* silencieux */ }
            }
            return saved
        },
        onSuccess: (saved) => {
            toast.success("Client créé avec succès")
            qc.invalidateQueries({ queryKey: ['clients'] })
            onCreated(saved)
            onClose()
        },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md border overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        <span className="font-bold text-lg">Nouveau client</span>
                    </div>
                    <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit((d) => mutate(d))} className="p-6 space-y-4">
                    {/* Photo */}
                    <div className="flex justify-center">
                        <div onClick={() => fileInputRef.current?.click()}
                            className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground cursor-pointer overflow-hidden bg-muted flex items-center justify-center hover:opacity-80 transition">
                            {photoPreview
                                ? <img src={photoPreview} alt="photo" className="h-full w-full object-cover" />
                                : <Camera className="h-7 w-7 text-muted-foreground" />}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                            onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)) }
                            }} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label>Nom complet *</Label>
                            <Input {...register("nom")} placeholder="Prénom Nom" />
                            {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Téléphone *</Label>
                            <Input {...register("telephone")} placeholder="77 000 00 00" />
                            {errors.telephone && <p className="text-xs text-destructive">{errors.telephone.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Adresse</Label>
                            <Input {...register("address")} placeholder="Adresse" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Email</Label>
                            <Input {...register("email")} type="email" placeholder="email@exemple.com" />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Date d'inscription *</Label>
                            <Input {...register("date_inscription")} type="date" />
                            {errors.date_inscription && <p className="text-xs text-destructive">{errors.date_inscription.message}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={isPending}
                            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors">
                            {isPending ? "Enregistrement..." : "Créer le client"}
                        </button>
                        <button type="button" onClick={onClose}
                            className="px-4 py-2.5 rounded-lg border text-sm text-muted-foreground hover:bg-muted transition-colors">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Page principale ────────────────────────────────────────────
export default function CaissePage() {
    const { user } = useAuth()
    const router = useRouter()

    const [cart, setCart] = useState<CartItem[]>([])
    const [searchProduit, setSearchProduit] = useState("")
    const [filterType, setFilterType] = useState("Tous")
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [clientSelectOpen, setClientSelectOpen] = useState(false)
    const [newClientOpen, setNewClientOpen] = useState(false)
    const [montantRecu, setMontantRecu] = useState("")
    const [ticketData, setTicketData] = useState<{ vente: VenteResponse; montantRecu: number } | null>(null)
    const ticketRef = useRef<HTMLDivElement>(null)

    const { data: produits = [], isLoading } = useQuery({ queryKey: ['produits'], queryFn: getAllProduits, staleTime: 60_000 })
    const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: getAllClients, staleTime: 60_000 })
    const { data: config } = useQuery({ queryKey: ['configSalle'], queryFn: getConfigSalle, staleTime: 5 * 60_000 })

    const nomSalle  = config?.nom      ?? 'TerangaGym'
    const adresse   = config?.adresse  ?? ''
    const telephone = config?.telephone ?? ''
    const logoUrl   = config?.hasLogo ? getLogoUrl() : null

    const produitsFiltres = useMemo(() =>
        produits.filter(p => {
            const matchSearch = p.libelle.toLowerCase().includes(searchProduit.toLowerCase())
            const matchType = filterType === "Tous" || p.typeProduit === filterType
            return matchSearch && matchType
        }), [produits, searchProduit, filterType])

    const total = cart.reduce((s, i) => s + i.produit.prixUnitaire * i.quantite, 0)
    const nbArticles = cart.reduce((s, i) => s + i.quantite, 0)
    const montantNum = Number(montantRecu)
    const monnaie = montantRecu ? montantNum - total : null

    // Vérifications pour le bouton Facturer
    const hasAbonnement = cart.some(i => i.produit.typeProduit === "ABONNEMENT")
    const clientRequis = hasAbonnement && !selectedClient
    const montantOk = montantRecu !== "" && montantNum >= total
    const peutFacturer = cart.length > 0 && montantOk && !clientRequis

    const addToCart = (produit: Produit) => {
        if (produit.gererStock && produit.stockQuantity === 0) { toast.error("Stock épuisé"); return }
        setCart(prev => {
            const ex = prev.find(i => i.produit.id === produit.id)
            if (ex) {
                if (produit.gererStock && produit.stockQuantity !== null && ex.quantite >= produit.stockQuantity) {
                    toast.warning(`Stock max : ${produit.stockQuantity}`); return prev
                }
                return prev.map(i => i.produit.id === produit.id ? { ...i, quantite: i.quantite + 1 } : i)
            }
            return [...prev, { produit, quantite: 1 }]
        })
    }

    const updateQty = (produitId: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.produit.id !== produitId) return i
            const nq = i.quantite + delta
            if (nq <= 0) return null as any
            if (i.produit.gererStock && i.produit.stockQuantity !== null && nq > i.produit.stockQuantity) {
                toast.warning(`Stock max : ${i.produit.stockQuantity}`); return i
            }
            return { ...i, quantite: nq }
        }).filter(Boolean))
    }

    const clearCart = () => { setCart([]); setMontantRecu(""); setSelectedClient(null) }

    const handlePrint = () => {
        const content = ticketRef.current
        if (!content) return
        const win = window.open('', '_blank', 'width=320,height=600')
        if (!win) return
        // Inline le logo en base64 si présent pour que l'impression fonctionne hors-ligne
        const logoTag = logoUrl
            ? `<div style="text-align:center;margin-bottom:6px"><img src="${logoUrl}" style="width:56px;height:56px;object-fit:contain" /></div>`
            : ''
        win.document.write(`<!DOCTYPE html><html><head><title>Ticket — ${nomSalle}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; padding: 4mm; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 15px; }
            .xl { font-size: 18px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; vertical-align: top; }
            .right { text-align: right; }
            .total-row td { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; }
            @media print { @page { margin: 0; size: 80mm auto; } body { width: 72mm; } }
        </style></head><body>${logoTag}${content.innerHTML}</body></html>`)
        win.document.close()
        win.focus()
        setTimeout(() => { win.print(); win.close() }, 500)
    }

    const { mutate: soumettre, isPending } = useMutation({
        mutationFn: () => creerVente({
            clientId: selectedClient?.id ?? null,
            users: user?.username ?? "caissier",
            commandeVentes: cart.map(i => ({ produitId: i.produit.id, quantite: i.quantite })),
        }),
        onSuccess: (data) => {
            toast.success("Vente enregistrée !")
            setTicketData({ vente: data, montantRecu: Number(montantRecu) })
            clearCart()
        },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    return (
        <div className="flex flex-col h-screen overflow-hidden">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-4 shrink-0">
                {/* Bouton retour */}
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                </button>

                <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 opacity-80" />
                    <div>
                        <h1 className="text-base font-bold leading-tight">Point de Vente</h1>
                        <p className="text-xs opacity-60 leading-none">{nomSalle}</p>
                    </div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-3">
                    <div className="bg-primary-foreground/15 rounded-lg px-4 py-2 text-center">
                        <p className="text-xs opacity-70 uppercase tracking-wide leading-none">Total</p>
                        <p className="text-base font-bold leading-tight">{total.toLocaleString()} FCFA</p>
                    </div>
                    <div className="bg-primary-foreground/15 rounded-lg px-4 py-2 text-center">
                        <p className="text-xs opacity-70 uppercase tracking-wide leading-none">Articles</p>
                        <p className="text-base font-bold leading-tight">{nbArticles}</p>
                    </div>
                    <LiveClock />
                </div>
            </div>

            {/* ── Corps ──────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0">

                {/* ── Catalogue ───────────────────────────────────── */}
                <div className="flex flex-col flex-1 min-h-0 p-4 space-y-3 border-r">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher un produit..." value={searchProduit}
                            onChange={e => setSearchProduit(e.target.value)} className="pl-9" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {TYPE_FILTERS.map(f => (
                            <button key={f} onClick={() => setFilterType(f)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border
                                    ${filterType === f
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}>
                                {f === "Tous" ? "Tous" : TYPE_LABELS[f]}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {isLoading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
                            </div>
                        ) : produitsFiltres.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <Package className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">Aucun produit trouvé</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {produitsFiltres.map(p => {
                                    const enPanier = cart.find(i => i.produit.id === p.id)
                                    const stockEpuise = p.gererStock && p.stockQuantity === 0
                                    return (
                                        <button key={p.id} onClick={() => !stockEpuise && addToCart(p)} disabled={stockEpuise}
                                            className={`relative rounded-xl border p-3 text-left transition-all space-y-1.5
                                                ${stockEpuise
                                                    ? 'opacity-40 cursor-not-allowed bg-muted'
                                                    : `bg-card cursor-pointer active:scale-95 hover:shadow-md
                                                       ${enPanier ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/50'}`}`}>
                                            {enPanier && (
                                                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                                    {enPanier.quantite}
                                                </span>
                                            )}
                                            <Badge variant="secondary" className={`text-xs ${TYPE_BADGE[p.typeProduit] ?? ''}`}>
                                                {TYPE_LABELS[p.typeProduit] ?? p.typeProduit}
                                            </Badge>
                                            <p className="font-semibold text-sm leading-tight line-clamp-2">{p.libelle}</p>
                                            <p className="font-bold text-sm text-primary">{p.prixUnitaire.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span></p>
                                            {p.typeProduit === "ABONNEMENT" && p.dureeAbonnement && (
                                                <p className="text-xs text-violet-600 font-medium">
                                                    {DUREE_LABELS[p.dureeAbonnement] ?? p.dureeAbonnement}
                                                </p>
                                            )}
                                            {p.gererStock && (
                                                <p className="text-xs text-muted-foreground">
                                                    {stockEpuise ? <span className="text-destructive">Épuisé</span> : `Stock : ${p.stockQuantity}`}
                                                </p>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Panier ──────────────────────────────────────── */}
                <div className="flex flex-col w-80 lg:w-96 shrink-0 border-l bg-background">

                    {/* Client */}
                    <div className="px-4 pt-4 pb-3 space-y-2 border-b">
                        {selectedClient ? (
                            <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                        {selectedClient.nom.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold leading-none">{selectedClient.nom}</p>
                                        <p className="text-xs text-muted-foreground">{selectedClient.telephone}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedClient(null)} className="text-muted-foreground hover:text-destructive">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setClientSelectOpen(true)}
                                className={`w-full flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm transition-colors
                                    ${clientRequis
                                        ? 'border-destructive/50 text-destructive hover:border-destructive'
                                        : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>
                                <User className="h-4 w-4" />
                                Sélectionner un client
                                {clientRequis && <span className="ml-auto text-xs font-medium">Requis !</span>}
                            </button>
                        )}
                        <button onClick={() => setNewClientOpen(true)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white py-2 text-sm font-medium transition-colors">
                            <UserPlus className="h-4 w-4" />
                            + Nouveau client
                        </button>
                    </div>

                    {/* Titre panier */}
                    <div className="px-4 py-3 border-b">
                        <h2 className="font-bold text-sm">Panier ({nbArticles} article{nbArticles > 1 ? 's' : ''})</h2>
                    </div>

                    {/* Articles */}
                    <div className="flex-1 overflow-auto px-4 py-2">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Panier vide</p>
                                <p className="text-xs opacity-60">Cliquez sur un produit</p>
                            </div>
                        ) : cart.map(item => (
                            <div key={item.produit.id} className="flex items-center gap-2 py-2.5 border-b last:border-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{item.produit.libelle}</p>
                                    <p className="text-xs text-muted-foreground">{item.produit.prixUnitaire.toLocaleString()} FCFA</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => updateQty(item.produit.id, -1)}
                                        className="flex h-6 w-6 items-center justify-center rounded border text-muted-foreground hover:bg-muted">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold">{item.quantite}</span>
                                    <button onClick={() => updateQty(item.produit.id, 1)}
                                        className="flex h-6 w-6 items-center justify-center rounded border text-muted-foreground hover:bg-muted">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <p className="w-20 text-right text-sm font-bold shrink-0">
                                    {(item.produit.prixUnitaire * item.quantite).toLocaleString()}
                                    <span className="text-[10px] font-normal text-muted-foreground"> FCFA</span>
                                </p>
                                <button onClick={() => setCart(c => c.filter(i => i.produit.id !== item.produit.id))}
                                    className="text-muted-foreground hover:text-destructive shrink-0">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer panier */}
                    <div className="border-t bg-muted/20 px-4 py-4 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Sous-total</span>
                            <span>{total.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold">Total :</span>
                            <span className="text-xl font-bold">{total.toLocaleString()} FCFA</span>
                        </div>

                        {/* Montant reçu */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Montant reçu :</label>
                            <Input type="number" placeholder="0" value={montantRecu}
                                onChange={e => setMontantRecu(e.target.value)} className="font-semibold" />
                            {monnaie !== null && montantRecu && (
                                monnaie > 0
                                    ? <p className="text-sm font-semibold text-emerald-600">Monnaie : {monnaie.toLocaleString()} FCFA</p>
                                    : monnaie === 0
                                        ? <p className="text-sm text-muted-foreground">Compte exact ✓</p>
                                        : <p className="text-sm font-medium text-destructive">Insuffisant — manque {Math.abs(monnaie).toLocaleString()} FCFA</p>
                            )}
                        </div>

                        {/* Alertes bloquantes */}
                        {clientRequis && (
                            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                Un abonnement est dans le panier — sélectionnez un client avant de facturer.
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button onClick={clearCart} disabled={cart.length === 0}
                                className="flex-1 py-2.5 rounded-lg border text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                                Vider
                            </button>
                            <button onClick={() => soumettre()} disabled={!peutFacturer || isPending}
                                title={
                                    !montantOk ? "Saisissez un montant reçu ≥ au total"
                                        : clientRequis ? "Client requis pour un abonnement"
                                            : ""
                                }
                                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                {isPending ? "Traitement..." : "Facturer"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ClientSelectModal open={clientSelectOpen} onClose={() => setClientSelectOpen(false)}
                onSelect={setSelectedClient} clients={clients} />
            <NewClientModal open={newClientOpen} onClose={() => setNewClientOpen(false)}
                onCreated={(c) => { setSelectedClient(c); setNewClientOpen(false) }} />

            {/* ── Modal Ticket ── */}
            {ticketData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                    <div className="bg-background rounded-2xl shadow-2xl border w-full max-w-sm flex flex-col overflow-hidden">
                        {/* Header modal */}
                        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                            <span className="font-semibold text-sm">Ticket de caisse</span>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrint}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                                    <Printer className="h-3.5 w-3.5" />
                                    Imprimer
                                </button>
                                <button onClick={() => setTicketData(null)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Ticket — aperçu écran */}
                        <div className="overflow-auto p-4">
                            <div ref={ticketRef} className="font-mono text-[12px] leading-snug w-[280px] mx-auto">
                                {/* En-tête */}
                                {logoUrl && (
                                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={logoUrl} alt="logo" style={{ width: '56px', height: '56px', objectFit: 'contain', display: 'inline-block' }} />
                                    </div>
                                )}
                                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px' }}>{nomSalle.toUpperCase()}</div>
                                {adresse && <div style={{ textAlign: 'center' }}>{adresse}</div>}
                                {telephone && <div style={{ textAlign: 'center', marginBottom: '8px' }}>Tél : {telephone}</div>}
                                {!adresse && !telephone && <div style={{ marginBottom: '8px' }} />}
                                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                                <div>Facture #: FACT-{ticketData.vente.id}</div>
                                <div>Date: {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}</div>
                                <div>Caissier: {ticketData.vente.users}</div>

                                {ticketData.vente.nom && (
                                    <>
                                        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                                        <div>Client: {ticketData.vente.nom}</div>
                                        {ticketData.vente.telephone && <div>Tél: {ticketData.vente.telephone}</div>}
                                    </>
                                )}

                                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                                {/* Tableau articles */}
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <td style={{ fontWeight: 'bold' }}>Article</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold', width: '25px' }}>Qté</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', width: '55px' }}>Prix U.</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', width: '55px' }}>Total</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td colSpan={4} style={{ borderTop: '1px solid #000', paddingTop: '2px' }} /></tr>
                                        {ticketData.vente.ligneCommandeVenteList?.map((l, i) => (
                                            <tr key={i}>
                                                <td style={{ paddingRight: '4px', wordBreak: 'break-word' }}>{l.produitLibelle}</td>
                                                <td style={{ textAlign: 'center' }}>{l.quantite}</td>
                                                <td style={{ textAlign: 'right' }}>{l.prixUnitaire.toLocaleString()} F</td>
                                                <td style={{ textAlign: 'right' }}>{l.sousTotal.toLocaleString()} F</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                                {/* Sous-total */}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Sous-total</span>
                                    <span>{ticketData.vente.montantTotal.toLocaleString()} F</span>
                                </div>

                                {/* Total */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', borderTop: '1px solid #000', marginTop: '4px', paddingTop: '4px', color: '#c00' }}>
                                    <span>TOTAL</span>
                                    <span>{ticketData.vente.montantTotal.toLocaleString()} F</span>
                                </div>

                                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                                {/* Paiement */}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Montant Reçu</span>
                                    <span>{ticketData.montantRecu.toLocaleString()} F</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Rendu</span>
                                    <span>{Math.max(0, ticketData.montantRecu - ticketData.vente.montantTotal).toLocaleString()} F</span>
                                </div>

                                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
                                <div style={{ textAlign: 'center', fontStyle: 'italic' }}>Merci de votre visite !</div>
                            </div>
                        </div>

                        {/* Footer modal */}
                        <div className="px-5 py-3 border-t">
                            <button onClick={() => setTicketData(null)}
                                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                                Nouvelle vente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
