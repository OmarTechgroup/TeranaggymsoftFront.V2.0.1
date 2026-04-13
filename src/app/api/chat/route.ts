import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const { message } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        return NextResponse.json(
            { reply: "Le mode Explorer n'est pas configuré. Ajoutez ANTHROPIC_API_KEY dans vos variables d'environnement." },
            { status: 200 }
        )
    }

    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 1024,
                system: "Tu es un assistant utile pour une salle de sport appelée TerangaGym au Sénégal. Réponds en français de manière concise et professionnelle.",
                messages: [{ role: "user", content: message }],
            }),
        })

        const data = await res.json()
        const reply = data.content?.[0]?.text ?? "Pas de réponse de l'IA."
        return NextResponse.json({ reply })
    } catch {
        return NextResponse.json({ reply: "Erreur lors de la connexion à l'IA externe." })
    }
}
