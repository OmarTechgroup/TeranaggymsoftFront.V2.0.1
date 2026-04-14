const BASE_URL = process.env.NEXT_PUBLIC_API_URL

function getToken() {
    if (typeof window !== 'undefined') return localStorage.getItem('token')
    return null
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken()

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    })
    if (res.status === 204) {
        return undefined as T // no body
    }

    if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`)

    const text = await res.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
}