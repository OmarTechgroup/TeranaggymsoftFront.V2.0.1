'use client'
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { Produit, entrerStock } from "@/services/produit.service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { toast } from "sonner"
import { PackagePlus } from "lucide-react"

const schema = z.object({
    quantite: z.coerce.number().min(1, "Quantité minimum 1"),
    prixAchatUnitaire: z.coerce.number().min(0, "Prix requis"),
    note: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface StockEntreeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    produit: Produit | null
    onSuccess: () => void
}

export function StockEntreeModal({ open, onOpenChange, produit, onSuccess }: StockEntreeModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { quantite: 1, prixAchatUnitaire: 0, note: "" },
    })

    useEffect(() => {
        if (open && produit) {
            reset({
                quantite: 1,
                prixAchatUnitaire: produit.prixAchat ?? 0,
                note: "",
            })
        }
    }, [open, produit, reset])

    const { mutate, isPending } = useMutation({
        mutationFn: (data: FormData) => entrerStock({
            produitId: produit!.id,
            quantite: data.quantite,
            prixAchatUnitaire: data.prixAchatUnitaire,
            note: data.note,
        }),
        onSuccess: () => {
            toast.success("Entrée de stock enregistrée")
            onSuccess()
            onOpenChange(false)
        },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    if (!produit) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackagePlus className="h-5 w-5" />
                        Entrée de stock — {produit.libelle}
                    </DialogTitle>
                </DialogHeader>

                {/* Résumé produit */}
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock actuel</span>
                        <span className="font-medium">{produit.stockQuantity ?? 0} unités</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix de vente</span>
                        <span className="font-medium">{produit.prixUnitaire.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dernier prix d'achat</span>
                        <span className="font-medium">{produit.prixAchat ? `${produit.prixAchat.toLocaleString()} FCFA` : "—"}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Quantité entrante *</Label>
                            <Input {...register("quantite")} type="number" min={1} />
                            {errors.quantite && <p className="text-xs text-destructive">{errors.quantite.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Prix d'achat unitaire (FCFA) *</Label>
                            <Input {...register("prixAchatUnitaire")} type="number" min={0} />
                            {errors.prixAchatUnitaire && <p className="text-xs text-destructive">{errors.prixAchatUnitaire.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Note (optionnel)</Label>
                        <Input {...register("note")} placeholder="ex: Livraison fournisseur X" />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending ? "Enregistrement..." : "Enregistrer l'entrée"}
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
