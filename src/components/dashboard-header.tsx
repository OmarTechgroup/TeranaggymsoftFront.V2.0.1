'use client'
import { SidebarTrigger } from "@/components/ui/shared/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/shared/breadcrumb"
import { Separator } from "@/components/ui/shared/separator"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/shared/button"

interface DashboardHeaderProps {
    title: string
    children?: React.ReactNode
}

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Actions à droite */}
            <div className="ml-auto flex items-center gap-2">
                {children}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                        2
                    </span>
                </Button>
                <ThemeSwitcher />
            </div>
        </header>
    )
}
