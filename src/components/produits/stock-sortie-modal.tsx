'use client'
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { Produit, sortirStock } from "@/services/produit.service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Textarea } from "@/components/ui/shared/textarea"
import { toast } from "sonner"
import { PackageMinus, AlertTriangle } from "lucide-react"

const schema = z.object({
    quantite: z.coerce.number().min(1, "Quantité minimum 1"),
    motif: z.string().min(3, "Le motif est obligatoire (min 3 caractères)"),
})
type FormData = z.infer<typeof schema>

interface StockSortieModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    produit: Produit | null
    onSuccess: () => void
}

export function StockSortieModal({ open, onOpenChange, produit, onSuccess }: StockSortieModalProps) {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { quantite: 1, motif: "" },
    })

    const quantite = watch("quantite")
    const stockActuel = produit?.stockQuantity ?? 0
    const stockApres = stockActuel - (quantite || 0)

    useEffect(() => {
        if (open) {
            reset({ quantite: 1, motif: "" })
        }
    }, [open, reset])

    const { mutate, isPending } = useMutation({
        mutationFn: (data: FormData) => sortirStock({
            produitId: produit!.id,
            quantite: data.quantite,
            motif: data.motif,
        }),
        onSuccess: () => {
            toast.success("Sortie de stock enregistrée")
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
                        <PackageMinus className="h-5 w-5 text-red-500" />
                        Sortie de stock — {produit.libelle}
                    </DialogTitle>
                </DialogHeader>

                {/* Résumé produit */}
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock actuel</span>
                        <span className="font-medium">{stockActuel} unités</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock après retrait</span>
                        <span className={`font-medium ${stockApres < 0 ? 'text-red-600' : stockApres === 0 ? 'text-orange-500' : 'text-green-600'}`}>
                            {stockApres} unités
                        </span>
                    </div>
                </div>

                {stockApres < 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Stock insuffisant — vous retirez plus que disponible
                    </div>
                )}

                <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
                    <div className="space-y-1">
                        <Label>Quantité à retirer *</Label>
                        <Input
                            {...register("quantite")}
                            type="number"
                            min={1}
                            max={stockActuel}
                        />
                        {errors.quantite && <p className="text-xs text-destructive">{errors.quantite.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label>Motif / Justification *</Label>
                        <Textarea
                            {...register("motif")}
                            placeholder="ex: Produit périmé, Casse, Usage interne, Correction d'inventaire..."
                            rows={3}
                        />
                        {errors.motif && <p className="text-xs text-destructive">{errors.motif.message}</p>}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="submit"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={isPending || stockApres < 0}
                        >
                            {isPending ? "Enregistrement..." : "Enregistrer la sortie"}
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
