'use client'
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DashboardHeader } from "@/components/dashboard-header"
import { getAllProduits, getAllHistoriqueStock, getAllHistoriqueSorties, getStockLevel, Produit } from "@/services/produit.service"
import { getVenteStats } from "@/services/vente.service"
import { StockEntreeModal } from "@/components/produits/stock-entree-modal"
import { StockSortieModal } from "@/components/produits/stock-sortie-modal"
import { Button } from "@/components/ui/shared/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shared/table"
import { Skeleton } from "@/components/ui/shared/skeleton"
import { Badge } from "@/components/ui/shared/badge"
import { PackagePlus, PackageMinus, TrendingUp, DollarSign, ShoppingBag, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

type TabType = 'entrees' | 'sorties'

const PAGE_SIZE = 10

function Pagination({ total, page, onChange }: { total: number; page: number; onChange: (p: number) => void }) {
    const totalPages = Math.ceil(total / PAGE_SIZE)
    if (totalPages <= 1) return null
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    return (
        <div className="flex items-center justify-between px-2 py-3 border-t">
            <p className="text-xs text-muted-foreground">{total} résultat{total > 1 ? 's' : ''}</p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page === 1}
                    className="px-2 py-1 rounded text-sm disabled:opacity-40 hover:bg-muted"
                >←</button>
                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`w-7 h-7 rounded text-sm ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >{p}</button>
                ))}
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 py-1 rounded text-sm disabled:opacity-40 hover:bg-muted"
                >→</button>
            </div>
        </div>
    )
}

function parseDate(str: string): Date | null {
    if (!str) return null
    try {
        const d = new Date(str.replace(' ', 'T'))
        return isNaN(d.getTime()) ? null : d
    } catch { return null }
}

function formatDate(str: string): string {
    const d = parseDate(str)
    if (!d) return str
    return format(d, "dd MMM yyyy HH:mm", { locale: fr })
}

export default function GestionStockPage() {
    const [entreeOpen, setEntreeOpen] = useState(false)
    const [sortieOpen, setSortieOpen] = useState(false)
    const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null)
    const [activeTab, setActiveTab] = useState<TabType>('entrees')
    const [produitPage, setProduitPage] = useState(1)
    const [entreePage, setEntreePage] = useState(1)
    const [sortiePage, setSortiePage] = useState(1)
    const queryClient = useQueryClient()

    const { data: produits = [], isLoading: l1 } = useQuery({
        queryKey: ['produits'],
        queryFn: getAllProduits,
        staleTime: 30_000,
    })

    const { data: historique = [], isLoading: l2 } = useQuery({
        queryKey: ['stock-historique'],
        queryFn: getAllHistoriqueStock,
        staleTime: 30_000,
    })

    const { data: sorties = [], isLoading: l3 } = useQuery({
        queryKey: ['stock-sorties'],
        queryFn: getAllHistoriqueSorties,
        staleTime: 30_000,
    })

    const { data: stats } = useQuery({
        queryKey: ['vente-stats'],
        queryFn: getVenteStats,
        staleTime: 60_000,
    })

    const produitsStock = produits.filter(p => p.gererStock)

    const coutStockTotal = produitsStock.reduce((sum, p) => sum + (p.stockQuantity ?? 0) * (p.prixAchat ?? 0), 0)
    const valeurStockVente = produitsStock.reduce((sum, p) => sum + (p.stockQuantity ?? 0) * p.prixUnitaire, 0)
    const margeBrute = valeurStockVente - coutStockTotal
    const tauxMarge = coutStockTotal > 0 ? Math.round((margeBrute / valeurStockVente) * 100) : 0

    const handleEntree = (produit: Produit) => {
        setSelectedProduit(produit)
        setEntreeOpen(true)
    }

    const handleSortie = (produit: Produit) => {
        setSelectedProduit(produit)
        setSortieOpen(true)
    }

    const onSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['produits'] })
        queryClient.invalidateQueries({ queryKey: ['stock-historique'] })
        queryClient.invalidateQueries({ queryKey: ['stock-sorties'] })
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <DashboardHeader title="Gestion de Stock" />
            <div className="flex-1 p-6 space-y-6 overflow-auto">

                {/* KPI Cards */}
                {l1 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Coût stock actuel</p>
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-bold">{coutStockTotal.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">FCFA investi</p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Valeur de vente</p>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-bold">{valeurStockVente.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">FCFA si tout vendu</p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Marge brute potentielle</p>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{margeBrute.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">FCFA · {tauxMarge}% de marge</p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Recettes ce mois</p>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{(stats?.recettesMois ?? 0).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">FCFA · {stats?.nbVentesJour ?? 0} ventes aujourd'hui</p>
                        </div>
                    </div>
                )}

                {/* Table produits avec stock */}
                <div className="space-y-2">
                    <h2 className="text-base font-semibold">Produits gérés en stock</h2>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produit</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Prix achat</TableHead>
                                    <TableHead>Prix vente</TableHead>
                                    <TableHead>Marge unitaire</TableHead>
                                    <TableHead>Valeur stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {produitsStock.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            Aucun produit avec stock géré
                                        </TableCell>
                                    </TableRow>
                                ) : produitsStock.slice((produitPage - 1) * PAGE_SIZE, produitPage * PAGE_SIZE).map(p => {
                                    const level = getStockLevel(p)
                                    const margeUnit = (p.prixAchat ?? 0) > 0 ? p.prixUnitaire - (p.prixAchat ?? 0) : null
                                    const tauxUnit = margeUnit !== null && (p.prixAchat ?? 0) > 0
                                        ? Math.round((margeUnit / p.prixUnitaire) * 100) : null
                                    const valeurStock = (p.stockQuantity ?? 0) * (p.prixAchat ?? 0)

                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.libelle}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{p.stockQuantity ?? 0}</span>
                                                    {level === 'critical' && <Badge variant="destructive" className="text-xs">Critique</Badge>}
                                                    {level === 'low' && <Badge className="bg-yellow-500 text-white text-xs">Faible</Badge>}
                                                    {level === 'high' && <Badge className="bg-green-500 text-white text-xs">OK</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {p.prixAchat ? `${p.prixAchat.toLocaleString()} FCFA` : <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>{p.prixUnitaire.toLocaleString()} FCFA</TableCell>
                                            <TableCell>
                                                {margeUnit !== null ? (
                                                    <span className={`font-medium ${margeUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        +{margeUnit.toLocaleString()} FCFA
                                                        <span className="text-xs text-muted-foreground ml-1">({tauxUnit}%)</span>
                                                    </span>
                                                ) : <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>{valeurStock.toLocaleString()} FCFA</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="sm" variant="outline" onClick={() => handleEntree(p)}>
                                                        <PackagePlus className="h-3.5 w-3.5 mr-1" />
                                                        Entrée
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleSortie(p)}
                                                    >
                                                        <PackageMinus className="h-3.5 w-3.5 mr-1" />
                                                        Sortie
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                        <Pagination total={produitsStock.length} page={produitPage} onChange={setProduitPage} />
                    </div>
                </div>

                {/* Historique avec onglets Entrées / Sorties */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold">Historique des mouvements</h2>
                        <div className="flex rounded-lg border overflow-hidden">
                            <button
                                onClick={() => setActiveTab('entrees')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'entrees'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-background text-muted-foreground hover:bg-muted'}`}
                            >
                                <ArrowUpCircle className="h-3.5 w-3.5" />
                                Entrées ({historique.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('sorties')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'sorties'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-background text-muted-foreground hover:bg-muted'}`}
                            >
                                <ArrowDownCircle className="h-3.5 w-3.5" />
                                Sorties ({sorties.length})
                            </button>
                        </div>
                    </div>

                    {/* Tab Entrées */}
                    {activeTab === 'entrees' && (
                        l2 ? <Skeleton className="h-48 rounded-xl" /> : (
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Produit</TableHead>
                                            <TableHead>Quantité</TableHead>
                                            <TableHead>Prix achat unitaire</TableHead>
                                            <TableHead>Coût total</TableHead>
                                            <TableHead>Note</TableHead>
                                            <TableHead>Par</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historique.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                    Aucune entrée de stock enregistrée
                                                </TableCell>
                                            </TableRow>
                                        ) : historique.slice((entreePage - 1) * PAGE_SIZE, entreePage * PAGE_SIZE).map(e => (
                                            <TableRow key={e.id}>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDate(e.dateEntree)}
                                                </TableCell>
                                                <TableCell className="font-medium">{e.produitLibelle}</TableCell>
                                                <TableCell className="text-green-600 font-medium">+{e.quantite}</TableCell>
                                                <TableCell>{e.prixAchatUnitaire ? `${e.prixAchatUnitaire.toLocaleString()} FCFA` : "—"}</TableCell>
                                                <TableCell className="font-medium text-red-600">
                                                    {e.coutTotal ? `${e.coutTotal.toLocaleString()} FCFA` : "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{e.note ?? "—"}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{e.createdBy}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination total={historique.length} page={entreePage} onChange={setEntreePage} />
                            </div>
                        )
                    )}

                    {/* Tab Sorties */}
                    {activeTab === 'sorties' && (
                        l3 ? <Skeleton className="h-48 rounded-xl" /> : (
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Produit</TableHead>
                                            <TableHead>Quantité retirée</TableHead>
                                            <TableHead>Motif / Justification</TableHead>
                                            <TableHead>Par</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sorties.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    Aucune sortie de stock enregistrée
                                                </TableCell>
                                            </TableRow>
                                        ) : sorties.slice((sortiePage - 1) * PAGE_SIZE, sortiePage * PAGE_SIZE).map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDate(s.dateSortie)}
                                                </TableCell>
                                                <TableCell className="font-medium">{s.produitLibelle}</TableCell>
                                                <TableCell className="text-red-600 font-medium">-{s.quantite}</TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{s.motif}</span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{s.createdBy}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination total={sorties.length} page={sortiePage} onChange={setSortiePage} />
                            </div>
                        )
                    )}
                </div>
            </div>

            <StockEntreeModal
                open={entreeOpen}
                onOpenChange={setEntreeOpen}
                produit={selectedProduit}
                onSuccess={onSuccess}
            />
            <StockSortieModal
                open={sortieOpen}
                onOpenChange={setSortieOpen}
                produit={selectedProduit}
                onSuccess={onSuccess}
            />
        </div>
    )
}
