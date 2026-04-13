import { AuthProvider } from '../context/AuthContext'
import { SidebarProvider } from '@/components/ui/shared/sidebar'
import { TooltipProvider } from '@/components/ui/shared/tooltip'
import React from 'react'
import { AppSidebar } from '@/components/app-sidebar'


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <TooltipProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {children}
                    </div>
                </SidebarProvider>
            </TooltipProvider>
        </AuthProvider>
    )
}
