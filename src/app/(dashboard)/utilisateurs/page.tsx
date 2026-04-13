'use client'
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getAllUsers, createUser, updateUserRole, resetUserPassword, deleteUser,
    UserDto, UserRole
} from "@/services/user.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared/card"
import { Button } from "@/components/ui/shared/button"
import { Input } from "@/components/ui/shared/input"
import { Label } from "@/components/ui/shared/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/shared/dialog"
import { toast } from "sonner"
import { UserCog, Plus, Pencil, KeyRound, Trash2, Shield, ShieldCheck, ShieldAlert, User } from "lucide-react"

// ─── Rôles disponibles ───────────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; color: string }[] = [
    { value: 'CAISSIER', label: 'Caissier', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'MANAGER', label: 'Manager', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'ADMIN', label: 'Admin', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-primary/10 text-primary border-primary/20' },
]

function roleBadge(role: UserRole) {
    const r = ROLES.find(r => r.value === role)
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${r?.color ?? 'bg-muted text-muted-foreground'}`}>
            {role === 'SUPER_ADMIN' && <ShieldCheck className="h-3 w-3" />}
            {role === 'ADMIN' && <Shield className="h-3 w-3" />}
            {role === 'MANAGER' && <ShieldAlert className="h-3 w-3" />}
            {role === 'CAISSIER' && <User className="h-3 w-3" />}
            {r?.label ?? role}
        </span>
    )
}

// ─── Modal Créer utilisateur ──────────────────────────────────────────────────
function ModalCreer({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ username: '', phone: '', password: '', role: 'CAISSIER' as UserRole })
    const [showPwd, setShowPwd] = useState(false)

    const { mutate, isPending } = useMutation({
        mutationFn: () => createUser(form),
        onSuccess: () => { toast.success("Utilisateur créé"); onSuccess(); onOpenChange(false); setForm({ username: '', phone: '', password: '', role: 'CAISSIER' }) },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouvel utilisateur
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label>Nom d'utilisateur *</Label>
                        <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="ex: caisse01" />
                    </div>
                    <div className="space-y-1">
                        <Label>Téléphone *</Label>
                        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="77XXXXXXX" />
                    </div>
                    <div className="space-y-1">
                        <Label>Mot de passe *</Label>
                        <div className="relative">
                            <Input
                                type={showPwd ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="Min. 8 caractères"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {showPwd ? 'Masquer' : 'Afficher'}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Rôle *</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <label
                                    key={r.value}
                                    className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all ${form.role === r.value ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40'}`}
                                >
                                    <input type="radio" value={r.value} checked={form.role === r.value} onChange={() => setForm(f => ({ ...f, role: r.value }))} className="sr-only" />
                                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border ${r.color}`}>
                                        {r.label.charAt(0)}
                                    </span>
                                    <span className="text-sm font-medium">{r.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button className="flex-1" onClick={() => mutate()} disabled={isPending || !form.username || !form.phone || form.password.length < 8}>
                            {isPending ? "Création…" : "Créer l'utilisateur"}
                        </Button>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Modal Changer rôle ───────────────────────────────────────────────────────
function ModalRole({ user, onClose, onSuccess }: { user: UserDto; onClose: () => void; onSuccess: () => void }) {
    const [role, setRole] = useState<UserRole>(user.role)

    const { mutate, isPending } = useMutation({
        mutationFn: () => updateUserRole(user.id, role),
        onSuccess: () => { toast.success("Rôle mis à jour"); onSuccess(); onClose() },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" /> Changer le rôle — {user.username}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                        {ROLES.map(r => (
                            <label
                                key={r.value}
                                className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all ${role === r.value ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40'}`}
                            >
                                <input type="radio" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="sr-only" />
                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border ${r.color}`}>
                                    {r.label.charAt(0)}
                                </span>
                                <span className="text-sm font-medium">{r.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => mutate()} disabled={isPending || role === user.role}>
                            {isPending ? "Mise à jour…" : "Confirmer"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Modal Reset password ─────────────────────────────────────────────────────
function ModalPassword({ user, onClose, onSuccess }: { user: UserDto; onClose: () => void; onSuccess: () => void }) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPwd, setShowPwd] = useState(false)

    const { mutate, isPending } = useMutation({
        mutationFn: () => resetUserPassword(user.id, password),
        onSuccess: () => { toast.success("Mot de passe réinitialisé"); onSuccess(); onClose() },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    const valid = password.length >= 8 && password === confirm

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" /> Réinitialiser — {user.username}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label>Nouveau mot de passe *</Label>
                        <div className="relative">
                            <Input
                                type={showPwd ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 caractères"
                            />
                            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                                {showPwd ? 'Masquer' : 'Afficher'}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Confirmer *</Label>
                        <Input
                            type={showPwd ? 'text' : 'password'}
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder="Répéter le mot de passe"
                            className={confirm && !valid ? 'border-destructive' : ''}
                        />
                        {confirm && password !== confirm && (
                            <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => mutate()} disabled={isPending || !valid}>
                            {isPending ? "Réinitialisation…" : "Confirmer"}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Modal Supprimer ──────────────────────────────────────────────────────────
function ModalSupprimer({ user, onClose, onSuccess }: { user: UserDto; onClose: () => void; onSuccess: () => void }) {
    const { mutate, isPending } = useMutation({
        mutationFn: () => deleteUser(user.id),
        onSuccess: () => { toast.success("Utilisateur supprimé"); onSuccess(); onClose() },
        onError: (e: Error) => toast.error(e.message ?? "Erreur"),
    })

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Supprimer l'utilisateur
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-2 space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span className="font-medium">{user.username}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span>{user.phone}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Rôle</span>{roleBadge(user.role)}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">Cette action est <span className="font-semibold text-destructive">irréversible</span>. L'utilisateur ne pourra plus se connecter.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Annuler</Button>
                        <Button variant="destructive" className="flex-1" onClick={() => mutate()} disabled={isPending}>
                            {isPending ? "Suppression…" : "Supprimer"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function UtilisateursPage() {
    const queryClient = useQueryClient()
    const [modalCreer, setModalCreer] = useState(false)
    const [modalRole, setModalRole] = useState<UserDto | null>(null)
    const [modalPwd, setModalPwd] = useState<UserDto | null>(null)
    const [modalDel, setModalDel] = useState<UserDto | null>(null)
    const [search, setSearch] = useState('')

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers,
        staleTime: 30_000,
    })

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] })

    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    )

    // Stats par rôle
    const countByRole = (role: UserRole) => users.filter(u => u.role === role).length

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserCog className="h-6 w-6 text-primary" />
                        Gestion des utilisateurs
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Gérez les comptes et permissions des utilisateurs de l'application</p>
                </div>
                <Button onClick={() => setModalCreer(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Nouvel utilisateur
                </Button>
            </div>

            {/* Stats rôles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {ROLES.map(r => (
                    <Card key={r.value}>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">{r.label}</p>
                                    <p className="text-2xl font-bold mt-0.5">{isLoading ? '—' : countByRole(r.value)}</p>
                                </div>
                                <span className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border ${r.color}`}>
                                    {r.label.charAt(0)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Liste */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
                    <CardTitle className="text-base">Utilisateurs ({filtered.length})</CardTitle>
                    <Input
                        placeholder="Rechercher par nom, téléphone ou rôle…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="max-w-xs h-8"
                    />
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>
                    ) : filtered.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center gap-2">
                            <UserCog className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Téléphone</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((u, i) => (
                                        <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{u.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
                                            <td className="px-4 py-3">{roleBadge(u.role)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        title="Changer le rôle"
                                                        onClick={() => setModalRole(u)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                                                        title="Réinitialiser le mot de passe"
                                                        onClick={() => setModalPwd(u)}
                                                    >
                                                        <KeyRound className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        title="Supprimer"
                                                        onClick={() => setModalDel(u)}
                                                        disabled={u.role === 'SUPER_ADMIN'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <ModalCreer open={modalCreer} onOpenChange={setModalCreer} onSuccess={refresh} />
            {modalRole && <ModalRole user={modalRole} onClose={() => setModalRole(null)} onSuccess={refresh} />}
            {modalPwd && <ModalPassword user={modalPwd} onClose={() => setModalPwd(null)} onSuccess={refresh} />}
            {modalDel && <ModalSupprimer user={modalDel} onClose={() => setModalDel(null)} onSuccess={refresh} />}
        </div>
    )
}
