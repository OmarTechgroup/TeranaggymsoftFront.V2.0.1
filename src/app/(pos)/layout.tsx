// Layout sans sidebar pour le point de vente
export default function PosLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {children}
        </div>
    )
}
