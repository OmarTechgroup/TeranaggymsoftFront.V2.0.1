import { NextRequest } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8086"

function fallbackSvg(size: number) {
    const r = Math.round(size * 0.19)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#f97316"/>
  <text x="${size / 2}" y="${Math.round(size * 0.72)}" font-size="${Math.round(size * 0.55)}" text-anchor="middle" font-family="Arial,sans-serif">💪</text>
</svg>`
    return new Response(svg, {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    })
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ size: string }> }
) {
    const { size } = await params
    const s = parseInt(size) || 192

    try {
        // Vérifier si la salle a un logo configuré
        const configRes = await fetch(`${API_URL}/api/config-salle`, { next: { revalidate: 300 } })
        if (!configRes.ok) return fallbackSvg(s)

        const config = await configRes.json()
        if (!config.hasLogo) return fallbackSvg(s)

        // Proxifier le logo depuis le backend (MinIO)
        const logoRes = await fetch(`${API_URL}/api/config-salle/logo`, { next: { revalidate: 300 } })
        if (!logoRes.ok) return fallbackSvg(s)

        const contentType = logoRes.headers.get("Content-Type") ?? "image/png"
        const buffer = await logoRes.arrayBuffer()

        return new Response(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        })
    } catch {
        return fallbackSvg(s)
    }
}
