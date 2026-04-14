"use client"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar
} from "@/components/ui/shared/sidebar"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, ShoppingCart, Package, BarChart, Settings, LogOut, MessageSquare, Boxes, ChartNoAxesCombined, UserCog, Briefcase, BookOpen, Mail, TrendingDown, LayoutGrid, Megaphone, Smartphone } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { getConfigSalle, getLogoUrl } from "@/services/configSalle.service"
import { getModulesActifs, ModuleKey } from "@/services/plan.service"
import { cn } from "@/lib/utils"

const navGroups = [
    {
        key: "principale",
        label: "Principale",
        items: [
            { title: "Tableau de bord",      href: "/dashboard",      icon: LayoutDashboard, roles: ["ADMIN", "SUPER_ADMIN", "CAISSIER", "MANAGER"], module: null },
            { title: "Gestion des Clients",  href: "/clients",        icon: Users,           roles: ["ADMIN", "SUPER_ADMIN", "CAISSIER", "MANAGER"], module: "CLIENTS" as ModuleKey },
            { title: "Point de vente (POS)", href: "/caisse",         icon: ShoppingCart,    roles: ["ADMIN", "SUPER_ADMIN", "CAISSIER", "MANAGER"], module: "CAISSE" as ModuleKey },
            { title: "Rapport du jour",      href: "/rapport-caisse", icon: BarChart,        roles: ["CAISSIER", "ADMIN", "SUPER_ADMIN", "MANAGER"], module: "CAISSE" as ModuleKey },
        ],
    },
    {
        key: "gestion",
        label: "Gestion",
        items: [
            { title: "Gestion des Produits", href: "/produits",      icon: Package,      roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"], module: "PRODUITS" as ModuleKey },
            { title: "Gestion de Stock",     href: "/gestion-stock", icon: Boxes,        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"], module: "STOCK" as ModuleKey },
            { title: "Gestion des Dépenses", href: "/depenses",      icon: TrendingDown, roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"], module: "DEPENSES" as ModuleKey },
            { title: "Employés",             href: "/employes",      icon: Briefcase,    roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"], module: "EMPLOYES" as ModuleKey },
        ],
    },
    {
        key: "finance",
        label: "Analyse & Finance",
        items: [
            { title: "Comptabilité", href: "/comptabilite", icon: BookOpen,             roles: ["ADMIN", "SUPER_ADMIN"],           module: "COMPTABILITE" as ModuleKey },
            { title: "Rapports",     href: "/rapports",     icon: ChartNoAxesCombined,  roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"], module: "RAPPORTS" as ModuleKey },
        ],
    },
    {
        key: "outils",
        label: "Outils & Automatisation",
        items: [
            { title: "Chat IA",            href: "/chat",         icon: MessageSquare, roles: ["SUPER_ADMIN"],                    module: "CHAT_IA" as ModuleKey },
            { title: "Rapport auto email", href: "/rapport-auto", icon: Mail,          roles: ["SUPER_ADMIN"],                    module: "RAPPORT_EMAIL" as ModuleKey },
            { title: "Marketing Push",     href: "/marketing",    icon: Megaphone,     roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"], module: "MARKETING_PUSH" as ModuleKey },
            { title: "Portail Client",     href: "/portal-admin", icon: Smartphone,    roles: ["SUPER_ADMIN", "ADMIN"],            module: "PORTAIL_CLIENT" as ModuleKey },
        ],
    },
    {
        key: "admin",
        label: "Administration",
        items: [
            { title: "Utilisateurs",  href: "/utilisateurs", icon: UserCog,    roles: ["SUPER_ADMIN", "ADMIN"], module: "UTILISATEURS" as ModuleKey },
            { title: "Plans & Accès", href: "/plans",        icon: LayoutGrid, roles: ["SUPER_ADMIN"],          module: null },
            { title: "Paramètres",    href: "/parametres",   icon: Settings,   roles: ["SUPER_ADMIN", "ADMIN"], module: null },
        ],
    },
]

export function AppSidebar() {
    const { state } = useSidebar()
    const { user, logout } = useAuth()
    const pathname = usePathname()

    const { data: config } = useQuery({
        queryKey: ['configSalle'],
        queryFn: getConfigSalle,
        staleTime: 5 * 60 * 1000,
    })

    const { data: modulesActifs } = useQuery({
        queryKey: ['modulesActifs'],
        queryFn: getModulesActifs,
        staleTime: 2 * 60 * 1000,
    })

    const nomSalle = config?.nom ?? 'TerangaGym'
    const sousTitre = config?.sousTitre ?? 'Gestion salle'
    const initiale = nomSalle.charAt(0).toUpperCase()
    const logoUrl = config?.hasLogo ? getLogoUrl() : null

    const isCollapsed = state === "collapsed"

    return (
        <Sidebar collapsible="icon">

            {/* ── HEADER ── */}
            <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
                {!isCollapsed &&
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Logo / initiale */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                            {logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt={nomSalle}
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-contain"
                                    unoptimized
                                />
                            ) : (
                                <span className="font-black text-sm text-white">{initiale}</span>
                            )}
                        </div>

                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-sidebar-accent-foreground truncate leading-tight">{nomSalle}</span>
                            <span className="text-[11px] text-sidebar-foreground/60 truncate leading-tight mt-0.5">{sousTitre}</span>
                        </div>

                    </div>
                }
            </SidebarHeader>

            {/* ── CONTENT ── */}
            <SidebarContent className="px-2 py-3 gap-0">
                {navGroups.map((group, gi) => {
                    const visibleItems = group.items.filter(item =>
                        item.roles.includes(user?.roles ?? "") &&
                        (item.module === null || !modulesActifs || modulesActifs.includes(item.module))
                    )
                    if (visibleItems.length === 0) return null
                    return (
                        <SidebarGroup key={group.key} className="px-0 py-0 mb-1">
                            {!isCollapsed && (
                                <SidebarGroupLabel className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                                    {group.label}
                                </SidebarGroupLabel>
                            )}
                            {isCollapsed && gi > 0 && (
                                <div className="mx-auto my-2 w-5 border-t border-sidebar-border" />
                            )}
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visibleItems.map(item => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    tooltip={item.title}
                                                    className={cn(
                                                        "h-9 rounded-lg px-3 gap-3 text-[13px] font-medium transition-all",
                                                        "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent",
                                                        isActive && "bg-blue-600/20 text-blue-400 hover:bg-blue-600/25 hover:text-blue-400"
                                                    )}
                                                >
                                                    <Link href={item.href}>
                                                        <item.icon className={cn("h-[17px] w-[17px] shrink-0", isActive ? "text-blue-400" : "text-sidebar-foreground/70")} />
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        )
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )
                })}
            </SidebarContent>

            {/* ── FOOTER ── */}
            <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-[13px] font-medium text-sidebar-accent-foreground truncate leading-tight">{user?.username}</span>
                                <span className="text-[11px] text-sidebar-foreground/50 truncate leading-tight mt-0.5">{user?.roles}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="ml-auto text-sidebar-foreground/40 hover:text-red-400 transition-colors cursor-pointer p-1 rounded"
                                title="Déconnexion"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </SidebarFooter>

        </Sidebar>
    )
}
