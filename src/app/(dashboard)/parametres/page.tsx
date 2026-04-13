'use client'
import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getConfigSalle, saveConfigSalle, uploadLogo, getLogoUrl,
    ConfigSalleRequest
} from "@/services/configSalle.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { toast } from "sonner"
import {
    Building2, Phone, Mail, MapPin, Upload, CheckCircle2,
    ImageOff, Pencil, Save, RefreshCw
} from "lucide-react"

// ─── Preview logo ─────────────────────────────────────────────────────────────
function LogoPreview({ hasLogo, localPreview, nom }: {
    hasLogo: boolean; localPreview: string | null; nom: string
}) {
    const src = localPreview ?? (hasLogo ? getLogoUrl() : null)
    const initiale = nom?.charAt(0)?.toUpperCase() ?? 'G'

    if (src) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
        )
    }
    return (
        <span className="text-4xl font-black text-white select-none">{initiale}</span>
    )
}

// ─── Zone de drop / upload logo ───────────────────────────────────────────────
function ZoneLogo({ hasLogo, localPreview, nom, onFile }: {
    hasLogo: boolean; localPreview: string | null; nom: string
    onFile: (f: File) => void
}) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)

    function handleDrop(e: React.DragEvent) {
        e.preventDefault(); setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) onFile(file)
        else toast.error("Seules les images sont acceptées")
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) onFile(file)
        e.target.value = ''
    }

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Aperçu logo rond */}
            <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden shadow-lg">
                    <LogoPreview hasLogo={hasLogo} localPreview={localPreview} nom={nom} />
                </div>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-background border-2 border-primary rounded-full shadow-md hover:bg-primary hover:text-white transition-colors"
                    title="Changer le logo"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Zone de drop */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
            >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Glisser-déposer votre logo ici</p>
                <p className="text-xs text-muted-foreground mt-1">ou cliquer pour parcourir</p>
                <p className="text-xs text-muted-foreground mt-2">PNG, JPG, SVG, WEBP — recommandé 512×512 px</p>
            </div>

            <input
                ref={fileRef} type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleChange}
            />
        </div>
    )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ParametresPage() {
    const qc = useQueryClient()

    const { data: config, isLoading } = useQuery({
        queryKey: ['configSalle'],
        queryFn: getConfigSalle,
    })

    const [form, setForm] = useState<ConfigSalleRequest>({
        nom: '', sousTitre: '', adresse: '', telephone: '', email: ''
    })
    const [localPreview, setLocalPreview] = useState<string | null>(null)
    const [pendingFile, setPendingFile]   = useState<File | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [logoVersion, setLogoVersion] = useState(0)

    // Initialiser le form quand les données arrivent
    useEffect(() => {
        if (config) {
            setForm({
                nom:       config.nom       ?? '',
                sousTitre: config.sousTitre ?? '',
                adresse:   config.adresse   ?? '',
                telephone: config.telephone ?? '',
                email:     config.email     ?? '',
            })
        }
    }, [config])

    const saveMutation = useMutation({
        mutationFn: (data: ConfigSalleRequest) => saveConfigSalle(data),
        onSuccess: () => {
            toast.success("Configuration sauvegardée")
            qc.invalidateQueries({ queryKey: ['configSalle'] })
        },
        onError: () => toast.error("Erreur lors de la sauvegarde"),
    })

    function setF(k: keyof ConfigSalleRequest, v: string) {
        setForm(f => ({ ...f, [k]: v }))
    }

    function handleFile(file: File) {
        setPendingFile(file)
        const reader = new FileReader()
        reader.onload = e => setLocalPreview(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    async function handleUploadLogo() {
        if (!pendingFile) return
        setUploadingLogo(true)
        try {
            await uploadLogo(pendingFile)
            toast.success("Logo mis à jour avec succès")
            setLocalPreview(null)
            setPendingFile(null)
            setLogoVersion(v => v + 1)
            qc.invalidateQueries({ queryKey: ['configSalle'] })
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erreur upload logo")
        } finally {
            setUploadingLogo(false)
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nom.trim()) { toast.error("Le nom de la salle est requis"); return }
        saveMutation.mutate(form)
    }

    if (isLoading) {
        return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>
    }

    const hasLogo = (config?.hasLogo ?? false) || !!localPreview
    // force cache-bust après upload
    const logoSrc = localPreview ?? (config?.hasLogo ? getLogoUrl() + `?v=${logoVersion}` : null)

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* ─── Header ───────────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary" />
                    Paramètres de la salle
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Ces informations apparaissent dans la sidebar, les tickets et les emails
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Colonne Logo ──────────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Logo de la salle</CardTitle>
                            <CardDescription>Affiché dans la sidebar, les tickets et les rapports email</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ZoneLogo
                                hasLogo={config?.hasLogo ?? false}
                                localPreview={localPreview}
                                nom={form.nom}
                                onFile={handleFile}
                            />
                            {pendingFile && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span className="truncate text-xs">{pendingFile.name}</span>
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleUploadLogo}
                                        disabled={uploadingLogo}
                                    >
                                        {uploadingLogo
                                            ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Upload…</>
                                            : <><Upload className="h-4 w-4 mr-2" /> Enregistrer le logo</>
                                        }
                                    </Button>
                                </div>
                            )}
                            {!pendingFile && !hasLogo && (
                                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ImageOff className="h-3.5 w-3.5" /> Aucun logo configuré
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Aperçu sidebar */}
                    <Card className="border-dashed">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Aperçu sidebar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center overflow-hidden shrink-0">
                                    {logoSrc
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={logoSrc} alt="logo" className="w-full h-full object-contain" />
                                        : <span className="text-sm font-black text-white">{form.nom?.charAt(0)?.toUpperCase() ?? 'G'}</span>
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-bold leading-tight">{form.nom || 'Nom de la salle'}</p>
                                    <p className="text-xs text-muted-foreground">{form.sousTitre || 'Sous-titre'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Colonne Formulaire ────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Informations de la salle</CardTitle>
                                <CardDescription>Utilisées sur les tickets, emails et dans l'interface</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">

                                {/* Nom + Sous-titre */}
                                <div className="p-4 rounded-lg border bg-primary/5 space-y-4">
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Identité visuelle</p>
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Nom de la salle <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            className="mt-1.5 text-base font-semibold"
                                            placeholder="TerangaGym"
                                            value={form.nom}
                                            onChange={e => setF('nom', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Affiché en grand dans la sidebar et sur les documents
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Sous-titre</Label>
                                        <Input
                                            className="mt-1.5"
                                            placeholder="Salle de sport & Fitness"
                                            value={form.sousTitre}
                                            onChange={e => setF('sousTitre', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Ligne secondaire sous le nom (ex: "Gestion salle")
                                        </p>
                                    </div>
                                </div>

                                {/* Coordonnées */}
                                <div className="space-y-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coordonnées</p>

                                    <div>
                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Adresse
                                        </Label>
                                        <Input
                                            className="mt-1.5"
                                            placeholder="Rue 10, Dakar, Sénégal"
                                            value={form.adresse}
                                            onChange={e => setF('adresse', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Téléphone
                                            </Label>
                                            <Input
                                                className="mt-1.5"
                                                placeholder="+221 77 000 00 00"
                                                value={form.telephone}
                                                onChange={e => setF('telephone', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email de contact
                                            </Label>
                                            <Input
                                                type="email" className="mt-1.5"
                                                placeholder="contact@terangagym.com"
                                                value={form.email}
                                                onChange={e => setF('email', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Aperçu ticket */}
                                <div className="p-4 rounded-lg border bg-muted/30">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aperçu ticket / reçu</p>
                                    <div className="bg-white border rounded-lg p-4 font-mono text-xs space-y-0.5 max-w-xs mx-auto text-center">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                                                {logoSrc
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    ? <img src={logoSrc} alt="" className="w-full h-full object-contain" />
                                                    : <span className="text-white font-black text-lg">{form.nom?.charAt(0)?.toUpperCase() ?? 'G'}</span>
                                                }
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm">{form.nom || 'Nom de la salle'}</p>
                                        {form.adresse && <p className="text-muted-foreground">{form.adresse}</p>}
                                        {form.telephone && <p className="text-muted-foreground">Tél: {form.telephone}</p>}
                                        {form.email && <p className="text-muted-foreground">{form.email}</p>}
                                        <div className="border-t mt-2 pt-2 text-muted-foreground">
                                            ─────────────────
                                        </div>
                                        <p className="text-muted-foreground">Merci de votre visite !</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        {saveMutation.isPending ? "Sauvegarde…" : "Sauvegarder les informations"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    )
}
