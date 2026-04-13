'use client'
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { Produit, ProduitCreateDTO, TypeProduit, TypeAbonnement, createProduit, updateProduit } from "@/services/produit.service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Checkbox } from "@/components/ui/shared/checkbox"
import { toast } from "sonner"

const TYPE_OPTIONS: { value: TypeProduit; label: string }[] = [
    { value: "ABONNEMENT", label: "Abonnement" },
    { value: "SEANCE", label: "Séance" },
    { value: "PRODUIT", label: "Produit" },
]

const DUREE_OPTIONS: { value: TypeAbonnement; label: string; jours: string }[] = [
    { value: "MENSUEL", label: "Mensuel", jours: "30 jours" },
    { value: "TRIMESTRIEL", label: "Trimestriel", jours: "90 jours" },
    { value: "ANNUEL", label: "Annuel", jours: "365 jours" },
]

const schema = z.object({
    libelle: z.string().min(2, "Nom requis"),
    prixUnitaire: z.coerce.number().min(0, "Prix requis"),
    typeProduit: z.enum(["SEANCE", "PRODUIT", "ABONNEMENT"]),
    gererStock: z.boolean(),
    prixAchat: z.coerce.number().optional().nullable(),
    stockQuantity: z.coerce.number().optional().nullable(),
    seuilAlert: z.coerce.number().optional().nullable(),
    dureeAbonnement: z.enum(["MENSUEL", "TRIMESTRIEL", "ANNUEL"]).optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface ProduitFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    produit: Produit | null
    onSuccess: () => void
}

export function ProduitFormModal({ open, onOpenChange, produit, onSuccess }: ProduitFormModalProps) {
    const isEdit = !!produit
    const [gererStock, setGererStock] = useState(false)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { gererStock: false, typeProduit: "ABONNEMENT" },
    })

    const watchGererStock = watch("gererStock")

    useEffect(() => {
        if (open) {
            if (produit) {
                reset({
                    libelle: produit.libelle,
                    prixUnitaire: produit.prixUnitaire,
                    typeProduit: produit.typeProduit,
                    gererStock: produit.gererStock ?? false,
                    prixAchat: produit.prixAchat ?? undefined,
                    stockQuantity: produit.stockQuantity ?? undefined,
                    seuilAlert: produit.seuilAlert ?? undefined,
                    dureeAbonnement: produit.dureeAbonnement ?? "MENSUEL",
                })
                setGererStock(produit.gererStock ?? false)
            } else {
                reset({ libelle: "", prixUnitaire: 0, typeProduit: "ABONNEMENT", gererStock: false, stockQuantity: undefined, seuilAlert: undefined, dureeAbonnement: "MENSUEL" })
                setGererStock(false)
            }
        }
    }, [open, produit, reset])

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: FormData) => {
            const dto: ProduitCreateDTO = {
                libelle: data.libelle,
                prixUnitaire: data.prixUnitaire,
                typeProduit: data.typeProduit,
                gererStock: data.gererStock,
                prixAchat: data.gererStock ? (data.prixAchat ?? null) : null,
                stockQuantity: data.gererStock ? (data.stockQuantity ?? 0) : null,
                seuilAlert: data.gererStock ? (data.seuilAlert ?? 0) : null,
                dureeAbonnement: data.typeProduit === "ABONNEMENT" ? (data.dureeAbonnement ?? "MENSUEL") : null,
            }
            return isEdit ? updateProduit(produit!.id, dto) : createProduit(dto)
        },
        onSuccess: () => {
            toast.success(isEdit ? "Produit modifié" : "Produit créé")
            onSuccess()
            onOpenChange(false)
        },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4 mt-2">

                    <div className="space-y-1">
                        <Label>Nom du produit *</Label>
                        <Input {...register("libelle")} placeholder="ex: Abonnement mensuel" />
                        {errors.libelle && <p className="text-xs text-destructive">{errors.libelle.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Prix unitaire (FCFA) *</Label>
                            <Input {...register("prixUnitaire")} type="number" min={0} placeholder="0" />
                            {errors.prixUnitaire && <p className="text-xs text-destructive">{errors.prixUnitaire.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Type *</Label>
                            <select
                                {...register("typeProduit")}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            >
                                {TYPE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Durée abonnement — visible uniquement si type ABONNEMENT */}
                    {watch("typeProduit") === "ABONNEMENT" && (
                        <div className="space-y-1">
                            <Label>Durée de l'abonnement *</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {DUREE_OPTIONS.map(d => (
                                    <label
                                        key={d.value}
                                        className={`flex flex-col items-center justify-center rounded-lg border p-3 cursor-pointer transition-all
                                            ${watch("dureeAbonnement") === d.value
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                : 'border-border hover:border-primary/50'}`}
                                    >
                                        <input type="radio" value={d.value} {...register("dureeAbonnement")} className="sr-only" />
                                        <span className="font-semibold text-sm">{d.label}</span>
                                        <span className="text-xs text-muted-foreground">{d.jours}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Checkbox gestion stock */}
                    <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/40">
                        <Checkbox
                            id="gererStock"
                            checked={watchGererStock}
                            onCheckedChange={(v) => {
                                setValue("gererStock", !!v)
                                setGererStock(!!v)
                            }}
                        />
                        <div>
                            <Label htmlFor="gererStock" className="cursor-pointer font-medium">Gérer le stock</Label>
                            <p className="text-xs text-muted-foreground">Activer le suivi de quantité et le seuil d'alerte</p>
                        </div>
                    </div>

                    {/* Champs stock — visibles uniquement si coché */}
                    {watchGererStock && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Prix d'achat unitaire (FCFA) *</Label>
                                <Input {...register("prixAchat")} type="number" min={0} placeholder="0" />
                                <p className="text-xs text-muted-foreground">Utilisé pour calculer la marge</p>
                            </div>
                            <div className="space-y-1">
                                <Label>Stock initial</Label>
                                <Input {...register("stockQuantity")} type="number" min={0} placeholder="0" />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label>Seuil d'alerte</Label>
                                <Input {...register("seuilAlert")} type="number" min={0} placeholder="5" />
                                <p className="text-xs text-muted-foreground">Alerte quand le stock descend en dessous de ce seuil</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending ? "Enregistrement..." : isEdit ? "Modifier" : "Créer"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
