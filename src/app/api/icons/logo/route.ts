import { NextRequest } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8086"

function fallbackSvg() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#f97316"/>
  <text x="256" y="330" font-size="280" text-anchor="middle" font-family="Arial,sans-serif">💪</text>
</svg>`
    return new Response(svg, {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    })
}

export async function GET(_req: NextRequest) {
    try {
        const configRes = await fetch(`${API_URL}/api/config-salle`, { next: { revalidate: 300 } })
        if (!configRes.ok) return fallbackSvg()
        const config = await configRes.json()
        if (!config.hasLogo) return fallbackSvg()

        const logoRes = await fetch(`${API_URL}/api/config-salle/logo`, { next: { revalidate: 300 } })
        if (!logoRes.ok) return fallbackSvg()

        const contentType = logoRes.headers.get("Content-Type") ?? "image/png"
        const buffer = await logoRes.arrayBuffer()
        return new Response(buffer, {
            headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
        })
    } catch {
        return fallbackSvg()
    }
}
