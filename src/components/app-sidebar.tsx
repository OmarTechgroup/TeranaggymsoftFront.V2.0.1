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
import { LayoutDashboard, Users, ShoppingCart, Package, BarChart, Settings, LogOut, MessageSquare, Boxes, ChartNoAxesCombined, UserCog, Briefcase, BookOpen, Mail, TrendingDown } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { getConfigSalle, getLogoUrl } from "@/services/configSalle.service"





const navItems = [
    {
        //principale
        group: "principale",
        title: "Tableau de bord",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "SUPER_ADMIN", "CAISSIER", "MANAGER"],
    },
    {
        group: "principale",
        title: "Gestion des Clients",
        href: "/clients",
        icon: Users,
        roles: ["ADMIN", "SUPER_ADMIN", "CAISSIER", "MANAGER"],
    },
    {
        group: "principale",
        title: "Point de vente",
        href: "/caisse",
        icon: ShoppingCart,
        roles: ["ADMIN", "SUPER_ADMIN", "CAISSIER", "MANAGER"],
    },
    {
        group: "principale",
        title: "Rapport du jour",
        href: "/rapport-caisse",
        icon: BarChart,
        roles: ["CAISSIER", "ADMIN", "SUPER_ADMIN", "MANAGER"],
    },


    {
        //GESTION
        group: "gestion",
        title: "Gestion des Produits",
        href: "/produits",
        icon: Package,
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
    {
        group: "gestion",
        title: "Gestion de Stock",
        href: "/gestion-stock",
        icon: Boxes,
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
    {
        group: "gestion",
        title: "Gestion des Dépenses",
        href: "/depenses",
        icon: TrendingDown,
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
    {
        group: "gestion",
        title: "Gestion des Employes",
        href: "/employes",
        icon: Briefcase,
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },


    {
        //Analyse & Finance
        group: "Analyse & Finance",
        title: "Comptabilité",
        href: "/comptabilite",
        icon: BookOpen,
        roles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
        group: "principale",
        title: "Rapports",
        href: "/rapports",
        icon: ChartNoAxesCombined,
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },


    {
        //Outils & Automatisation
        group: "Outils & Automatisation",
        title: "Chat IA",
        href: "/chat",
        icon: MessageSquare,
        roles: ["SUPER_ADMIN",],
    },
    {
        group: "Outils & Automatisation",
        title: "Rapport auto email",
        href: "/rapport-auto",
        icon: Mail,
        roles: ["SUPER_ADMIN"],
    },
    {
        group: "Administration",
        title: "Utilisateurs",
        href: "/utilisateurs",
        icon: UserCog,
        roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
        group: "Administration",
        title: "Paramètres",
        href: "/parametres",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN"],
    },
]
export function AppSidebar() {

    const { state } = useSidebar()
    const { user, logout } = useAuth()

    const { data: config } = useQuery({
        queryKey: ['configSalle'],
        queryFn: getConfigSalle,
        staleTime: 5 * 60 * 1000,   // 5 min — ne recharge pas à chaque navigation
    })

    const nomSalle    = config?.nom       ?? 'TerangaGym'
    const sousTitre   = config?.sousTitre ?? 'Gestion salle'
    const initiale    = nomSalle.charAt(0).toUpperCase()
    const logoUrl     = config?.hasLogo ? getLogoUrl() : null

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg">
                            {/* Logo ou initiale */}
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold overflow-hidden">
                                {logoUrl ? (
                                    <Image
                                        src={logoUrl}
                                        alt={nomSalle}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-contain"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="font-black text-sm">{initiale}</span>
                                )}
                            </div>
                            {state === "expanded" && (
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-sm truncate">{nomSalle}</span>
                                    <span className="text-xs text-muted-foreground truncate">{sousTitre}</span>
                                </div>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>

                {/*principale*/}
                <SidebarGroup>
                    <SidebarGroupLabel>Principale</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems
                                .filter(item => item.group === "principale" && item.roles.includes(user?.roles ?? ""))
                                .map(items => (
                                    <SidebarMenuItem key={items.title}>
                                        <SidebarMenuButton asChild tooltip={items.title}>
                                            <Link href={items.href}>
                                                <items.icon />
                                                <span>{items.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/*gestion*/}
                <SidebarGroup>
                    <SidebarGroupLabel>Gestion</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems
                                .filter(item => item.group === "gestion" && item.roles.includes(user?.roles ?? ""))
                                .map(items => (
                                    <SidebarMenuItem key={items.title}>
                                        <SidebarMenuButton asChild tooltip={items.title}>
                                            <Link href={items.href}>
                                                <items.icon />
                                                <span>{items.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/*Analyse & Finance*/}
                <SidebarGroup>
                    <SidebarGroupLabel>Analyse & Finance</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems
                                .filter(item => item.group === "Analyse & Finance" && item.roles.includes(user?.roles ?? ""))
                                .map(items => (
                                    <SidebarMenuItem key={items.title}>
                                        <SidebarMenuButton asChild tooltip={items.title}>
                                            <Link href={items.href}>
                                                <items.icon />
                                                <span>{items.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/*Outils & Automatisation*/}
                <SidebarGroup>
                    <SidebarGroupLabel>Outils & Automatisation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems
                                .filter(item => item.group === "Outils & Automatisation" && item.roles.includes(user?.roles ?? ""))
                                .map(items => (
                                    <SidebarMenuItem key={items.title}>
                                        <SidebarMenuButton asChild tooltip={items.title}>
                                            <Link href={items.href}>
                                                <items.icon />
                                                <span>{items.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/*Administration*/}
                <SidebarGroup>
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems
                                .filter(item => item.group === "Administration" && item.roles.includes(user?.roles ?? ""))
                                .map(items => (
                                    <SidebarMenuItem key={items.title}>
                                        <SidebarMenuButton asChild tooltip={items.title}>
                                            <Link href={items.href}>
                                                <items.icon />
                                                <span>{items.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/*Paramètres*/}
                {/* <SidebarGroup>
                    <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems
                                .filter(item => item.group === "parametres" && item.roles.includes(user?.roles ?? ""))
                                .map(items => (
                                    <SidebarMenuItem key={items.title}>
                                        <SidebarMenuButton asChild tooltip={items.title}>
                                            <Link href={items.href}>
                                                <items.icon />
                                                <span>{items.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup> */}

            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            {state === "expanded" && (
                                <>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">{user?.username}</span>
                                        <span className="text-xs text-muted-foreground truncate">{user?.roles}</span>
                                    </div>
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => { e.stopPropagation(); logout() }}
                                        onKeyDown={(e) => e.key === 'Enter' && logout()}
                                        className="ml-auto cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </span>
                                </>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}