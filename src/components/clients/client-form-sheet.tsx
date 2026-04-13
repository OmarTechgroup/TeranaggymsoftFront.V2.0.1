'use client'
import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { Client, ClientCreateDTO, createClient, updateClient, uploadClientPhoto, getClientPhotoUrl } from "@/services/client.service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Camera } from "lucide-react"
import { toast } from "sonner"

const schema = z.object({
    nom: z.string().min(2, "Nom requis"),
    telephone: z.string().min(6, "Téléphone requis"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    address: z.string().optional(),
    date_inscription: z.string().min(1, "Date requise"),
})

type FormData = z.infer<typeof schema>

interface ClientFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client: Client | null
    onSuccess: () => void
}

export function ClientFormSheet({ open, onOpenChange, client, onSuccess }: ClientFormModalProps) {
    const isEdit = !!client
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    useEffect(() => {
        if (client) {
            reset({
                nom: client.nom,
                telephone: client.telephone,
                email: client.email ?? "",
                address: client.address ?? "",
                date_inscription: client.date_inscription?.split('T')[0] ?? "",
            })
            setPhotoPreview(getClientPhotoUrl(client.id))
        } else {
            reset({
                nom: "", telephone: "", email: "", address: "",
                date_inscription: new Date().toISOString().split('T')[0],
            })
            setPhotoPreview(null)
            setPhotoFile(null)
        }
    }, [client, reset])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: FormData) => {
            const dto: ClientCreateDTO = {
                nom: data.nom,
                telephone: data.telephone,
                email: data.email,
                address: data.address,
                date_inscription: data.date_inscription,
            }
            const saved = isEdit
                ? await updateClient(client!.id, dto)
                : await createClient(dto)

            // Upload photo si sélectionnée
            if (photoFile) {
                try {
                    await uploadClientPhoto(saved.id, photoFile)
                } catch (e) {
                    toast.warning("Client enregistré mais la photo n'a pas pu être uploadée.")
                    console.warn("Échec upload photo:", e)
                }
            }
            return saved
        },
        onSuccess: () => {
            toast.success(isEdit ? "Client modifié avec succès" : "Client créé avec succès")
            onSuccess()
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Une erreur est survenue")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Modifier le client" : "Nouveau client"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 mt-2">

                    {/* Upload Photo */}
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground cursor-pointer overflow-hidden bg-muted flex items-center justify-center hover:opacity-80 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="photo" className="h-full w-full object-cover" />
                            ) : (
                                <Camera className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">Cliquer pour ajouter une photo</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    {/* Champs en grille 2 colonnes */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label>Nom Complete *</Label>
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
                        <div className=" col-span-2 space-y-1">
                            <Label>Email</Label>
                            <Input {...register("email")} type="email" placeholder="email@exemple.com" />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>


                        <div className=" col-span-2 space-y-1">
                            <Label>Date d'inscription *</Label>
                            <Input {...register("date_inscription")} type="date" />
                            {errors.date_inscription && <p className="text-xs text-destructive">{errors.date_inscription.message}</p>}
                        </div>


                    </div>

                    <div className="flex gap-2 pt-2">
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
