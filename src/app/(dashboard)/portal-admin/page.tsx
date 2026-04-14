'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Smartphone, QrCode, Bell, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

const PORTAL_URL = (typeof window !== 'undefined' ? window.location.origin : '') + '/portal'

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
            <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
        </div>
    )
}

export default function PortalAdminPage() {
    const url = '/portal'

    function copy() {
        navigator.clipboard.writeText(window.location.origin + url)
        toast.success("Lien copié !")
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">Portail Client</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Application mobile PWA pour vos membres</p>
            </div>

            {/* Lien portail */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Lien d'accès membre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3 border">
                        <code className="flex-1 text-sm font-mono text-primary break-all">{url}</code>
                        <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground">
                            <Copy className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Partagez ce lien à vos clients. Ils se connectent avec leur <strong>numéro membre (ID)</strong> et leur <strong>numéro de carte</strong>.
                    </p>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        <ExternalLink className="h-4 w-4" /> Ouvrir le portail
                    </a>
                </CardContent>
            </Card>

            {/* Fonctionnalités */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Fonctionnalités disponibles pour les membres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <InfoCard
                        icon={<Smartphone className="h-5 w-5 text-primary" />}
                        title="Application installable (PWA)"
                        desc="Le client peut ajouter l'app sur son téléphone depuis le navigateur — icône sur l'écran d'accueil, comme une vraie app."
                    />
                    <InfoCard
                        icon={<QrCode className="h-5 w-5 text-primary" />}
                        title="QR Code personnel"
                        desc="Affiche le QR code lié au numéro de carte. Agrandissable plein écran pour le scanner à l'entrée."
                    />
                    <InfoCard
                        icon={<Bell className="h-5 w-5 text-primary" />}
                        title="Notifications push automatiques"
                        desc="Le client reçoit des alertes J-7, J-3 et J-0 avant l'expiration de son abonnement. Fonctionne même si l'app est fermée."
                    />
                    <InfoCard
                        icon={<span className="text-xl">📷</span>}
                        title="Photo de profil"
                        desc="Le client peut uploader sa photo une seule fois depuis l'espace membre (stockée dans MinIO)."
                    />
                </CardContent>
            </Card>

            {/* Config Firebase */}
            <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-amber-700 dark:text-amber-400">⚠️ Configuration Firebase requise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">Pour activer les notifications FCM, vous devez :</p>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Créer un projet sur <strong>console.firebase.google.com</strong></li>
                        <li>Télécharger <code className="bg-muted px-1 rounded text-xs">firebase-service-account.json</code> (Service Accounts) et le placer dans <code className="bg-muted px-1 rounded text-xs">TerangaGymApp/src/main/resources/</code></li>
                        <li>Copier la config Web App Firebase dans <code className="bg-muted px-1 rounded text-xs">.env.local</code> du frontend :
                            <pre className="bg-muted rounded-lg p-3 text-xs mt-2 overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...`}
                            </pre>
                        </li>
                        <li>Mettre à jour <code className="bg-muted px-1 rounded text-xs">public/firebase-messaging-sw.js</code> avec votre config Firebase</li>
                        <li>Rebuilder backend + frontend</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    )
}
