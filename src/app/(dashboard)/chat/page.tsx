"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Zap, Database } from "lucide-react"
import { Button } from "@/components/ui/shared/button"
import { Textarea } from "@/components/ui/shared/textarea"
import { getAllClients } from "@/services/client.service"
import { getClientsExpirants } from "@/services/abonnement.service"
import { getRapport } from "@/services/vente.service"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
}

async function queryDatabase(question: string): Promise<string> {
    const q = question.toLowerCase()

    try {
        // Questions sur les clients
        if (q.includes("client") || q.includes("membre") || q.includes("combien")) {
            const clients = await getAllClients()

            if (q.includes("combien") || q.includes("nombre") || q.includes("total")) {
                return `Il y a actuellement **${clients.length} client(s)** enregistré(s) dans la base de données.`
            }

            if (q.includes("liste") || q.includes("tous") || q.includes("affiche")) {
                if (clients.length === 0) return "Aucun client trouvé dans la base de données."
                const liste = clients.slice(0, 10).map(c => `- **${c.nom}** — ${c.telephone}`).join("\n")
                const suite = clients.length > 10 ? `\n\n*...et ${clients.length - 10} autres clients.*` : ""
                return `Voici les clients enregistrés :\n\n${liste}${suite}`
            }

            // Recherche par nom
            const found = clients.filter(c =>
                c.nom.toLowerCase().includes(q) ||
                (c.telephone && q.includes(c.telephone))
            )
            if (found.length > 0) {
                return found.map(c =>
                    `**${c.nom}**\n- Téléphone : ${c.telephone}\n- Email : ${c.email || "N/A"}\n- Inscrit le : ${new Date(c.date_inscription).toLocaleDateString("fr-FR")}`
                ).join("\n\n")
            }

            return `Il y a **${clients.length} client(s)** dans la base. Posez une question plus précise ou demandez la liste complète.`
        }

        // Questions sur les abonnements expirants
        if (q.includes("expir") || q.includes("abonnement") || q.includes("renouvel")) {
            const expirants = await getClientsExpirants()
            if (expirants.length === 0) {
                return "Aucun abonnement n'expire prochainement."
            }
            const liste = expirants.map(c =>
                `- **${c.nom}** (${c.telephone}) — ${c.typeAbonnement} expire le ${new Date(c.dateFin).toLocaleDateString("fr-FR")}`
            ).join("\n")
            return `**${expirants.length} abonnement(s) expirant(s) :**\n\n${liste}`
        }

        // Questions sur les ventes / rapports du jour
        if (q.includes("vente") || q.includes("rapport") || q.includes("caisse") || q.includes("aujourd") || q.includes("chiffre") || q.includes("recette")) {
            const rapport = await getRapportJour()
            return `**Rapport du jour :**\n- Nombre de ventes : ${rapport.ventes.length}\n- Total encaissé : **${rapport.total.toLocaleString("fr-FR")} FCFA**`
        }

        return "Je n'ai pas trouvé de données correspondantes. Essayez de demander les **clients**, les **abonnements expirants** ou les **ventes du jour**.\n\nActivez le mode **Explorer plus** pour des réponses générales."
    } catch {
        return "Impossible d'accéder à la base de données pour le moment. Vérifiez la connexion au serveur."
    }
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "0",
            role: "assistant",
            content: "Bonjour ! Je suis l'assistant TerangaGym. Je peux répondre à vos questions sur les **clients**, les **abonnements** et les **ventes**.\n\nActivez **Explorer plus** pour des réponses générales (hors base de données).",
        },
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [exploreMode, setExploreMode] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    async function handleSend() {
        if (!input.trim() || loading) return

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        let responseText = ""

        if (exploreMode) {
            // Mode Explorer : appel Claude API via route Next.js
            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: input.trim() }),
                })
                const data = await res.json()
                responseText = data.reply ?? "Pas de réponse."
            } catch {
                responseText = "Erreur lors de la connexion au service IA externe."
            }
        } else {
            responseText = await queryDatabase(input.trim())
        }

        const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: responseText,
        }
        setMessages(prev => [...prev, assistantMsg])
        setLoading(false)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    function renderContent(content: string) {
        // Simple markdown : bold et retours à la ligne
        return content
            .split("\n")
            .map((line, i) => {
                const parts = line.split(/\*\*(.*?)\*\*/g)
                return (
                    <p key={i} className={i > 0 ? "mt-1" : ""}>
                        {parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                    </p>
                )
            })
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-card shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-sm">Assistant TerangaGym</h1>
                        <p className="text-xs text-muted-foreground">
                            {exploreMode ? "Mode Explorer activé" : "Mode base de données"}
                        </p>
                    </div>
                </div>

                {/* Toggle Explorer */}
                <button
                    onClick={() => setExploreMode(prev => !prev)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${exploreMode
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    {exploreMode ? <Zap className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                    {exploreMode ? "Explorer plus" : "Base de données"}
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted text-foreground rounded-tl-none"
                                    }`}
                            >
                                {renderContent(msg.content)}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 flex-row">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                                <div className="flex gap-1 items-center h-5">
                                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input */}
            <div className="border-t bg-card px-4 py-4">
                <div className="max-w-3xl mx-auto flex gap-3 items-end">
                    <Textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            exploreMode
                                ? "Posez n'importe quelle question..."
                                : "Combien de clients ? Abonnements expirants ? Ventes du jour ?"
                        }
                        className="resize-none min-h-[48px] max-h-[160px] rounded-xl text-sm"
                        rows={1}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        size="icon"
                        className="h-12 w-12 rounded-xl shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                    {exploreMode
                        ? "Mode Explorer : réponses générales via IA"
                        : "Mode Base de données : réponses basées sur vos données TerangaGym"}
                </p>
            </div>
        </div>
    )
}
